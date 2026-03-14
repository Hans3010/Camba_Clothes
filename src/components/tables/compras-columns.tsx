"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

export interface DetalleCompraRow {
  id: number
  cantidad: number
  precioCompra: number
  subtotal: number
  producto: { nombreProducto: string; talla: string; color: string }
}

export interface CompraRow {
  id: number
  fecha: string
  subtotal: number
  descuento: number
  total: number
  numeroDocumento: string | null
  tipoDocumento: string | null
  proveedor: { nombreEmpresa: string }
  usuario: { usuario: string }
  detalles: DetalleCompraRow[]
}

function formatFecha(dateStr: string) {
  return new Intl.DateTimeFormat("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateStr))
}

export const createComprasColumns = (
  onVerDetalle?: (compra: CompraRow) => void
): ColumnDef<CompraRow>[] => [
  {
    header: "#",
    accessorKey: "id",
    size: 60,
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">#{row.original.id}</span>
    ),
  },
  {
    header: "Fecha",
    accessorKey: "fecha",
    cell: ({ row }) => (
      <span className="text-sm whitespace-nowrap">{formatFecha(row.original.fecha)}</span>
    ),
  },
  {
    header: "Proveedor",
    id: "proveedor",
    accessorFn: (row) => row.proveedor.nombreEmpresa,
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.proveedor.nombreEmpresa}</span>
    ),
  },
  {
    header: "Registrado por",
    id: "usuario",
    accessorFn: (row) => row.usuario.usuario,
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">{row.original.usuario.usuario}</span>
    ),
  },
  {
    header: "Documento",
    id: "documento",
    cell: ({ row }) => {
      const num = row.original.numeroDocumento
      const tipo = row.original.tipoDocumento
      if (!num) return <span className="text-muted-foreground text-xs">—</span>
      return (
        <span className="text-sm">
          {tipo && <span className="text-muted-foreground text-xs mr-1">{tipo}</span>}
          {num}
        </span>
      )
    },
  },
  {
    header: "Productos",
    id: "items",
    cell: ({ row }) => {
      const count = row.original.detalles.length
      return (
        <Badge variant="secondary" className="font-normal">
          {count} {count === 1 ? "ítem" : "ítems"}
        </Badge>
      )
    },
  },
  {
    header: "Descuento",
    accessorKey: "descuento",
    cell: ({ row }) => {
      const v = Number(row.original.descuento)
      if (!v) return <span className="text-muted-foreground text-xs">—</span>
      return <span className="text-sm text-orange-600">- Bs. {v.toFixed(2)}</span>
    },
  },
  {
    header: "Total",
    accessorKey: "total",
    cell: ({ row }) => (
      <span className="font-semibold text-sm">
        Bs. {Number(row.original.total).toFixed(2)}
      </span>
    ),
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) =>
      onVerDetalle ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onVerDetalle(row.original)}
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </Button>
      ) : null,
  },
]
