"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, Search, UserPlus, CheckCircle2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import type { CartItem } from "@/components/pos/cart"
import NotaVenta, { type VentaConDetalles } from "@/components/pos/nota-venta"

type Cliente = {
  id: number
  nombre: string
  apPaterno: string
  apMaterno?: string | null
  telefono: string
}

type TipoPago = {
  id: number
  tipoMetodo: string
}

const METODO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA: "Tarjeta",
  QR: "QR",
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

type Props = {
  open: boolean
  onClose: () => void
  cart: CartItem[]
  onSuccess: () => void
}

export default function CheckoutDialog({ open, onClose, cart, onSuccess }: Props) {
  const router = useRouter()

  // Client search state
  const [clienteQuery, setClienteQuery] = useState("")
  const [clienteResults, setClienteResults] = useState<Cliente[]>([])
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const debouncedClienteQuery = useDebounce(clienteQuery, 300)

  // Quick create client state
  const [createOpen, setCreateOpen] = useState(false)
  const [newCliente, setNewCliente] = useState({
    nombre: "",
    apPaterno: "",
    apMaterno: "",
    telefono: "",
  })
  const [creatingCliente, setCreatingCliente] = useState(false)

  // Payment method state
  const [tiposPago, setTiposPago] = useState<TipoPago[]>([])
  const [selectedTipoPagoId, setSelectedTipoPagoId] = useState<number | null>(null)

  // Sale state
  const [loading, setLoading] = useState(false)
  const [ventaCreada, setVentaCreada] = useState<VentaConDetalles | null>(null)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setClienteQuery("")
      setClienteResults([])
      setSelectedCliente(null)
      setSelectedTipoPagoId(null)
      setVentaCreada(null)
      setCreateOpen(false)
      setNewCliente({ nombre: "", apPaterno: "", apMaterno: "", telefono: "" })
    }
  }, [open])

  // Load payment types on open
  useEffect(() => {
    if (!open) return
    fetch("/api/tipos-pago")
      .then((r) => r.json())
      .then((data) => setTiposPago(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [open])

  // Client search
  useEffect(() => {
    if (!debouncedClienteQuery || debouncedClienteQuery.length < 2) {
      setClienteResults([])
      return
    }
    fetch(`/api/clientes?q=${encodeURIComponent(debouncedClienteQuery)}`)
      .then((r) => r.json())
      .then((data) => setClienteResults(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [debouncedClienteQuery])

  const subtotal = cart.reduce((acc, i) => acc + i.precioVenta * i.cantidad, 0)
  const totalItems = cart.reduce((acc, i) => acc + i.cantidad, 0)

  async function handleConfirm() {
    if (!selectedCliente) {
      toast.error("Selecciona un cliente para continuar")
      return
    }
    if (!selectedTipoPagoId) {
      toast.error("Selecciona un método de pago")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idCliente: selectedCliente.id,
          idTipoPago: selectedTipoPagoId,
          items: cart.map((i) => ({
            idProducto: i.id,
            cantidad: i.cantidad,
            precio: i.precioVenta,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === "NO_CAJA") {
          toast.error("No hay sesión de caja activa. Abre la caja primero.")
          onClose()
          router.push("/caja")
          return
        }
        if (Array.isArray(data.items)) {
          data.items.forEach((msg: string) => toast.error(msg))
        } else {
          toast.error(data.error ?? "Error al registrar la venta")
        }
        return
      }

      setVentaCreada(data)
      onSuccess()
      toast.success(`Venta #${data.id} registrada exitosamente`)
    } catch {
      toast.error("Error de conexión al registrar la venta")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCliente() {
    if (!newCliente.nombre || !newCliente.apPaterno || !newCliente.telefono) {
      toast.error("Completa nombre, apellido y teléfono")
      return
    }
    setCreatingCliente(true)
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCliente),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error("Error al crear el cliente")
        return
      }
      setSelectedCliente(data)
      setClienteQuery(`${data.nombre} ${data.apPaterno}`)
      setCreateOpen(false)
      setNewCliente({ nombre: "", apPaterno: "", apMaterno: "", telefono: "" })
      toast.success("Cliente creado y seleccionado")
    } catch {
      toast.error("Error de conexión")
    } finally {
      setCreatingCliente(false)
    }
  }

  function handleClose() {
    setVentaCreada(null)
    onClose()
  }

  // --- RECEIPT VIEW ---
  if (ventaCreada) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Venta registrada
            </DialogTitle>
          </DialogHeader>
          <NotaVenta venta={ventaCreada} onClose={handleClose} />
        </DialogContent>
      </Dialog>
    )
  }

  // --- CHECKOUT FORM VIEW ---
  return (
    <>
      <Dialog open={open && !createOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirmar Venta</DialogTitle>
          </DialogHeader>

          {/* Order summary */}
          <div className="space-y-1 max-h-36 overflow-y-auto text-sm border rounded-lg p-3 bg-muted/30">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between gap-2">
                <span className="truncate flex-1 text-muted-foreground">
                  {item.nombreProducto}{" "}
                  <span className="text-xs">
                    T:{item.talla} · {item.color}
                  </span>{" "}
                  × {item.cantidad}
                </span>
                <span className="font-medium shrink-0">
                  Bs. {(item.precioVenta * item.cantidad).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Total ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
            <span className="text-primary">Bs. {subtotal.toFixed(2)}</span>
          </div>

          <Separator />

          {/* Client selector */}
          <div className="space-y-2">
            <Label>Cliente</Label>
            {selectedCliente ? (
              <div className="flex items-center justify-between rounded-md border p-2.5">
                <span className="text-sm">
                  {selectedCliente.nombre} {selectedCliente.apPaterno}
                  {selectedCliente.apMaterno ? ` ${selectedCliente.apMaterno}` : ""}
                  <span className="text-muted-foreground ml-1.5">· {selectedCliente.telefono}</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs ml-2"
                  onClick={() => {
                    setSelectedCliente(null)
                    setClienteQuery("")
                  }}
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  className="pl-9"
                  placeholder="Buscar por nombre o teléfono..."
                  value={clienteQuery}
                  onChange={(e) => {
                    setClienteQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                />
                {showDropdown && clienteResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border bg-popover shadow-md max-h-44 overflow-y-auto">
                    {clienteResults.map((c) => (
                      <button
                        key={c.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                        onMouseDown={() => {
                          setSelectedCliente(c)
                          setClienteQuery(`${c.nombre} ${c.apPaterno}`)
                          setShowDropdown(false)
                        }}
                      >
                        <span className="font-medium">
                          {c.nombre} {c.apPaterno}
                          {c.apMaterno ? ` ${c.apMaterno}` : ""}
                        </span>{" "}
                        <span className="text-muted-foreground text-xs">· {c.telefono}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!selectedCliente && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreateOpen(true)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar cliente nuevo
              </Button>
            )}
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <Label>Método de pago</Label>
            <div className="flex gap-2">
              {tiposPago.length === 0 ? (
                <p className="text-sm text-muted-foreground">Cargando...</p>
              ) : (
                tiposPago.map((tp) => (
                  <Button
                    key={tp.id}
                    variant={selectedTipoPagoId === tp.id ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setSelectedTipoPagoId(tp.id)}
                  >
                    {METODO_LABEL[tp.tipoMetodo] ?? tp.tipoMetodo}
                  </Button>
                ))
              )}
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={loading || !selectedCliente || !selectedTipoPagoId}
            onClick={handleConfirm}
          >
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {loading ? "Procesando venta..." : `Confirmar Venta · Bs. ${subtotal.toFixed(2)}`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Quick create client dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre *</Label>
              <Input
                className="mt-1"
                placeholder="Nombre"
                value={newCliente.nombre}
                onChange={(e) => setNewCliente((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>
            <div>
              <Label>Apellido paterno *</Label>
              <Input
                className="mt-1"
                placeholder="Apellido paterno"
                value={newCliente.apPaterno}
                onChange={(e) => setNewCliente((p) => ({ ...p, apPaterno: e.target.value }))}
              />
            </div>
            <div>
              <Label>Apellido materno</Label>
              <Input
                className="mt-1"
                placeholder="Apellido materno (opcional)"
                value={newCliente.apMaterno}
                onChange={(e) => setNewCliente((p) => ({ ...p, apMaterno: e.target.value }))}
              />
            </div>
            <div>
              <Label>Teléfono *</Label>
              <Input
                className="mt-1"
                placeholder="Ej: 77712345"
                value={newCliente.telefono}
                onChange={(e) => setNewCliente((p) => ({ ...p, telefono: e.target.value }))}
              />
            </div>
            <Button className="w-full" disabled={creatingCliente} onClick={handleCreateCliente}>
              {creatingCliente && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Guardar cliente
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
