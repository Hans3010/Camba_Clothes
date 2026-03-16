"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, TrendingDown, Users, Settings, GraduationCap, DollarSign } from "lucide-react"

interface CMIData {
  financiera: { ingresosBrutos: number; costoTotal: number; gananciaTotal: number; margenPromedio: number; totalCompras: number }
  clientes: { clientesActivos: number; clientesNuevos: number; frecuentes: number; ocasionales: number; ticketPromedio: number }
  procesosInternos: { rotacionInventario: number; productosStockCritico: number; productosAgotados: number; tasaAnulacion: number }
  aprendizaje: { cambioVentas: number; cambioMargen: number; ventasActual: number; ventasAnterior: number }
}

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function Indicador({ label, valor, sufijo }: { label: string; valor: string; sufijo?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{valor}{sufijo && <span className="text-sm font-normal text-muted-foreground ml-1">{sufijo}</span>}</p>
    </div>
  )
}

function getDefaultDesde() {
  const d = new Date(); d.setDate(1); return d.toISOString().split("T")[0]
}

export function TabCMI() {
  const [desde, setDesde] = useState(getDefaultDesde())
  const [hasta, setHasta] = useState(new Date().toISOString().split("T")[0])
  const [data, setData] = useState<CMIData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchCMI = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/cmi?desde=${desde}&hasta=${hasta}`)
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      toast.error("Error al generar CMI")
    } finally {
      setLoading(false)
    }
  }, [desde, hasta])

  return (
    <div className="space-y-6">
      <div className="flex gap-3 flex-wrap items-end">
        <div>
          <label className="text-xs text-muted-foreground">Desde</label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Hasta</label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="w-40" />
        </div>
        <Button onClick={fetchCMI} disabled={loading}>
          <Search className="h-4 w-4 mr-2" />
          {loading ? "Generando..." : "Generar CMI"}
        </Button>
      </div>

      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Perspectiva Financiera
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Indicador label="Ingresos Brutos" valor={fmt(data.financiera.ingresosBrutos)} />
                <Indicador label="Costo de Mercadería" valor={fmt(data.financiera.costoTotal)} />
                <Indicador label="Ganancia Bruta" valor={fmt(data.financiera.gananciaTotal)} />
                <Indicador label="Margen Promedio" valor={`${data.financiera.margenPromedio.toFixed(1)}%`} />
                <Indicador label="Compras a Proveedores" valor={fmt(data.financiera.totalCompras)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Perspectiva de Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Indicador label="Clientes Activos" valor={String(data.clientes.clientesActivos)} sufijo="en período" />
                <Indicador label="Clientes Nuevos" valor={String(data.clientes.clientesNuevos)} />
                <Indicador label="Frecuentes" valor={String(data.clientes.frecuentes)} sufijo="(5+ compras)" />
                <Indicador label="Ocasionales" valor={String(data.clientes.ocasionales)} sufijo="(1-4 compras)" />
                <Indicador label="Ticket Promedio" valor={fmt(data.clientes.ticketPromedio)} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-orange-600" />
                Procesos Internos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Indicador label="Rotación de Inventario" valor={`${data.procesosInternos.rotacionInventario.toFixed(2)}x`} />
                <Indicador label="Stock Crítico" valor={String(data.procesosInternos.productosStockCritico)} sufijo="productos" />
                <Indicador label="Agotados" valor={String(data.procesosInternos.productosAgotados)} sufijo="productos" />
                <Indicador label="Tasa de Anulación" valor={`${data.procesosInternos.tasaAnulacion.toFixed(1)}%`} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                Aprendizaje y Crecimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Variación de Ventas</p>
                  <div className="flex items-center gap-1">
                    {data.aprendizaje.cambioVentas >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-lg font-bold ${data.aprendizaje.cambioVentas >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.aprendizaje.cambioVentas >= 0 ? "+" : ""}{data.aprendizaje.cambioVentas.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Variación de Margen</p>
                  <div className="flex items-center gap-1">
                    {data.aprendizaje.cambioMargen >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-lg font-bold ${data.aprendizaje.cambioMargen >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {data.aprendizaje.cambioMargen >= 0 ? "+" : ""}{data.aprendizaje.cambioMargen.toFixed(1)} pp
                    </span>
                  </div>
                </div>
                <Indicador label="Ventas Período Actual" valor={fmt(data.aprendizaje.ventasActual)} />
                <Indicador label="Ventas Período Anterior" valor={fmt(data.aprendizaje.ventasAnterior)} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
