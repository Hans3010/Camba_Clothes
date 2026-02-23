import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Warehouse } from "lucide-react"

export default function InventarioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Warehouse className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Inventario — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Log de movimientos de inventario (entradas, salidas, ajustes) y
            consulta de stock actual por producto.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
