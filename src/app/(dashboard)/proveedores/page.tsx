import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table"; 
import { Separator } from "@/components/ui/separator";
// CORRECCIÓN AQUÍ: Asegúrate que la ruta sea idéntica a donde creaste el archivo
import { columns } from "@/components/tables/proveedores-columns";
import Link from "next/link";

export default async function ProveedoresPage() {
  // Obtenemos los proveedores directamente desde la base de datos (Server Component)
  const proveedores = await prisma.proveedor.findMany({
  orderBy: {
    id: "desc", // Usamos 'id' en lugar de 'createdAt' para evitar el error
  },
});

  const formattedProveedores = proveedores.map((item) => ({
    id: item.id,
    nombreEmpresa: item.nombreEmpresa,
    representante: item.representante || "N/A",
    telefono: item.telefono,
    correo: item.correo || "N/A",
  }));

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Proveedores</h2>
            <p className="text-sm text-muted-foreground">
              Gestiona los proveedores de Camba Clothes
            </p>
          </div>
          <Button asChild>
            <Link href="/proveedores/nuevo">
              <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo
            </Link>
          </Button>
        </div>
        <Separator />
        <DataTable searchKey="nombreEmpresa" columns={columns} data={formattedProveedores} />
      </div>
    </div>
  );
}
