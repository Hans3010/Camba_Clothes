"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { createVentasColumns, VentaRow } from "@/components/tables/ventas-columns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { ShoppingBag, TrendingUp, CheckCircle2, XCircle } from "lucide-react"

function formatFecha(dateStr: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr))
}

export default function VentasPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "ADMIN"

  const [ventas, setVentas] = useState<VentaRow[]>([])
  const [loading, setLoading] = useState(true)

  const [detailVenta, setDetailVenta] = useState<VentaRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const [anularVenta, setAnularVenta] = useState<VentaRow | null>(null)
  const [anularOpen, setAnularOpen] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState("")
  const [anulando, setAnulando] = useState(false)

  const fetchVentas = useCallback(async () => {
    try {
      const res = await fetch("/api/ventas")
      const data = await res.json()
      setVentas(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar ventas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  const handleVerDetalle = useCallback((venta: VentaRow) => {
    setDetailVenta(venta)
    setDetailOpen(true)
  }, [])

  const handleOpenAnular = useCallback((venta: VentaRow) => {
    setAnularVenta(venta)
    setMotivoAnulacion("")
    setAnularOpen(true)
  }, [])

  const handleConfirmAnular = async () => {
    if (!anularVenta) return
    if (motivoAnulacion.trim().length < 5) {
      toast.error("El motivo debe tener al menos 5 caracteres")
      return
    }

    setAnulando(true)
    try {
      const res = await fetch(`/api/ventas/${anularVenta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivoAnulacion: motivoAnulacion.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Error al anular la venta")
        return
      }
      toast.success(`Venta #${anularVenta.id} anulada. Stock restaurado.`)
      setAnularOpen(false)
      setAnularVenta(null)
      fetchVentas()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setAnulando(false)
    }
  }

  const columns = useMemo(
    () =>
      createVentasColumns(
        handleVerDetalle,
        isAdmin ? handleOpenAnular : undefined
      ),
    [isAdmin, handleVerDetalle, handleOpenAnular]
  )

  const stats = useMemo(() => {
    const completadas = ventas.filter((v) => v.estado === "COMPLETADA")
    const totalVentas = completadas.reduce((acc, v) => acc + Number(v.total), 0)
    return {
      totalVentas,
      cantidadCompletadas: completadas.length,
      cantidadAnuladas: ventas.filter((v) => v.estado === "ANULADA").length,
    }
  }, [ventas])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin
            ? "Todas las ventas del sistema"
            : "Todo tu historial de ventas"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Recaudado
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Bs. {stats.totalVentas.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Solo ventas completadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completadas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.cantidadCompletadas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Ventas exitosas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Anuladas
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.cantidadAnuladas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Stock restaurado</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-12 text-center">Cargando ventas...</p>
      ) : ventas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <ShoppingBag className="h-12 w-12 opacity-30" />
          <p className="font-medium">
            {isAdmin ? "No hay ventas registradas" : "No has registrado ventas aún"}
          </p>
          {!isAdmin && (
            <p className="text-xs text-center max-w-xs">
              Aquí aparecerá todo tu historial de ventas de todas las sesiones que hayas realizado.
            </p>
          )}
        </div>
      ) : (
        <DataTable searchKey="cliente" columns={columns} data={ventas} />
      )}

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailVenta(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Venta #{detailVenta?.id}
              {detailVenta && (
                <Badge
                  className={detailVenta.estado === "COMPLETADA" ? "bg-green-600" : ""}
                  variant={detailVenta.estado === "COMPLETADA" ? "default" : "destructive"}
                >
                  {detailVenta.estado}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {detailVenta && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Fecha</p>
                  <p className="font-medium">{formatFecha(detailVenta.fecha)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Vendedor</p>
                  <p className="font-medium">{detailVenta.usuario.usuario}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Cliente</p>
                  <p className="font-medium">
                    {detailVenta.cliente.apPaterno}
                    {detailVenta.cliente.apMaterno
                      ? ` ${detailVenta.cliente.apMaterno}`
                      : ""}
                    , {detailVenta.cliente.nombre}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Método de pago
                  </p>
                  <p className="font-medium">{detailVenta.tipoPago.tipoMetodo}</p>
                </div>
              </div>

              {detailVenta.motivoAnulacion && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 text-sm">
                  <p className="font-medium text-destructive mb-1">Motivo de anulación</p>
                  <p className="text-destructive/80">{detailVenta.motivoAnulacion}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="font-medium text-sm mb-3">
                  Productos ({detailVenta.detalles.length})
                </p>
                <div className="space-y-2">
                  {detailVenta.detalles.map((d) => (
                    <div
                      key={d.id}
                      className="flex justify-between items-center rounded-md border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{d.producto.nombreProducto}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.producto.talla} · {d.producto.color}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">
                          {d.cantidad} × Bs. {Number(d.precio).toFixed(2)}
                        </p>
                        <p className="font-semibold">Bs. {Number(d.subtotal).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">
                  Bs. {Number(detailVenta.total).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={anularOpen} onOpenChange={setAnularOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anular Venta #{anularVenta?.id}</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se restaurará el stock de todos los productos
              incluidos en la venta.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-2 space-y-2">
            <label className="text-sm font-medium">
              Motivo de anulación <span className="text-destructive">*</span>
            </label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              placeholder="Describe el motivo de la anulación (mínimo 5 caracteres)..."
              rows={3}
              value={motivoAnulacion}
              onChange={(e) => setMotivoAnulacion(e.target.value)}
              disabled={anulando}
            />
            {motivoAnulacion.length > 0 && motivoAnulacion.trim().length < 5 && (
              <p className="text-xs text-destructive">Mínimo 5 caracteres</p>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={anulando}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmAnular}
              disabled={anulando || motivoAnulacion.trim().length < 5}
            >
              {anulando ? "Anulando..." : "Confirmar Anulación"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
