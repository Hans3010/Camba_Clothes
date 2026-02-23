import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Receipt } from "lucide-react"

export default function VentasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ventas</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Receipt className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Ventas — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Historial de ventas, detalle por venta y anulación de ventas (solo ADMIN).
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
