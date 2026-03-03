"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

export type UsuarioColumn = {
  id: number;
  usuario: string;
  rol: string;
  estado: string;
};

export const columns: ColumnDef<UsuarioColumn>[] = [
  {
    accessorKey: "usuario",
    header: "Nombre de Usuario",
  },
  {
    accessorKey: "rol",
    header: "Rol",
    cell: ({ row }) => {
      const rol = row.getValue("rol") as string;
      return (
        <Badge variant={rol === "ADMINISTRADOR" ? "default" : "secondary"}>
          {rol}
        </Badge>
      );
    },
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => {
      const estado = row.getValue("estado") as string;
      return (
        <Badge 
          className={estado === "ACTIVO" ? "bg-green-500 hover:bg-green-600" : "bg-destructive"}
        >
          {estado}
        </Badge>
      );
    },
  },
];