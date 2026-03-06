"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Edit, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ProductoRow {
  id: number
  idCategoriaProducto: number
  nombreProducto: string
  marca: string
  talla: string
  color: string
  temporada: string
  precioVenta: number
  costo: number
  margen: number
  stock: number
  stockMinimo: number
  estado: "ACTIVO" | "INACTIVO"
  categoria: { nombreCategoria: string }
}

export const createProductosColumns = (
  onToggleEstado: (id: number, nuevoEstado: "ACTIVO" | "INACTIVO") => void,
  onEdit?: (id: number) => void,
): ColumnDef<ProductoRow>[] => [
  {
    header: "Categoría",
    accessorFn: (row) => row.categoria?.nombreCategoria ?? "—",
    id: "categoria",
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
    cell: ({ row }) => `Bs. ${Number(row.original.precioVenta).toFixed(2)}`,
  },
  {
    header: "Margen",
    accessorKey: "margen",
    cell: ({ row }) => {
      const margen = Number(row.original.margen)
      const color =
        margen > 30 ? "text-green-600" : margen >= 15 ? "text-yellow-600" : "text-red-600"
      return <span className={color}>{margen.toFixed(1)}%</span>
    },
  },
  {
    header: "Stock",
    accessorKey: "stock",
    cell: ({ row }) => {
      const { stock, stockMinimo } = row.original
      return stock <= stockMinimo ? (
        <Badge variant="destructive">{stock}</Badge>
      ) : (
        <Badge variant="outline">{stock}</Badge>
      )
    },
  },
  {
    header: "Estado",
    accessorKey: "estado",
    cell: ({ row }) => (
      <Badge className={row.original.estado === "ACTIVO" ? "bg-green-600" : "bg-gray-400"}>
        {row.original.estado}
      </Badge>
    ),
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => {
      const { id, estado } = row.original
      return (
        <div className="flex items-center gap-1">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={() => onEdit(id)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {estado === "ACTIVO" ? (
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600"
                  onClick={() => onToggleEstado(id, "INACTIVO")}
                >
                  Desactivar producto
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={() => onToggleEstado(id, "ACTIVO")}
                >
                  Activar producto
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
