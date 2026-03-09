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

export interface ClienteRow {
  id: number
  nombre: string
  apPaterno: string
  apMaterno: string | null
  telefono: string
  correo: string | null
  estado: "ACTIVO" | "INACTIVO"
}

export const createClientesColumns = (
  onEdit: (id: number) => void,
  onToggleEstado: (id: number, estado: "ACTIVO" | "INACTIVO") => void
): ColumnDef<ClienteRow>[] => [
  {
    id: "nombreCompleto",
    header: "Cliente",
    // Incluye teléfono para que el buscador del DataTable también filtre por teléfono
    accessorFn: (row) =>
      `${row.apPaterno} ${row.apMaterno ?? ""} ${row.nombre} ${row.telefono}`.trim(),
    cell: ({ row }) => {
      const { nombre, apPaterno, apMaterno } = row.original
      return (
        <div>
          <p className="font-medium">
            {apPaterno}
            {apMaterno ? ` ${apMaterno}` : ""}, {nombre}
          </p>
        </div>
      )
    },
  },
  {
    header: "Teléfono",
    accessorKey: "telefono",
  },
  {
    header: "Correo",
    accessorKey: "correo",
    cell: ({ row }) =>
      row.original.correo ? (
        <span className="text-sm">{row.original.correo}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
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
          <Button variant="ghost" size="icon" onClick={() => onEdit(id)} title="Editar cliente">
            <Edit className="h-4 w-4" />
          </Button>
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
                  Desactivar cliente
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-green-600 focus:text-green-600"
                  onClick={() => onToggleEstado(id, "ACTIVO")}
                >
                  Activar cliente
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
