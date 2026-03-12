"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type CompraRow = {
  id: number;
  proveedor: { nombreEmpresa: string };
  fecha: string;
  numeroDocumento: string;
  tipoDocumento: string;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
};

export const comprasColumns: ColumnDef<CompraRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "proveedor.nombreEmpresa",
    header: "Proveedor",
  },
  {
    accessorKey: "fecha",
    header: "Fecha",
    cell: ({ row }) => new Date(row.original.fecha).toLocaleDateString(),
  },
  {
    accessorKey: "numeroDocumento",
    header: "Nro Documento",
  },
  {
    accessorKey: "tipoDocumento",
    header: "Tipo Documento",
  },
  {
    accessorKey: "subtotal",
    header: "Subtotal",
  },
  {
    accessorKey: "descuento",
    header: "Descuento",
  },
  {
    accessorKey: "total",
    header: "Total",
  },
  {
    accessorKey: "estado",
    header: "Estado",
  },
];

// 🔹 Componente de filtros
export function ComprasFilters({ onFilter }: { onFilter: (filters: any) => void }) {
  const [proveedor, setProveedor] = useState("");
  const [fecha, setFecha] = useState("");
  const [estado, setEstado] = useState("");

  const aplicarFiltros = () => {
    onFilter({ proveedor, fecha, estado });
  };

  return (
    <div className="flex gap-2 mb-4">
      <Input
        placeholder="Buscar por proveedor"
        value={proveedor}
        onChange={(e) => setProveedor(e.target.value)}
      />
      <Input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      <Input
        placeholder="Estado (ACTIVO/ANULADO)"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      />
      <Button onClick={aplicarFiltros}>Filtrar</Button>
    </div>
  );
}