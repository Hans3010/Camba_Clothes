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
  AlertTriangle, CheckCircle2, Package, DollarSign, Users, Settings, Target,
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

// Configuración de metas y ejes BSC para cada KPI del dashboard
const KPI_CONFIG = {
  ventas: {
    eje: "Financiera",
    ejeColor: "bg-green-100 text-green-700 border-green-200",
    ejeIcon: DollarSign,
    meta: "+5% vs anterior",
    metaValor: 5,
  },
  transacciones: {
    eje: "Procesos",
    ejeColor: "bg-orange-100 text-orange-700 border-orange-200",
    ejeIcon: Settings,
    meta: ">= 3 por día",
    metaValor: 3,
  },
  ticket: {
    eje: "Clientes",
    ejeColor: "bg-blue-100 text-blue-700 border-blue-200",
    ejeIcon: Users,
    meta: ">= Bs. 100",
    metaValor: 100,
  },
  margen: {
    eje: "Financiera",
    ejeColor: "bg-green-100 text-green-700 border-green-200",
    ejeIcon: DollarSign,
    meta: ">= 35%",
    metaValor: 35,
  },
}

function MetaIndicator({ valor, meta, tipo }: { valor: number; meta: number; tipo: "min" | "crecimiento" }) {
  let cumple: boolean
  if (tipo === "crecimiento") {
    cumple = valor >= meta
  } else {
    cumple = valor >= meta
  }
  return (
    <div className="flex items-center gap-1 mt-1">
      <Target className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">Meta:</span>
      <span className={`text-[10px] font-medium ${cumple ? "text-green-600" : "text-amber-600"}`}>
        {cumple ? "Cumplida" : "Pendiente"}
      </span>
    </div>
  )
}

function EjeBadge({ config }: { config: typeof KPI_CONFIG.ventas }) {
  const Icon = config.ejeIcon
  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${config.ejeColor}`}>
      <Icon className="h-2.5 w-2.5" />
      {config.eje}
    </Badge>
  )
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
            {/* Ventas Totales — Eje Financiera */}
            <Card className="border-l-4 border-l-green-400">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Totales</CardTitle>
                <EjeBadge config={KPI_CONFIG.ventas} />
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
                <MetaIndicator valor={cambio} meta={KPI_CONFIG.ventas.metaValor} tipo="crecimiento" />
              </CardContent>
            </Card>

            {/* Transacciones — Eje Procesos */}
            <Card className="border-l-4 border-l-orange-400">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
                <EjeBadge config={KPI_CONFIG.transacciones} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.cantidadTransacciones}</div>
                <p className="text-xs text-muted-foreground mt-1">ventas completadas</p>
                <MetaIndicator valor={data.cantidadTransacciones} meta={KPI_CONFIG.transacciones.metaValor} tipo="min" />
              </CardContent>
            </Card>

            {/* Ticket Promedio — Eje Clientes */}
            <Card className="border-l-4 border-l-blue-400">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
                <EjeBadge config={KPI_CONFIG.ticket} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{fmt(data.ticketPromedio)}</div>
                <p className="text-xs text-muted-foreground mt-1">por transacción</p>
                <MetaIndicator valor={data.ticketPromedio} meta={KPI_CONFIG.ticket.metaValor} tipo="min" />
              </CardContent>
            </Card>

            {/* Margen Promedio — Eje Financiera (solo ADMIN) */}
            {isAdmin && (
              <Card className="border-l-4 border-l-green-400">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Margen Promedio</CardTitle>
                  <EjeBadge config={KPI_CONFIG.margen} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{data.margenPromedio.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">de ganancia</p>
                  <MetaIndicator valor={data.margenPromedio} meta={KPI_CONFIG.margen.metaValor} tipo="min" />
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
                    <Badge variant="outline" className="text-[10px] gap-1 bg-orange-100 text-orange-700 border-orange-200 ml-auto">
                      <Settings className="h-2.5 w-2.5" />
                      Procesos
                    </Badge>
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
