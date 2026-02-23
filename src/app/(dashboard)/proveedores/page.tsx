import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck } from "lucide-react"

export default function ProveedoresPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Proveedores</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Truck className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Proveedores — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            CRUD de proveedores: empresa, representante, teléfono, correo y ubicación.
            Solo accesible para ADMIN.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
