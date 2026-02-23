import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShoppingCart } from "lucide-react"

export default function PosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Punto de Venta</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo POS — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Búsqueda de productos, carrito de compras, selección de método de pago
            y generación de nota de venta.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
