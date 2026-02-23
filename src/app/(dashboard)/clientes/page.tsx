import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"

export default function ClientesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes</h1>
      <Card className="max-w-md">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Clientes — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Registro y búsqueda de clientes por nombre y teléfono. CRUD completo.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
