"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Movimiento {
  id: number
  fecha: string
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE"
  origen: string
  cantidad: number
  descripcion: string
  producto: { nombreProducto: string; talla: string; color: string }
  usuario: { usuario: string }
}

const tipoColor: Record<string, string> = {
  ENTRADA: "bg-green-600",
  SALIDA: "bg-red-500",
  AJUSTE: "bg-yellow-500",
}

export default function InventarioPage() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/inventario")
      .then((r) => r.json())
      .then((data) => setMovimientos(Array.isArray(data) ? data : []))
  }, [])

  const filtered = movimientos.filter(
    (m) =>
      m.producto.nombreProducto.toLowerCase().includes(search.toLowerCase()) ||
      m.descripcion.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimientos de Inventario</h1>

      <Input
        placeholder="Buscar por producto o descripción..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Origen</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Usuario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                {new Date(m.fecha).toLocaleString("es-BO")}
              </TableCell>
              <TableCell>
                <p className="font-medium">{m.producto.nombreProducto}</p>
                <p className="text-xs text-muted-foreground">
                  {m.producto.talla} · {m.producto.color}
                </p>
              </TableCell>
              <TableCell>
                <Badge className={tipoColor[m.tipo]}>{m.tipo}</Badge>
              </TableCell>
              <TableCell className="text-sm">{m.origen.replace(/_/g, " ")}</TableCell>
              <TableCell
                className={`text-right font-mono font-semibold ${
                  m.cantidad < 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
              </TableCell>
              <TableCell className="text-sm">{m.descripcion}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{m.usuario.usuario}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No hay movimientos registrados
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
