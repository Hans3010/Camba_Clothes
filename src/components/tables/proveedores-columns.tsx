"use client";

import { ColumnDef } from "@tanstack/react-table";

export type ProveedorColumn = {
  id: number;
  nombreEmpresa: string;
  representante: string;
  telefono: string;
  correo: string;
};

export const columns: ColumnDef<ProveedorColumn>[] = [
  {
    accessorKey: "nombreEmpresa",
    header: "Empresa",
  },
  {
    accessorKey: "representante",
    header: "Representante",
  },
  {
    accessorKey: "telefono",
    header: "Teléfono",
  },
  {
    accessorKey: "correo",
    header: "Email",
  },
];