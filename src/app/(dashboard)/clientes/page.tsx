"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ClienteForm } from "@/components/forms/cliente-form"
import { createClientesColumns, ClienteRow } from "@/components/tables/clientes-columns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Users, Star, ShoppingBag, UserCheck } from "lucide-react"

// ─── Types ─────────────────────────────────────────────────────────────────

type Segmento = "FRECUENTE" | "OCASIONAL" | "NUEVO"

interface ClienteSegmento {
  id: number
  nombre: string
  apPaterno: string
  apMaterno: string | null
  telefono: string
  correo: string | null
  estado: string
  totalCompras: number
  montoAcumulado: number
  ticketPromedio: number
  segmento: Segmento
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const segmentoBadge: Record<Segmento, { label: string; className: string }> = {
  FRECUENTE: { label: "Frecuente", className: "bg-green-600" },
  OCASIONAL: { label: "Ocasional", className: "bg-blue-500" },
  NUEVO:     { label: "Nuevo",     className: "bg-gray-400" },
}

function fmt(n: number) {
  return `Bs. ${n.toLocaleString("es-BO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ClientesPage() {
  // Directorio
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

  // Segmentación
  const [segmentacion, setSegmentacion] = useState<ClienteSegmento[]>([])
  const [loadingSeg, setLoadingSeg] = useState(true)
  const [filterSegmento, setFilterSegmento] = useState<string>("all")
  const [searchSeg, setSearchSeg] = useState("")

  const fetchClientes = useCallback(async () => {
    try {
      const res = await fetch("/api/clientes")
      const data = await res.json()
      setClientes(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar clientes")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSegmentacion = useCallback(async () => {
    try {
      setLoadingSeg(true)
      const res = await fetch("/api/clientes/segmentacion")
      const data = await res.json()
      setSegmentacion(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar segmentación")
    } finally {
      setLoadingSeg(false)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
    fetchSegmentacion()
  }, [fetchClientes, fetchSegmentacion])

  const handleToggleEstado = useCallback(
    async (id: number, estado: "ACTIVO" | "INACTIVO") => {
      const res = await fetch(`/api/clientes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        toast.success(estado === "ACTIVO" ? "Cliente activado" : "Cliente desactivado")
        fetchClientes()
      } else {
        toast.error("Error al cambiar estado del cliente")
      }
    },
    [fetchClientes]
  )

  const handleOpenEdit = useCallback((id: number) => {
    setEditingId(id)
    setEditOpen(true)
  }, [])

  const columns = useMemo(
    () => createClientesColumns(handleOpenEdit, handleToggleEstado),
    [handleOpenEdit, handleToggleEstado]
  )

  // Segmentación filtrada
  const filteredSeg = useMemo(() => {
    return segmentacion.filter((c) => {
      const matchSeg = filterSegmento === "all" || c.segmento === filterSegmento
      const matchSearch =
        searchSeg === "" ||
        `${c.apPaterno} ${c.apMaterno ?? ""} ${c.nombre} ${c.telefono}`
          .toLowerCase()
          .includes(searchSeg.toLowerCase())
      return matchSeg && matchSearch
    })
  }, [segmentacion, filterSegmento, searchSeg])

  // KPIs
  const stats = useMemo(() => {
    const frecuentes = segmentacion.filter((c) => c.segmento === "FRECUENTE").length
    const ocasionales = segmentacion.filter((c) => c.segmento === "OCASIONAL").length
    const nuevos = segmentacion.filter((c) => c.segmento === "NUEVO").length
    const montoTotal = segmentacion.reduce((acc, c) => acc + c.montoAcumulado, 0)
    return { frecuentes, ocasionales, nuevos, montoTotal }
  }, [segmentacion])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? "" : `${clientes.length} clientes registrados`}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Tabs defaultValue="directorio">
        <TabsList>
          <TabsTrigger value="directorio">
            <Users className="h-4 w-4 mr-2" />
            Directorio
          </TabsTrigger>
          <TabsTrigger value="segmentacion">
            <Star className="h-4 w-4 mr-2" />
            Segmentación
          </TabsTrigger>
        </TabsList>

        {/* ── Tab: Directorio ── */}
        <TabsContent value="directorio" className="mt-4">
          {loading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando clientes...</p>
          ) : (
            <DataTable searchKey="nombreCompleto" columns={columns} data={clientes} />
          )}
        </TabsContent>

        {/* ── Tab: Segmentación ── */}
        <TabsContent value="segmentacion" className="mt-4 space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Frecuentes</CardTitle>
                <Star className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.frecuentes}</div>
                <p className="text-xs text-muted-foreground mt-1">≥ 5 compras</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ocasionales</CardTitle>
                <ShoppingBag className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.ocasionales}</div>
                <p className="text-xs text-muted-foreground mt-1">1 – 4 compras</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.nuevos}</div>
                <p className="text-xs text-muted-foreground mt-1">Sin compras aún</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">Facturación total</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold leading-tight">{fmt(stats.montoTotal)}</div>
                <p className="text-xs text-muted-foreground mt-1">Todos los clientes</p>
              </CardContent>
            </Card>
          </div>

          {/* Criterio */}
          <div className="text-xs text-muted-foreground bg-muted/40 border rounded-md px-4 py-2">
            <strong>Criterio de clasificación:</strong>{" "}
            <span className="text-green-700 font-medium">Frecuente</span> ≥ 5 ventas completadas ·{" "}
            <span className="text-blue-600 font-medium">Ocasional</span> 1–4 ventas ·{" "}
            <span className="font-medium">Nuevo</span> sin ventas registradas
          </div>

          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <Input
              placeholder="Buscar cliente o teléfono..."
              value={searchSeg}
              onChange={(e) => setSearchSeg(e.target.value)}
              className="max-w-xs"
            />
            <Select value={filterSegmento} onValueChange={setFilterSegmento}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los segmentos</SelectItem>
                <SelectItem value="FRECUENTE">Frecuente</SelectItem>
                <SelectItem value="OCASIONAL">Ocasional</SelectItem>
                <SelectItem value="NUEVO">Nuevo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          {loadingSeg ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Cargando segmentación...</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Segmento</TableHead>
                    <TableHead className="text-right">Compras</TableHead>
                    <TableHead className="text-right">Monto acumulado</TableHead>
                    <TableHead className="text-right">Ticket promedio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSeg.map((c) => {
                    const seg = segmentoBadge[c.segmento]
                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="font-medium text-sm">
                            {c.apPaterno}
                            {c.apMaterno ? ` ${c.apMaterno}` : ""}, {c.nombre}
                          </p>
                          {c.correo && (
                            <p className="text-xs text-muted-foreground">{c.correo}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{c.telefono}</TableCell>
                        <TableCell>
                          <Badge className={`${seg.className} text-xs`}>{seg.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold">
                          {c.totalCompras}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          {c.totalCompras > 0 ? (
                            fmt(c.montoAcumulado)
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {c.totalCompras > 0 ? (
                            fmt(c.ticketPromedio)
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredSeg.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No hay clientes en este segmento
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog: Crear */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            onSuccess={() => {
              setCreateOpen(false)
              fetchClientes()
              fetchSegmentacion()
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar */}
      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) setEditingId(null)
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            key={editingId}
            initialId={editingId}
            onSuccess={() => {
              setEditOpen(false)
              setEditingId(null)
              fetchClientes()
              fetchSegmentacion()
            }}
            onCancel={() => {
              setEditOpen(false)
              setEditingId(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
