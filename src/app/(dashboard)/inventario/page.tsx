"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { cn } from "@/lib/utils"
import {
  ArrowUpDown,
  Package,
  TrendingUp,
  AlertTriangle,
  SlidersHorizontal,
  Check,
  ChevronsUpDown,
} from "lucide-react"


interface Movimiento {
  id: number
  fecha: string
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE"
  origen: string
  cantidad: number
  descripcion: string
  producto: { id: number; nombreProducto: string; talla: string; color: string }
  usuario: { usuario: string }
}

interface ProductoValuacion {
  id: number
  nombreProducto: string
  talla: string
  color: string
  marca: string
  stock: number
  stockMinimo: number
  costo: number
  precioVenta: number
  valorCosto: number   // stock * costo
  valorVenta: number   // stock * precioVenta
}


const tipoColor: Record<string, string> = {
  ENTRADA: "bg-green-600",
  SALIDA:  "bg-red-500",
  AJUSTE:  "bg-yellow-500",
}

function formatFecha(dateStr: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(dateStr))
}

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}


export default function InventarioPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "ADMIN"

  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [searchMov, setSearchMov] = useState("")
  const [filterTipo, setFilterTipo] = useState<string>("all")

  const [productos, setProductos] = useState<ProductoValuacion[]>([])
  const [searchVal, setSearchVal] = useState("")

  const [ajusteOpen, setAjusteOpen] = useState(false)
  const [ajusteProductoId, setAjusteProductoId] = useState<number | "">("")
  const [ajusteComboOpen, setAjusteComboOpen] = useState(false)
  const [ajusteCantidad, setAjusteCantidad] = useState<string>("")
  const [ajusteMotivo, setAjusteMotivo] = useState("")
  const [ajusteLoading, setAjusteLoading] = useState(false)

  const fetchMovimientos = useCallback(async () => {
    const res = await fetch("/api/inventario")
    const data = await res.json()
    setMovimientos(Array.isArray(data) ? data : [])
  }, [])

  const fetchProductos = useCallback(async () => {
    const res = await fetch("/api/productos")
    const data = await res.json()
    if (Array.isArray(data)) {
      setProductos(
        data.map((p: { id: number; nombreProducto: string; talla?: string; color?: string; marca?: string; stock: number; stockMinimo: number; costo: number; precioVenta: number }) => ({
          id: p.id,
          nombreProducto: p.nombreProducto,
          talla: p.talla ?? "",
          color: p.color ?? "",
          marca: p.marca ?? "",
          stock: p.stock,
          stockMinimo: p.stockMinimo,
          costo: Number(p.costo),
          precioVenta: Number(p.precioVenta),
          valorCosto: p.stock * Number(p.costo),
          valorVenta: p.stock * Number(p.precioVenta),
        }))
      )
    }
  }, [])

  useEffect(() => {
    fetchMovimientos()
    fetchProductos()
  }, [fetchMovimientos, fetchProductos])

  const filteredMov = useMemo(
    () =>
      movimientos.filter((m) => {
        const matchSearch =
          m.producto.nombreProducto.toLowerCase().includes(searchMov.toLowerCase()) ||
          m.descripcion.toLowerCase().includes(searchMov.toLowerCase())
        const matchTipo = filterTipo === "all" || m.tipo === filterTipo
        return matchSearch && matchTipo
      }),
    [movimientos, searchMov, filterTipo]
  )

  const filteredVal = useMemo(
    () =>
      productos.filter((p) =>
        p.nombreProducto.toLowerCase().includes(searchVal.toLowerCase())
      ),
    [productos, searchVal]
  )

  const valorTotalCosto = useMemo(
    () => productos.reduce((acc, p) => acc + p.valorCosto, 0),
    [productos]
  )
  const valorTotalVenta = useMemo(
    () => productos.reduce((acc, p) => acc + p.valorVenta, 0),
    [productos]
  )
  const productosStockCritico = useMemo(
    () => productos.filter((p) => p.stock <= p.stockMinimo && p.stock > 0).length,
    [productos]
  )
  const productosAgotados = useMemo(
    () => productos.filter((p) => p.stock === 0).length,
    [productos]
  )

  const productoAjuste = productos.find((p) => p.id === ajusteProductoId)

  const handleAjuste = async () => {
    if (!ajusteProductoId) { toast.error("Selecciona un producto"); return }
    const cant = parseInt(ajusteCantidad)
    if (isNaN(cant) || cant === 0) { toast.error("La cantidad no puede ser 0"); return }
    if (ajusteMotivo.trim().length < 5) { toast.error("El motivo debe tener al menos 5 caracteres"); return }

    setAjusteLoading(true)
    try {
      const res = await fetch("/api/inventario/ajuste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProducto: ajusteProductoId,
          cantidad: cant,
          motivo: ajusteMotivo.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al ajustar")

      toast.success(`Ajuste realizado. Nuevo stock: ${data.nuevoStock}`)
      setAjusteOpen(false)
      setAjusteProductoId("")
      setAjusteCantidad("")
      setAjusteMotivo("")
      fetchMovimientos()
      fetchProductos()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al realizar ajuste")
    } finally {
      setAjusteLoading(false)
    }
  }

  const handleCloseAjuste = (open: boolean) => {
    setAjusteOpen(open)
    if (!open) {
      setAjusteProductoId("")
      setAjusteCantidad("")
      setAjusteMotivo("")
    }
  }


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Valoración de stock y registro de movimientos
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAjusteOpen(true)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Ajuste Manual
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor al Costo
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold leading-tight">{fmt(valorTotalCosto)}</div>
            <p className="text-xs text-muted-foreground mt-1">Basado en precio de compra</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor de Venta
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold leading-tight">{fmt(valorTotalVenta)}</div>
            <p className="text-xs text-muted-foreground mt-1">Si se vende todo el stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stock Crítico
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-500">{productosStockCritico}</div>
            <p className="text-xs text-muted-foreground mt-1">Productos bajo mínimo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Sin Stock
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{productosAgotados}</div>
            <p className="text-xs text-muted-foreground mt-1">Productos agotados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="valoracion">
        <TabsList>
          <TabsTrigger value="valoracion">
            <Package className="h-4 w-4 mr-2" />
            Valoración de Inventario
          </TabsTrigger>
          <TabsTrigger value="movimientos">
            <ArrowUpDown className="h-4 w-4 mr-2" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="valoracion" className="mt-4 space-y-3">
          <Input
            placeholder="Buscar producto..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="max-w-sm"
          />
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Talla / Color</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Costo unit.</TableHead>
                  <TableHead className="text-right">P. Venta unit.</TableHead>
                  <TableHead className="text-right">Valor al costo</TableHead>
                  <TableHead className="text-right">Valor de venta</TableHead>
                  <TableHead>Estado stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVal.map((p) => {
                  const critico = p.stock <= p.stockMinimo && p.stock > 0
                  const agotado = p.stock === 0
                  return (
                    <TableRow key={p.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{p.nombreProducto}</p>
                        {p.marca && (
                          <p className="text-xs text-muted-foreground">{p.marca}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.talla} · {p.color}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {p.stock}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(p.costo)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {fmt(p.precioVenta)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm">
                        {fmt(p.valorCosto)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-sm text-green-700 dark:text-green-400">
                        {fmt(p.valorVenta)}
                      </TableCell>
                      <TableCell>
                        {agotado ? (
                          <Badge variant="destructive" className="text-xs">Agotado</Badge>
                        ) : critico ? (
                          <Badge className="bg-orange-500 text-xs">Crítico</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredVal.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No hay productos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-end gap-8 text-sm px-2 pt-1 border-t">
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Total al costo</p>
              <p className="font-bold text-base">{fmt(valorTotalCosto)}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Total de venta</p>
              <p className="font-bold text-base text-green-700 dark:text-green-400">
                {fmt(valorTotalVenta)}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="movimientos" className="mt-4 space-y-3">
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Buscar por producto o descripción..."
              value={searchMov}
              onChange={(e) => setSearchMov(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SALIDA">Salida</SelectItem>
                <SelectItem value="AJUSTE">Ajuste</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Origen</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMov.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatFecha(m.fecha)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{m.producto.nombreProducto}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.producto.talla} · {m.producto.color}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge className={tipoColor[m.tipo]}>{m.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{m.origen.replace(/_/g, " ")}</TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        m.cantidad < 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">{m.descripcion}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.usuario.usuario}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredMov.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay movimientos registrados
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {isAdmin && (
        <Dialog open={ajusteOpen} onOpenChange={handleCloseAjuste}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajuste Manual de Stock</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>
                  Producto <span className="text-destructive">*</span>
                </Label>
                <Popover open={ajusteComboOpen} onOpenChange={setAjusteComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {productoAjuste ? (
                        <span className="truncate">{productoAjuste.nombreProducto}</span>
                      ) : (
                        <span className="text-muted-foreground">Buscar producto...</span>
                      )}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre..." />
                      <CommandList>
                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                        <CommandGroup>
                          {productos.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={p.nombreProducto}
                              onSelect={() => {
                                setAjusteProductoId(p.id)
                                setAjusteComboOpen(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  ajusteProductoId === p.id ? "opacity-100" : "opacity-0"
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
                {productoAjuste && (
                  <p className="text-xs text-muted-foreground">
                    Stock actual: <strong>{productoAjuste.stock}</strong> unidades
                    {productoAjuste.stock <= productoAjuste.stockMinimo && (
                      <span className="ml-2 text-orange-600 font-medium">
                        (bajo mínimo: {productoAjuste.stockMinimo})
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Cantidad <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="number"
                  placeholder="Ej: +5 para añadir, -3 para reducir"
                  value={ajusteCantidad}
                  onChange={(e) => setAjusteCantidad(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Usa números positivos para añadir stock y negativos para reducirlo.
                </p>
                {productoAjuste && ajusteCantidad !== "" && !isNaN(parseInt(ajusteCantidad)) && (
                  <p className="text-xs font-medium">
                    Nuevo stock:{" "}
                    <span
                      className={
                        productoAjuste.stock + parseInt(ajusteCantidad) < 0
                          ? "text-destructive"
                          : "text-green-600"
                      }
                    >
                      {productoAjuste.stock + parseInt(ajusteCantidad)} unidades
                    </span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>
                  Motivo del ajuste <span className="text-destructive">*</span>
                </Label>
                <textarea
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  placeholder="Ej: Merma por daño, Devolución de cliente, Corrección de conteo..."
                  rows={3}
                  value={ajusteMotivo}
                  onChange={(e) => setAjusteMotivo(e.target.value)}
                  disabled={ajusteLoading}
                />
                {ajusteMotivo.length > 0 && ajusteMotivo.trim().length < 5 && (
                  <p className="text-xs text-destructive">Mínimo 5 caracteres</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => handleCloseAjuste(false)} disabled={ajusteLoading}>
                Cancelar
              </Button>
              <Button
                onClick={handleAjuste}
                disabled={
                  ajusteLoading ||
                  !ajusteProductoId ||
                  ajusteCantidad === "" ||
                  isNaN(parseInt(ajusteCantidad)) ||
                  parseInt(ajusteCantidad) === 0 ||
                  ajusteMotivo.trim().length < 5
                }
              >
                {ajusteLoading ? "Aplicando..." : "Aplicar Ajuste"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
