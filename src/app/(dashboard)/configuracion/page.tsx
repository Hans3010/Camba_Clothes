import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosTab } from "@/components/modules/usuarios-tab";

export default function ConfiguracionPage() {
  return (
    <div className="p-8">
      <Tabs defaultValue="usuarios">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="categorias">Categorías</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios" className="mt-6">
          <UsuariosTab />
        </TabsContent>
        {/* Placeholders para Luis y Jhonnatan */}
        <TabsContent value="pagos">Módulo de Luis Merma</TabsContent>
        <TabsContent value="categorias">Módulo de Jhonnatan Mamani</TabsContent>
      </Tabs>
    </div>
  );
}