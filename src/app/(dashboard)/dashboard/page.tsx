"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package,
  DollarSign, Users, Settings, Target, ShoppingCart, Receipt, Percent,
} from "lucide-react"
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, AreaChart, Area, Label,
} from "recharts"

// ── Types ──

interface TopProducto {
  id: number; nombreProducto: string; talla: string; color: string
  cantidadVendida: number; totalVendido: number
}
interface StockCritico {
  id: number; nombreProducto: string; talla: string; color: string
  stock: number; stockMinimo: number
}
interface SegmentacionClientes {
  frecuentes: number; ocasionales: number; nuevos: number; total: number
}
interface VentaTipoPago {
  nombre: string; total: number
}
interface VentaDia {
  fecha: string; total: number
}
interface DashboardData {
  ventasTotales: number; cantidadTransacciones: number
  ticketPromedio: number; margenPromedio: number
  comparativa: { ventasAnterior: number; porcentajeCambio: number }
  topProductos: TopProducto[]; stockCritico: StockCritico[]
  segmentacionClientes: SegmentacionClientes
  ventasPorTipoPago: VentaTipoPago[]
  ventasPorDia: VentaDia[]
}

// ── Helpers ──

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtShort(n: number) {
  if (n >= 1000) return `Bs.${(n / 1000).toFixed(1)}k`
  return `Bs.${n.toFixed(0)}`
}

// ── Palette ──

const CLIENTES_COLORS = ["#6366f1", "#f59e0b", "#cbd5e1"]
const CLIENTES_LABELS = ["Frecuentes", "Ocasionales", "Nuevos"]
const PAGO_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]
const BAR_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"]

// ── Donut center label ──

function CenterLabel({ viewBox, value, label }: { viewBox?: { cx: number; cy: number }; value: string; label: string }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-foreground text-xl font-bold">
        {value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-muted-foreground text-[11px]">
        {label}
      </text>
    </g>
  )
}

// ── Chart tooltip ──

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      {label && <p className="text-xs text-muted-foreground mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold">{fmt(p.value)}</p>
      ))}
    </div>
  )
}

function PieChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { porcentaje: string } }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} &middot; {payload[0].payload.porcentaje}</p>
    </div>
  )
}

// ── KPI Card ──

function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendValue, meta, metaValor, metaTipo }: {
  title: string; value: string; subtitle: string
  icon: React.ElementType; iconBg: string; iconColor: string
  trend?: boolean; trendValue?: number
  meta?: string; metaValor?: number; metaTipo?: "min" | "crecimiento"
}) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5">
              {trend !== undefined && trendValue !== undefined && (
                <>
                  {trend ? (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" />+{trendValue.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-500">
                      <TrendingDown className="h-3 w-3" />{trendValue.toFixed(1)}%
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">vs anterior</span>
                </>
              )}
              {!trend && trend === undefined && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>
            {meta && metaValor !== undefined && metaTipo && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{meta}:</span>
                <span className={`text-[10px] font-medium ${
                  (metaTipo === "crecimiento" ? (trendValue ?? 0) : Number(value.replace(/[^\d.,]/g, "").replace(",", "."))) >= metaValor
                    ? "text-emerald-600" : "text-amber-500"
                }`}>
                  {(metaTipo === "crecimiento" ? (trendValue ?? 0) : Number(value.replace(/[^\d.,]/g, "").replace(",", "."))) >= metaValor ? "Cumplida" : "Pendiente"}
                </span>
              </div>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Main ──

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "ADMIN"

  const [periodo, setPeriodo] = useState("semana")
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

  useEffect(() => { fetchDashboard(periodo) }, [periodo, fetchDashboard])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const cambio = data.comparativa.porcentajeCambio
  const periodoLabel = periodo === "dia" ? "hoy" : periodo === "semana" ? "esta semana" : "este mes"

  // ── Chart Data ──

  const clientesPieData = [
    { name: "Frecuentes", value: data.segmentacionClientes.frecuentes, porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.frecuentes / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
    { name: "Ocasionales", value: data.segmentacionClientes.ocasionales, porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.ocasionales / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
    { name: "Nuevos", value: data.segmentacionClientes.nuevos, porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.nuevos / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
  ].filter(d => d.value > 0)

  const tipoPagoPieData = data.ventasPorTipoPago.map(tp => ({
    name: tp.nombre,
    value: tp.total,
    porcentaje: `${data.ventasTotales > 0 ? ((tp.total / data.ventasTotales) * 100).toFixed(0) : 0}%`,
  }))

  const ventasDiaData = data.ventasPorDia.map(v => ({
    fecha: new Date(v.fecha + "T12:00:00").toLocaleDateString("es-BO", { weekday: "short", day: "numeric" }),
    total: v.total,
  }))

  const topBarData = data.topProductos.map((p, i) => ({
    nombre: p.nombreProducto.length > 18 ? p.nombreProducto.slice(0, 18) + "..." : p.nombreProducto,
    nombreFull: p.nombreProducto,
    detalle: `${p.talla} - ${p.color}`,
    cantidad: p.cantidadVendida,
    total: p.totalVendido,
    fill: BAR_COLORS[i] ?? BAR_COLORS[0],
  }))

  const porcentajeFrecuentes = data.segmentacionClientes.total > 0
    ? ((data.segmentacionClientes.frecuentes / data.segmentacionClientes.total) * 100).toFixed(0)
    : "0"

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Resumen de actividad {periodoLabel}</p>
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

      {/* ── KPI Row ── */}
      <div className={`grid grid-cols-2 ${isAdmin ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
        <KpiCard
          title="Ventas Totales"
          value={fmt(data.ventasTotales)}
          subtitle=""
          icon={DollarSign}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          trend={cambio >= 0}
          trendValue={cambio}
          meta="+5% vs anterior"
          metaValor={5}
          metaTipo="crecimiento"
        />
        <KpiCard
          title="Transacciones"
          value={String(data.cantidadTransacciones)}
          subtitle="ventas completadas"
          icon={ShoppingCart}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KpiCard
          title="Ticket Promedio"
          value={fmt(data.ticketPromedio)}
          subtitle="por transaccion"
          icon={Receipt}
          iconBg="bg-violet-100"
          iconColor="text-violet-600"
        />
        {isAdmin && (
          <KpiCard
            title="Margen Promedio"
            value={`${data.margenPromedio.toFixed(1)}%`}
            subtitle="de ganancia"
            icon={Percent}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            meta=">= 35%"
            metaValor={35}
            metaTipo="min"
          />
        )}
      </div>

      {/* ── Charts Row 1: Ventas por Día (full width) ── */}
      {ventasDiaData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Ventas por Dia</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Tendencia de ingresos en el periodo</p>
              </div>
              <Badge variant="outline" className="text-xs">
                {ventasDiaData.length} dias
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={ventasDiaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  tickFormatter={fmtShort}
                  axisLine={false}
                  tickLine={false}
                  width={55}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fill="url(#gradVentas)"
                  dot={{ r: 3, fill: "#6366f1", strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Charts Row 2: Top Productos + Segmentacion Clientes ── */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Productos - Bar */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Top Productos</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Los 5 mas vendidos del periodo</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-100">
                <Package className="h-4 w-4 text-violet-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {topBarData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Package className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">Sin ventas en este periodo</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topBarData} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={110}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
                          <p className="text-sm font-medium">{d.nombreFull}</p>
                          <p className="text-xs text-muted-foreground">{d.detalle}</p>
                          <p className="text-xs mt-1">{d.cantidad} uds &middot; {fmt(d.total)}</p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={18}>
                    {topBarData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Segmentacion Clientes - Donut */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Segmentacion de Clientes</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribucion por frecuencia de compra</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {data.segmentacionClientes.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">Sin clientes registrados</p>
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="45%" height={220}>
                  <PieChart>
                    <Pie
                      data={clientesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {clientesPieData.map((_, i) => (
                        <Cell key={i} fill={CLIENTES_COLORS[i % CLIENTES_COLORS.length]} />
                      ))}
                      <Label
                        content={({ viewBox }) => (
                          <CenterLabel
                            viewBox={viewBox as { cx: number; cy: number }}
                            value={String(data.segmentacionClientes.total)}
                            label="clientes"
                          />
                        )}
                        position="center"
                      />
                    </Pie>
                    <Tooltip content={<PieChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-4 pl-2">
                  {[
                    { label: "Frecuentes", desc: "5+ compras", count: data.segmentacionClientes.frecuentes, color: CLIENTES_COLORS[0] },
                    { label: "Ocasionales", desc: "2-4 compras", count: data.segmentacionClientes.ocasionales, color: CLIENTES_COLORS[1] },
                    { label: "Nuevos", desc: "1 compra", count: data.segmentacionClientes.nuevos, color: CLIENTES_COLORS[2] },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium leading-none">{s.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                      <span className="text-lg font-bold tabular-nums">{s.count}</span>
                    </div>
                  ))}
                  <div className="border-t pt-3">
                    <p className="text-xs text-muted-foreground">
                      Tasa de fidelizacion: <span className="font-semibold text-indigo-600">{porcentajeFrecuentes}%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 3: Tipo de Pago + Stock Critico ── */}
      <div className={`grid ${isAdmin ? "lg:grid-cols-2" : "grid-cols-1"} gap-4`}>
        {/* Tipo de Pago - Donut */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Metodos de Pago</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribucion de ingresos por metodo</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {tipoPagoPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <DollarSign className="h-10 w-10 opacity-20 mb-2" />
                <p className="text-sm">Sin ventas en este periodo</p>
              </div>
            ) : (
              <div className="flex items-center">
                <ResponsiveContainer width="45%" height={220}>
                  <PieChart>
                    <Pie
                      data={tipoPagoPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {tipoPagoPieData.map((_, i) => (
                        <Cell key={i} fill={PAGO_COLORS[i % PAGO_COLORS.length]} />
                      ))}
                      <Label
                        content={({ viewBox }) => (
                          <CenterLabel
                            viewBox={viewBox as { cx: number; cy: number }}
                            value={fmtShort(data.ventasTotales)}
                            label="total"
                          />
                        )}
                        position="center"
                      />
                    </Pie>
                    <Tooltip content={<PieChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3 pl-2">
                  {tipoPagoPieData.map((tp, i) => (
                    <div key={tp.name} className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PAGO_COLORS[i % PAGO_COLORS.length] }} />
                      <span className="text-sm flex-1">{tp.name}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums">{fmt(tp.value)}</p>
                        <p className="text-[11px] text-muted-foreground">{tp.porcentaje}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Critico */}
        {isAdmin && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Alertas de Stock</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Productos con stock critico o agotado</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {data.stockCritico.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-30 mb-2" />
                  <p className="text-sm">Todo el inventario en orden</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {data.stockCritico.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border px-3 py-2.5">
                      <div>
                        <p className="text-sm font-medium leading-none">{p.nombreProducto}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{p.talla} &middot; {p.color}</p>
                      </div>
                      <Badge
                        variant={p.stock === 0 ? "destructive" : "outline"}
                        className={p.stock > 0 ? "border-amber-300 bg-amber-50 text-amber-700" : ""}
                      >
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
    </div>
  )
}
