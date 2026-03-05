"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Categoria {
  id: number
  nombreCategoria: string
  descripcion: string | null
  estado: "ACTIVO" | "INACTIVO"
}

export default function CategoriasTab() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [search, setSearch] = useState("")
  const [showDialog, setShowDialog] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" })

  const fetchCategorias = async () => {
    const res = await fetch("/api/categorias")
    const data = await res.json()
    setCategorias(Array.isArray(data) ? data : [])
  }

  useEffect(() => { fetchCategorias() }, [])

  const filtered = categorias.filter((c) =>
    c.nombreCategoria.toLowerCase().includes(search.toLowerCase())
  )

  const openNew = () => {
    setEditId(null)
    setFormData({ nombre: "", descripcion: "" })
    setShowDialog(true)
  }

  const openEdit = (cat: Categoria) => {
    setEditId(cat.id)
    setFormData({ nombre: cat.nombreCategoria, descripcion: cat.descripcion ?? "" })
    setShowDialog(true)
  }

  const handleSave = async () => {
    const payload = { nombreCategoria: formData.nombre, descripcion: formData.descripcion }
    const url = editId ? `/api/categorias/${editId}` : "/api/categorias"
    const method = editId ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      toast.success(editId ? "Categoría actualizada" : "Categoría creada")
      await fetchCategorias()
      setShowDialog(false)
    } else {
      toast.error("Error al guardar")
    }
  }

  const handleToggleEstado = async (id: number, nuevoEstado: "ACTIVO" | "INACTIVO") => {
    const res = await fetch(`/api/categorias/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      toast.success(nuevoEstado === "ACTIVO" ? "Categoría activada" : "Categoría desactivada")
      await fetchCategorias()
    } else {
      toast.error("Error al cambiar estado")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Buscar categoría..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openNew}>Nueva Categoría</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((cat) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{cat.nombreCategoria}</TableCell>
              <TableCell className="text-muted-foreground">{cat.descripcion ?? "—"}</TableCell>
              <TableCell>
                <Badge className={cat.estado === "ACTIVO" ? "bg-green-600" : "bg-gray-400"}>
                  {cat.estado}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(cat)}>
                    Editar
                  </Button>
                  {cat.estado === "ACTIVO" ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleToggleEstado(cat.id, "INACTIVO")}
                    >
                      Desactivar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-600 hover:bg-green-50"
                      onClick={() => handleToggleEstado(cat.id, "ACTIVO")}
                    >
                      Activar
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No se encontraron categorías
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Categoría" : "Nueva Categoría"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Camisa"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción opcional"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
