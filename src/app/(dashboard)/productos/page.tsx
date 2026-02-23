import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package } from "lucide-react"

export default function ProductosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Productos</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Productos — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            CRUD completo de productos: nombre, categoría, talla, color, precio de venta,
            costo, margen, stock y stock mínimo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
