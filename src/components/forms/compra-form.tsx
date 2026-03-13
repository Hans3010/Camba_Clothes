"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2, ChevronsUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface Proveedor {
  id: number
  nombreEmpresa: string
}

interface Producto {
  id: number
  nombreProducto: string
  costo: number
  stock: number
}

interface ItemCarrito {
  idProducto: number
  nombreProducto: string
  cantidad: number
  precioCompra: number
}

interface CompraFormProps {
  proveedores: Proveedor[]
  productos: Producto[]
  onSuccess: () => void
}

export default function CompraForm({ proveedores, productos, onSuccess }: CompraFormProps) {
  const [idProveedor, setIdProveedor] = useState<number | null>(null)
  const [numeroDocumento, setNumeroDocumento] = useState("")
  const [tipoDocumento, setTipoDocumento] = useState("")
  const [descuento, setDescuento] = useState(0)
  const [items, setItems] = useState<ItemCarrito[]>([])
  const [loading, setLoading] = useState(false)

  // Combobox state
  const [openCombo, setOpenCombo] = useState(false)
  const [productoSelId, setProductoSelId] = useState<number | "">("")
  const [cantidadSel, setCantidadSel] = useState(1)
  const [precioCostSel, setPrecioCostSel] = useState(0)

  const productoSel = productos.find((p) => p.id === productoSelId)

  const handleSelectProducto = (id: number) => {
    setProductoSelId(id)
    const prod = productos.find((p) => p.id === id)
    if (prod) setPrecioCostSel(Number(prod.costo))
    setOpenCombo(false)
  }

  const handleAgregarItem = () => {
    if (!productoSelId || cantidadSel < 1 || precioCostSel <= 0) {
      toast.error("Selecciona un producto, cantidad y precio válidos")
      return
    }
    const prod = productos.find((p) => p.id === productoSelId)
    if (!prod) return

    const yaExiste = items.find((i) => i.idProducto === productoSelId)
    if (yaExiste) {
      setItems((prev) =>
        prev.map((i) =>
          i.idProducto === productoSelId
            ? { ...i, cantidad: i.cantidad + cantidadSel, precioCompra: precioCostSel }
            : i
        )
      )
    } else {
      setItems((prev) => [
        ...prev,
        {
          idProducto: productoSelId as number,
          nombreProducto: prod.nombreProducto,
          cantidad: cantidadSel,
          precioCompra: precioCostSel,
        },
      ])
    }
    setProductoSelId("")
    setCantidadSel(1)
    setPrecioCostSel(0)
  }

  const handleRemoveItem = (idProducto: number) => {
    setItems((prev) => prev.filter((i) => i.idProducto !== idProducto))
  }

  const handleUpdateCantidad = (idProducto: number, value: number) => {
    if (value < 1) return
    setItems((prev) =>
      prev.map((i) => (i.idProducto === idProducto ? { ...i, cantidad: value } : i))
    )
  }

  const handleUpdatePrecio = (idProducto: number, value: number) => {
    if (value < 0) return
    setItems((prev) =>
      prev.map((i) => (i.idProducto === idProducto ? { ...i, precioCompra: value } : i))
    )
  }

  const subtotal = items.reduce((acc, i) => acc + i.precioCompra * i.cantidad, 0)
  const total = subtotal - descuento

  const handleSubmit = async () => {
    if (!idProveedor) { toast.error("Selecciona un proveedor"); return }
    if (items.length === 0) { toast.error("Agrega al menos un producto"); return }
    if (total < 0) { toast.error("El descuento no puede ser mayor al subtotal"); return }

    try {
      setLoading(true)
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProveedor,
          numeroDocumento: numeroDocumento || undefined,
          tipoDocumento: tipoDocumento || undefined,
          descuento,
          items: items.map(({ idProducto, cantidad, precioCompra }) => ({
            idProducto,
            cantidad,
            precioCompra,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al registrar")

      toast.success("Compra registrada correctamente")
      setIdProveedor(null)
      setNumeroDocumento("")
      setTipoDocumento("")
      setDescuento(0)
      setItems([])
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar compra")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Datos de la compra */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Proveedor <span className="text-destructive">*</span></Label>
          <Select
            value={idProveedor ? String(idProveedor) : ""}
            onValueChange={(v) => setIdProveedor(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona proveedor" />
            </SelectTrigger>
            <SelectContent>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.nombreEmpresa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Nº Documento</Label>
          <Input
            placeholder="Ej: FAC-001"
            value={numeroDocumento}
            onChange={(e) => setNumeroDocumento(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo Documento</Label>
          <Input
            placeholder="Ej: Factura, Recibo"
            value={tipoDocumento}
            onChange={(e) => setTipoDocumento(e.target.value)}
          />
        </div>
      </div>

      <Separator />

      {/* Selector de producto con búsqueda */}
      <div>
        <p className="text-sm font-medium mb-3">Agregar productos a la compra</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Producto</Label>
            <Popover open={openCombo} onOpenChange={setOpenCombo}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombo}
                  className="w-full justify-between font-normal"
                >
                  {productoSel ? (
                    <span className="truncate">{productoSel.nombreProducto}</span>
                  ) : (
                    <span className="text-muted-foreground">Buscar producto...</span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[380px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar por nombre..." />
                  <CommandList>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <CommandGroup>
                      {productos.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={p.nombreProducto}
                          onSelect={() => handleSelectProducto(p.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              productoSelId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span className="flex-1">{p.nombreProducto}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            stock: {p.stock}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5">
            <Label>Precio compra (Bs.)</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={precioCostSel || ""}
              onChange={(e) => setPrecioCostSel(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cantidad</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                value={cantidadSel}
                onChange={(e) => setCantidadSel(Number(e.target.value))}
              />
              <Button type="button" onClick={handleAgregarItem} size="icon" variant="secondary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de items */}
      {items.length > 0 && (
        <>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Producto</th>
                  <th className="text-right px-4 py-2 font-medium w-28">Cantidad</th>
                  <th className="text-right px-4 py-2 font-medium w-36">Precio unit. (Bs.)</th>
                  <th className="text-right px-4 py-2 font-medium w-28">Subtotal</th>
                  <th className="px-2 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.idProducto} className="border-t">
                    <td className="px-4 py-2">{item.nombreProducto}</td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={(e) => handleUpdateCantidad(item.idProducto, Number(e.target.value))}
                        className="w-20 text-right ml-auto h-8"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.precioCompra}
                        onChange={(e) => handleUpdatePrecio(item.idProducto, Number(e.target.value))}
                        className="w-28 text-right ml-auto h-8"
                      />
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      Bs. {(item.precioCompra * item.cantidad).toFixed(2)}
                    </td>
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.idProducto)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="flex flex-col items-end gap-2 text-sm">
            <div className="flex items-center gap-8">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium w-28 text-right">Bs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-8">
              <Label className="text-muted-foreground">Descuento (Bs.)</Label>
              <Input
                type="number"
                min={0}
                max={subtotal}
                step={0.01}
                value={descuento || ""}
                onChange={(e) => setDescuento(Number(e.target.value))}
                className="w-28 text-right h-8"
              />
            </div>
            <div className="flex items-center gap-8 text-base font-bold border-t pt-2">
              <span>Total</span>
              <span className="w-28 text-right">Bs. {total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || items.length === 0 || !idProveedor}
        className="w-full"
      >
        {loading ? "Registrando..." : "Registrar Compra"}
      </Button>
    </div>
  )
}
