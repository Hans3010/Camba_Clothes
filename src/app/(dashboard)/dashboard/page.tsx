import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <LayoutDashboard className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Dashboard — Próximamente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Aquí se mostrarán los KPIs principales: ventas del día, productos más vendidos,
            stock crítico y margen de ganancia promedio.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
