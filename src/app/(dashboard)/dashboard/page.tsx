"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  TrendingUp, TrendingDown, ShoppingBag, Receipt, Percent,
  AlertTriangle, CheckCircle2, Package,
} from "lucide-react"

interface TopProducto {
  id: number; nombreProducto: string; talla: string; color: string
  cantidadVendida: number; totalVendido: number
}
interface StockCritico {
  id: number; nombreProducto: string; talla: string; color: string
  stock: number; stockMinimo: number
}
interface DashboardData {
  ventasTotales: number; cantidadTransacciones: number
  ticketPromedio: number; margenPromedio: number
  comparativa: { ventasAnterior: number; porcentajeCambio: number }
  topProductos: TopProducto[]; stockCritico: StockCritico[]
}

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "ADMIN"

  const [periodo, setPeriodo] = useState("dia")
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboard = useCallback(async (p: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard?periodo=${p}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error("Error al cargar el dashboard")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboard(periodo)
  }, [periodo, fetchDashboard])

  const periodoLabel = periodo === "dia" ? "hoy" : periodo === "semana" ? "esta semana" : "este mes"
  const cambio = data?.comparativa.porcentajeCambio ?? 0
  const cambioPositivo = cambio >= 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Resumen de actividad {periodoLabel}
          </p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dia">Hoy</SelectItem>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando datos...</p>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmt(data.ventasTotales)}</div>
                <div className="flex items-center gap-1 mt-1">
                  {cambioPositivo ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={`text-xs font-medium ${cambioPositivo ? "text-green-600" : "text-red-600"}`}>
                    {cambioPositivo ? "+" : ""}{cambio.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs anterior</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.cantidadTransacciones}</div>
                <p className="text-xs text-muted-foreground mt-1">ventas completadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                <Receipt className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmt(data.ticketPromedio)}</div>
                <p className="text-xs text-muted-foreground mt-1">por transacción</p>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Margen Promedio</CardTitle>
                  <Percent className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.margenPromedio.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">de ganancia</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className={`grid ${isAdmin ? "lg:grid-cols-2" : "grid-cols-1"} gap-6`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top 5 Productos Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                {data.topProductos.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                    <Package className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No hay ventas en este período</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topProductos.map((p, i) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell>
                            <div className="font-medium text-sm">{p.nombreProducto}</div>
                            <div className="text-xs text-muted-foreground">{p.talla} · {p.color}</div>
                          </TableCell>
                          <TableCell className="text-right">{p.cantidadVendida}</TableCell>
                          <TableCell className="text-right text-sm">{fmt(p.totalVendido)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {isAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Alertas de Stock
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {data.stockCritico.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-muted-foreground gap-2">
                      <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                      <p className="text-sm">Sin alertas de stock</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.stockCritico.map((p) => (
                        <div key={p.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                          <div>
                            <div className="font-medium text-sm">{p.nombreProducto}</div>
                            <div className="text-xs text-muted-foreground">{p.talla} · {p.color}</div>
                          </div>
                          <Badge variant={p.stock === 0 ? "destructive" : "outline"} className={p.stock > 0 ? "border-amber-500 text-amber-600" : ""}>
                            {p.stock === 0 ? "Agotado" : `${p.stock} / ${p.stockMinimo}`}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
