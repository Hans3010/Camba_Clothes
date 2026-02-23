import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingBag } from "lucide-react"

export default function ComprasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Compras</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Compras — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registro de compras a proveedores. Actualiza el stock de productos
            automáticamente y registra movimientos de inventario.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
