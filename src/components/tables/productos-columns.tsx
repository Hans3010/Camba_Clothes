"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Producto {
  id: number;
  nombreProducto: string;
  marca: string;
  talla: string;
  color: string;
  precioVenta: number;
  costo: number;
  margen: number;
  stock: number;
  stockMinimo: number;
  estado: "ACTIVO" | "INACTIVO";
  categoriaProducto: {
    nombreCategoria: string;
  };
}

export const productosColumns: ColumnDef<Producto>[] = [
  {
    header: "Categoría",
    accessorKey: "categoriaProducto.nombreCategoria",
  },
  {
    header: "Producto",
    accessorKey: "nombreProducto",
  },
  {
    header: "Marca",
    accessorKey: "marca",
  },
  {
    header: "Talla",
    accessorKey: "talla",
  },
  {
    header: "Color",
    accessorKey: "color",
  },
  {
    header: "Precio",
    accessorKey: "precioVenta",
    cell: ({ row }) => {
      const precio = row.original.precioVenta;
      return <span>{`Bs. ${precio.toFixed(2)}`}</span>;
    },
  },
  {
    header: "Costo",
    accessorKey: "costo",
    cell: ({ row }) => {
      const costo = row.original.costo;
      return <span>{`Bs. ${costo.toFixed(2)}`}</span>;
    },
  },
  {
    header: "Margen",
    accessorKey: "margen",
    cell: ({ row }) => {
      const margen = row.original.margen;
      let color = "text-red-600";
      if (margen > 30) color = "text-green-600";
      else if (margen >= 15) color = "text-yellow-600";

      return <span className={color}>{`${margen}%`}</span>;
    },
  },
  {
    header: "Stock",
    accessorKey: "stock",
    cell: ({ row }) => {
      const { stock, stockMinimo } = row.original;
      if (stock <= stockMinimo) {
        return <Badge variant="destructive">{stock}</Badge>;
      }
      return <Badge variant="outline">{stock}</Badge>;
    },
  },
  {
    header: "Estado",
    accessorKey: "estado",
    cell: ({ row }) => {
      const estado = row.original.estado;
      return (
        <Badge className={estado === "ACTIVO" ? "bg-green-600" : "bg-gray-400"}>
          {estado}
        </Badge>
      );
    },
  },
  {
    header: "Acciones",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => console.log("Editar", row.original.id)}
          >
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => console.log("Desactivar", row.original.id)}
          >
            Desactivar
          </Button>
        </div>
      );
    },
  },
];

