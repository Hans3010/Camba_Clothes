"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { createProductosColumns, ProductoRow } from "@/components/tables/productos-columns"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import ProductoForm from "@/components/forms/producto-form"
import { ProductoFormValues } from "@/lib/validations/producto"

export default function ProductosPage() {
  const [productos, setProductos] = useState<ProductoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCategoria, setFilterCategoria] = useState("all")
  const [filterMarca, setFilterMarca] = useState("all")
  const [filterTalla, setFilterTalla] = useState("all")

  // Dialog crear
  const [createOpen, setCreateOpen] = useState(false)

  // Dialog editar
  const [editOpen, setEditOpen] = useState(false)
  const [editingProducto, setEditingProducto] = useState<ProductoRow | null>(null)

  const fetchProductos = useCallback(async () => {
    try {
      const res = await fetch("/api/productos")
      const data = await res.json()
      setProductos(Array.isArray(data) ? data : [])
    } catch {
      toast.error("Error al cargar productos")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProductos() }, [fetchProductos])

  const handleToggleEstado = useCallback(async (id: number, nuevoEstado: "ACTIVO" | "INACTIVO") => {
    const res = await fetch(`/api/productos/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado }),
    })
    if (res.ok) {
      toast.success(nuevoEstado === "ACTIVO" ? "Producto activado" : "Producto desactivado")
      fetchProductos()
    } else {
      toast.error("Error al cambiar estado")
    }
  }, [fetchProductos])

  const handleOpenEdit = useCallback((id: number) => {
    const producto = productos.find((p) => p.id === id)
    if (producto) {
      setEditingProducto(producto)
      setEditOpen(true)
    }
  }, [productos])

  const handleCrearProducto = useCallback(async (values: ProductoFormValues) => {
    const margen = values.precioVenta > 0
      ? ((values.precioVenta - values.costo) / values.precioVenta) * 100
      : 0

    const res = await fetch("/api/productos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, stock: 0, margen: parseFloat(margen.toFixed(2)) }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Error al crear producto")
      return
    }

    toast.success("Producto creado correctamente")
    setCreateOpen(false)
    fetchProductos()
  }, [fetchProductos])

  const handleEditarProducto = useCallback(async (values: ProductoFormValues) => {
    if (!editingProducto) return

    const margen = values.precioVenta > 0
      ? ((values.precioVenta - values.costo) / values.precioVenta) * 100
      : 0

    const res = await fetch(`/api/productos/${editingProducto.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        stock: editingProducto.stock, // stock no se modifica aquí
        margen: parseFloat(margen.toFixed(2)),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      toast.error(data.error || "Error al actualizar producto")
      return
    }

    toast.success("Producto actualizado correctamente")
    setEditOpen(false)
    setEditingProducto(null)
    fetchProductos()
  }, [editingProducto, fetchProductos])

  const columns = useMemo(
    () => createProductosColumns(handleToggleEstado, handleOpenEdit),
    [handleToggleEstado, handleOpenEdit]
  )

  // Opciones únicas para los filtros
  const categorias = useMemo(() =>
    [...new Set(productos.map((p) => p.categoria?.nombreCategoria).filter(Boolean))].sort(),
    [productos]
  )
  const marcas = useMemo(() =>
    [...new Set(productos.map((p) => p.marca).filter(Boolean))].sort(),
    [productos]
  )
  const tallas = useMemo(() =>
    [...new Set(productos.map((p) => p.talla).filter(Boolean))].sort(),
    [productos]
  )

  const filtered = useMemo(() =>
    productos
      .filter((p) => filterCategoria === "all" || p.categoria?.nombreCategoria === filterCategoria)
      .filter((p) => filterMarca === "all" || p.marca === filterMarca)
      .filter((p) => filterTalla === "all" || p.talla === filterTalla),
    [productos, filterCategoria, filterMarca, filterTalla]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuevo Producto</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-2">
              El stock inicial será 0. Añádelo mediante el módulo de Compras.
            </p>
            <ProductoForm
              onSubmit={handleCrearProducto}
              defaultValues={{
                idCategoriaProducto: undefined as unknown as number,
                nombreProducto: "",
                marca: "",
                talla: "",
                color: "",
                temporada: "TODO_EL_ANNO",
                precioVenta: 0,
                costo: 0,
                stockMinimo: 0,
                estado: "ACTIVO",
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterCategoria} onValueChange={setFilterCategoria}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c!}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterMarca} onValueChange={setFilterMarca}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {marcas.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterTalla} onValueChange={setFilterTalla}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Talla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las tallas</SelectItem>
            {tallas.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <DataTable searchKey="nombreProducto" columns={columns} data={filtered} />
      )}

      {/* Dialog editar — fuera del flujo normal para no rerenderizar la tabla */}
      <Dialog open={editOpen} onOpenChange={(open) => {
        setEditOpen(open)
        if (!open) setEditingProducto(null)
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            El stock actual es <strong>{editingProducto?.stock ?? 0}</strong> unidades y no se modifica aquí.
          </p>
          {editingProducto && (
            <ProductoForm
              key={editingProducto.id}
              onSubmit={handleEditarProducto}
              defaultValues={{
                idCategoriaProducto: editingProducto.idCategoriaProducto,
                nombreProducto: editingProducto.nombreProducto,
                marca: editingProducto.marca ?? "",
                talla: editingProducto.talla,
                color: editingProducto.color,
                temporada: editingProducto.temporada as ProductoFormValues["temporada"],
                precioVenta: Number(editingProducto.precioVenta),
                costo: Number(editingProducto.costo),
                stockMinimo: editingProducto.stockMinimo,
                estado: editingProducto.estado,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
