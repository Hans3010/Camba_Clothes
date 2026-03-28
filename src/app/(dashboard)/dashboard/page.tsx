"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Package,
  DollarSign, Users, Target, Receipt, Percent, UserPlus, Star, Activity, XCircle, BarChart3, RotateCw, PieChart as PieChartIcon
} from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, AreaChart, Area, Cell, PieChart, Pie, Label
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
interface VentaDia {
  fecha: string; ingreso: number; ganancia: number
}
interface DashboardData {
  ingresosBrutos: number
  gananciaBruta: number
  margenPromedio: number
  comparativa: { ventasAnterior: number; porcentajeCambio: number; porcentajeCambioGanancia: number }
  
  clientesActivos: number
  clientesNuevos: number
  clientesFrecuentes: number
  ticketPromedio: number
  segmentacionClientes: { frecuentes: number; ocasionales: number; nuevos: number; total: number }
  
  rotacionInventario: number
  productosStockCritico: number
  tasaAnulacion: number

  topProductos: TopProducto[]
  ventasPorDia: VentaDia[]
  stockCriticoList: StockCritico[]
}

// ── Helpers ──

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtShort(n: number) {
  if (n >= 1000) return `Bs.${(n / 1000).toFixed(1)}k`
  return `Bs.${n.toFixed(0)}`
}

const BAR_COLORS = ["#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"]
const CLIENTES_COLORS = ["#6366f1", "#f59e0b", "#10b981"]

// ── Center Label for Pie ──

function CenterLabel({ viewBox, value, label }: { viewBox?: { cx: number; cy: number }; value: string; label: string }) {
  if (!viewBox) return null
  const { cx, cy } = viewBox
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-900 text-xl font-bold">
        {value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" className="fill-slate-500 text-[11px]">
        {label}
      </text>
    </g>
  )
}

function PieChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { porcentaje: string } }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
      <p className="text-sm font-medium">{payload[0].name}</p>
      <p className="text-xs text-muted-foreground">{payload[0].value} clientes &middot; {payload[0].payload.porcentaje}</p>
    </div>
  )
}

// ── KPI Card ──

function KpiCard({ title, value, subtitle, icon: Icon, iconBg, iconColor, trend, trendValue, meta }: {
  title: string; value: string; subtitle?: string
  icon: React.ElementType; iconBg: string; iconColor: string
  trend?: boolean; trendValue?: number
  meta?: { label: string; value: number; tipo: "min" | "max" | "crecimiento"}
}) {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <div className="flex items-center gap-1.5 h-4">
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
              {!trend && trend === undefined && subtitle && (
                <span className="text-[11px] text-muted-foreground break-words max-w-[180px]">{subtitle}</span>
              )}
            </div>
            {meta && (
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{meta.label}:</span>
                <span className={`text-[10px] font-medium ${
                  (meta.tipo === "crecimiento" || meta.tipo === "min" 
                    ? Number(value.replace(/[^\d.,-]/g, "").replace(",", ".")) >= meta.value
                    : Number(value.replace(/[^\d.,-]/g, "").replace(",", ".")) <= meta.value)
                    ? "text-emerald-600" : "text-amber-500"
                }`}>
                  {(meta.tipo === "crecimiento" || meta.tipo === "min" 
                    ? Number(value.replace(/[^\d.,-]/g, "").replace(",", ".")) >= meta.value
                    : Number(value.replace(/[^\d.,-]/g, "").replace(",", ".")) <= meta.value)
                    ? "Cumplida" : "Pendiente"}
                </span>
              </div>
            )}
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
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

  const [periodo, setPeriodo] = useState("mes")
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">Analizando métricas...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const cambio = data.comparativa.porcentajeCambio
  const periodoLabel = periodo === "dia" ? "hoy" : periodo === "semana" ? "esta semana" : "este mes"

  // ── Chart Data ──
  const ventasDiaData = data.ventasPorDia.map(v => ({
    fecha: new Date(v.fecha + "T12:00:00").toLocaleDateString("es-BO", { weekday: "short", day: "numeric" }),
    Ingresos: v.ingreso,
    Ganancias: v.ganancia
  }))

  const topBarData = data.topProductos.map((p, i) => ({
    nombre: p.nombreProducto.length > 18 ? p.nombreProducto.slice(0, 18) + "..." : p.nombreProducto,
    nombreFull: p.nombreProducto,
    detalle: `${p.talla} - ${p.color}`,
    cantidad: p.cantidadVendida,
    total: p.totalVendido,
    fill: BAR_COLORS[i] ?? BAR_COLORS[0],
  }))

  const clientesPieData = [
    { name: "Frecuentes", value: data.segmentacionClientes.frecuentes, color: CLIENTES_COLORS[0], porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.frecuentes / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
    { name: "Ocasionales", value: data.segmentacionClientes.ocasionales, color: CLIENTES_COLORS[1], porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.ocasionales / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
    { name: "Nuevos", value: data.segmentacionClientes.nuevos, color: CLIENTES_COLORS[2], porcentaje: `${data.segmentacionClientes.total > 0 ? ((data.segmentacionClientes.nuevos / data.segmentacionClientes.total) * 100).toFixed(0) : 0}%` },
  ].filter(d => d.value > 0)

  const porcentajeFrecuentes = data.segmentacionClientes.total > 0
    ? ((data.segmentacionClientes.frecuentes / data.segmentacionClientes.total) * 100).toFixed(0)
    : "0"

  return (
    <div className="space-y-8 pb-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Indicadores Estratégicos para {periodoLabel}</p>
        </div>
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-40 bg-white shadow-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dia">Hoy</SelectItem>
            <SelectItem value="semana">Esta Semana</SelectItem>
            <SelectItem value="mes">Este Mes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ═══ PERSPECTIVA FINANCIERA ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1.5 bg-indigo-500 rounded-full" />
          <h2 className="text-xl font-semibold tracking-tight">Perspectiva Financiera</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <KpiCard
            title="Ingresos Brutos"
            value={fmt(data.ingresosBrutos)}
            icon={DollarSign}
            iconBg="bg-indigo-100"
            iconColor="text-indigo-600"
            trend={cambio >= 0}
            trendValue={cambio}
            meta={{ label: "+5% crecimiento", value: 5, tipo: "crecimiento" }}
          />
          <KpiCard
            title="Ganancias Brutas"
            value={fmt(data.gananciaBruta)}
            subtitle="Ganancia operativa del periodo"
            icon={Activity}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            trend={data.comparativa.porcentajeCambioGanancia >= 0}
            trendValue={data.comparativa.porcentajeCambioGanancia}
            meta={{ label: "Meta: +5% crec.", value: 5, tipo: "crecimiento" }}
          />
          <KpiCard
            title="Margen Promedio"
            value={`${data.margenPromedio.toFixed(1)}%`}
            subtitle="Porcentaje de retorno libre"
            icon={Percent}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            meta={{ label: ">= 35%", value: 35, tipo: "min" }}
          />
        </div>

        {/* Gráfico Financiero Comparativo */}
        {ventasDiaData.length > 0 && (
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Ingresos Brutos vs Ganancias Brutas</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Comparativa métrica diaria de rendimiento</p>
                </div>
                <Badge variant="secondary" className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-transparent">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  {ventasDiaData.length} dias
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ventasDiaData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gradGanancias" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="fecha"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    tickFormatter={fmtShort}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '3 3' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
                          <p className="text-sm font-semibold mb-2">{label}</p>
                          {payload.map((p, i) => (
                            <div key={i} className="flex items-center justify-between gap-4 mb-1">
                              <span className="text-xs font-medium flex items-center gap-1.5" style={{ color: p.color }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                {p.name}
                              </span>
                              <span className="text-sm font-bold text-slate-800">{fmt(Number(p.value))}</span>
                            </div>
                          ))}
                        </div>
                      )
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                  <Area
                    type="monotone"
                    name="Ingresos Brutos"
                    dataKey="Ingresos"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fill="url(#gradIngresos)"
                    dot={{ r: 4, fill: "#ffffff", stroke: "#818cf8", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#818cf8", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                  <Area
                    type="monotone"
                    name="Ganancias Brutas"
                    dataKey="Ganancias"
                    stroke="#10b981"
                    strokeWidth={3}
                    fill="url(#gradGanancias)"
                    dot={{ r: 4, fill: "#ffffff", stroke: "#10b981", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 3 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="bg-slate-200" />

      {/* ═══ PERSPECTIVA DE CLIENTES ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1.5 bg-rose-500 rounded-full" />
          <h2 className="text-xl font-semibold tracking-tight">Perspectiva de Clientes</h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <KpiCard
            title="Clientes Activos"
            value={String(data.clientesActivos)}
            subtitle="Con compras en periodo"
            icon={Users}
            iconBg="bg-rose-100"
            iconColor="text-rose-600"
            meta={{ label: "Meta: >= 10", value: 10, tipo: "min" }}
          />
          <KpiCard
            title="Clientes Nuevos"
            value={String(data.clientesNuevos)}
            subtitle="Primera compra historia"
            icon={UserPlus}
            iconBg="bg-orange-100"
            iconColor="text-orange-600"
            meta={{ label: ">= 3", value: 3, tipo: "min" }}
          />
          <KpiCard
            title="Clientes Frecuentes"
            value={String(data.clientesFrecuentes)}
            subtitle="Activos con 5+ compras"
            icon={Star}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            meta={{ label: "Meta: >= 5", value: 5, tipo: "min" }}
          />
          <KpiCard
            title="Ticket Promedio"
            value={fmt(data.ticketPromedio)}
            subtitle="Ingreso medio / transacción"
            icon={Receipt}
            iconBg="bg-violet-100"
            iconColor="text-violet-600"
            meta={{ label: ">= Bs.100", value: 100, tipo: "min" }}
          />
        </div>

        {/* Segmentacion Clientes - Donut */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">Segmentación de Clientes Global</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Distribución general para entender la base de compradores</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <PieChartIcon className="h-4 w-4 text-indigo-600" />
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
              <div className="flex items-center flex-col md:flex-row max-w-2xl mx-auto md:max-w-none">
                <ResponsiveContainer width="100%" height={220} className="md:w-[45%]">
                  <PieChart>
                    <Pie
                      data={clientesPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {clientesPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
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
                <div className="w-full md:flex-1 space-y-4 pl-0 md:pl-2 mt-4 md:mt-0">
                  {[
                    { label: "Frecuentes", desc: "5+ compras en historial", count: data.segmentacionClientes.frecuentes, color: CLIENTES_COLORS[0] },
                    { label: "Ocasionales", desc: "2-4 compras en historial", count: data.segmentacionClientes.ocasionales, color: CLIENTES_COLORS[1] },
                    { label: "Nuevos", desc: "1 única compra en historial", count: data.segmentacionClientes.nuevos, color: CLIENTES_COLORS[2] },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-3 bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                      <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 leading-none mb-1">{s.label}</p>
                        <p className="text-xs text-slate-500">{s.desc}</p>
                      </div>
                      <span className="text-lg font-bold text-slate-700 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">{s.count}</span>
                    </div>
                  ))}
                  <div className="pt-2 px-2">
                    <p className="text-sm text-slate-600 font-medium">
                      Tasa de Fidelización: <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ml-1">{porcentajeFrecuentes}%</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-slate-200" />

      {/* ═══ PERSPECTIVA DE PROCESOS INTERNOS ═══ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-1.5 bg-emerald-500 rounded-full" />
          <h2 className="text-xl font-semibold tracking-tight">Perspectiva Procesos Internos</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <KpiCard
            title="Rotación de Inventario"
            value={`${data.rotacionInventario.toFixed(2)}x`}
            subtitle="Veces / Costo Ventas vs Inventario"
            icon={RotateCw}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            meta={{ label: ">= 1.0x", value: 1.0, tipo: "min" }}
          />
          <KpiCard
            title="Productos Stock Crítico"
            value={String(data.productosStockCritico)}
            subtitle="Alertas de inminente quiebre"
            icon={AlertTriangle}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            meta={{ label: "<= 10", value: 10, tipo: "max" }}
          />
          <KpiCard
            title="Tasa de Anulación"
            value={`${data.tasaAnulacion.toFixed(1)}%`}
            subtitle="Proporción fallida de operaciones"
            icon={XCircle}
            iconBg="bg-red-100"
            iconColor="text-red-600"
            meta={{ label: "<= 5%", value: 5, tipo: "max" }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Productos Chart */}
          <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Productos de Mayor Rotación</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Top 5 más vendidos en el periodo</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                  <Package className="h-4 w-4 text-emerald-600" />
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
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={topBarData} layout="vertical" margin={{ left: 0, right: 10, top: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="nombre"
                      tick={{ fontSize: 11, fill: "#64748b", fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                      width={120}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-white px-3 py-2 shadow-md">
                            <p className="text-sm font-semibold">{d.nombreFull}</p>
                            <p className="text-xs text-muted-foreground">{d.detalle}</p>
                            <div className="mt-2 text-xs font-medium text-slate-700">
                              <span className="text-indigo-600">{d.cantidad}</span> uds vendidas
                            </div>
                            <div className="text-xs font-medium text-slate-700">
                              <span className="text-emerald-600">{fmt(d.total)}</span>
                            </div>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={22}>
                      {topBarData.map((entry, i) => (
                        <Cell key={i} fill={["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5"][i] || "#10b981"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Widget Alerta de Stock Crítico */}
          {isAdmin && (
            <Card className="shadow-sm border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-amber-900">Atención de Stock</CardTitle>
                    <p className="text-xs text-amber-700 mt-0.5">Requieren reabastecer inventario</p>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                {data.stockCriticoList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-emerald-600">
                    <CheckCircle2 className="h-8 w-8 opacity-70 mb-2" />
                    <p className="text-sm font-medium">Inventario saludable y equilibrado</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                    {data.stockCriticoList.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-md border border-amber-100 bg-white px-3 py-2.5 shadow-sm">
                        <div className="min-w-0 pr-4">
                          <p className="text-sm font-medium text-slate-800 truncate">{p.nombreProducto}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.talla} &bull; {p.color}</p>
                        </div>
                        <Badge
                          variant={p.stock === 0 ? "destructive" : "outline"}
                          className={p.stock > 0 ? "border-amber-300 bg-amber-50 text-amber-700 whitespace-nowrap" : "whitespace-nowrap"}
                        >
                          {p.stock === 0 ? "Agotado" : `${p.stock} / ${p.stockMinimo}`}
                        </Badge>
                      </div>
                    ))}
                    {data.productosStockCritico > 10 && (
                      <p className="text-xs text-center text-amber-700 mt-2 font-medium">
                        + {data.productosStockCritico - 10} productos más críticos
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  )
}
