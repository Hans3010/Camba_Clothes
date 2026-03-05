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
  const [dialogOpen, setDialogOpen] = useState(false)

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
    setDialogOpen(false)
    fetchProductos()
  }, [fetchProductos])

  const columns = useMemo(() => createProductosColumns(handleToggleEstado), [handleToggleEstado])

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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
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
    </div>
  )
}
