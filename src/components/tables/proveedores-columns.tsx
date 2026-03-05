"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export type ProveedorColumn = {
  id: number;
  nombreEmpresa: string;
  representante: string;
  telefono: string;
  correo: string;
};

export const columns = (onEdit: (id: number) => void): ColumnDef<ProveedorColumn>[] => [
  {
    accessorKey: "nombreEmpresa", // DEBE coincidir con el esquema
    header: "Empresa",
  },
  {
    accessorKey: "representante", // DEBE coincidir con el esquema
    header: "Contacto",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => (
      <Button variant="ghost" size="icon" onClick={() => onEdit(row.original.id)}>
        <Edit className="h-4 w-4" />
      </Button>
    ),
  },
];