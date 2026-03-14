"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import CompraForm from "@/components/forms/compra-form"
import { DataTable } from "@/components/ui/data-table"
import { createComprasColumns, CompraRow } from "@/components/tables/compras-columns"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Package, TrendingDown, ShoppingBag } from "lucide-react"

interface Proveedor { id: number; nombreEmpresa: string }
interface Producto  { id: number; nombreProducto: string; costo: number; stock: number }

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

export default function ComprasPage() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [compras, setCompras] = useState<CompraRow[]>([])
  const [loadingCompras, setLoadingCompras] = useState(true)

  const [detailCompra, setDetailCompra] = useState<CompraRow | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [resProv, resProd] = await Promise.all([
        fetch("/api/proveedores"),
        fetch("/api/productos"),
      ])
      setProveedores(await resProv.json())
      setProductos(await resProd.json())
    } catch {
      toast.error("Error al cargar datos")
    }
  }, [])

  const fetchCompras = useCallback(async () => {
    try {
      setLoadingCompras(true)
      const res = await fetch("/api/compras")
      const data = await res.json()
      setCompras(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar historial de compras")
    } finally {
      setLoadingCompras(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchCompras()
  }, [fetchData, fetchCompras])

  const handleSuccess = useCallback(() => {
    fetchData()
    fetchCompras()
  }, [fetchData, fetchCompras])

  const handleVerDetalle = useCallback((compra: CompraRow) => {
    setDetailCompra(compra)
    setDetailOpen(true)
  }, [])

  const columns = useMemo(() => createComprasColumns(handleVerDetalle), [handleVerDetalle])

  const stats = useMemo(() => {
    const totalInvertido = compras.reduce((acc, c) => acc + Number(c.total), 0)
    const totalItems = compras.reduce((acc, c) => acc + c.detalles.length, 0)
    return { totalInvertido, totalItems, totalCompras: compras.length }
  }, [compras])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Compras</h1>

      <div className="border rounded-lg p-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
          Registrar nueva compra
        </p>
        <CompraForm
          proveedores={proveedores}
          productos={productos}
          onSuccess={handleSuccess}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Historial de Compras</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Invertido
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Bs. {stats.totalInvertido.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Todas las compras</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Órdenes de Compra
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompras}</div>
              <p className="text-xs text-muted-foreground mt-1">Registros totales</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ítems Comprados
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Líneas de producto</p>
            </CardContent>
          </Card>
        </div>

        {loadingCompras ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Cargando historial...</p>
        ) : compras.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <ShoppingBag className="h-12 w-12 opacity-30" />
            <p className="font-medium">No hay compras registradas aún</p>
          </div>
        ) : (
          <DataTable searchKey="proveedor" columns={columns} data={compras} />
        )}
      </div>

      <Dialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open)
          if (!open) setDetailCompra(null)
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Compra #{detailCompra?.id}</DialogTitle>
          </DialogHeader>

          {detailCompra && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Fecha</p>
                  <p className="font-medium">{formatFecha(detailCompra.fecha)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Registrado por</p>
                  <p className="font-medium">{detailCompra.usuario.usuario}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">Proveedor</p>
                  <p className="font-medium">{detailCompra.proveedor.nombreEmpresa}</p>
                </div>
                {detailCompra.numeroDocumento && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide">Documento</p>
                    <p className="font-medium">
                      {detailCompra.tipoDocumento && (
                        <span className="text-muted-foreground mr-1">{detailCompra.tipoDocumento}</span>
                      )}
                      {detailCompra.numeroDocumento}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="font-medium text-sm mb-3">
                  Productos ({detailCompra.detalles.length})
                </p>
                <div className="space-y-2">
                  {detailCompra.detalles.map((d) => (
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
                          {d.cantidad} × Bs. {Number(d.precioCompra).toFixed(2)}
                        </p>
                        <p className="font-semibold">Bs. {Number(d.subtotal).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>Bs. {Number(detailCompra.subtotal).toFixed(2)}</span>
                </div>
                {Number(detailCompra.descuento) > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Descuento</span>
                    <span>- Bs. {Number(detailCompra.descuento).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base pt-1 border-t">
                  <span>Total</span>
                  <span>Bs. {Number(detailCompra.total).toFixed(2)}</span>
                </div>
              </div>

              <Badge variant="secondary" className="w-full justify-center py-1">
                {detailCompra.detalles.reduce((acc, d) => acc + d.cantidad, 0)} unidades en total
              </Badge>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
