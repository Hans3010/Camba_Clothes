import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import CategoriasTab from "@/components/modules/categoria-tab";

export default function CategoriaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold">Categoria</h1>
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Módulo Categoria — En desarrollo</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriasTab />
        </CardContent>
      </Card>
    </div>
  )
}
