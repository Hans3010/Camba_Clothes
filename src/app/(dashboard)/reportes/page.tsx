import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3 } from "lucide-react"

export default function ReportesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reportes</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Reportes — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Ventas por período, inventario actual, productos más vendidos por categoría
            y rentabilidad por producto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
