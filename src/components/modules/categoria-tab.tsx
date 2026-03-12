"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Edit } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoreHorizontal } from "lucide-react"

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
            <TableHead className="w-20"></TableHead>
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
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {cat.estado === "ACTIVO" ? (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleToggleEstado(cat.id, "INACTIVO")}
                        >
                          Desactivar
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-green-600 focus:text-green-600"
                          onClick={() => handleToggleEstado(cat.id, "ACTIVO")}
                        >
                          Activar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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
