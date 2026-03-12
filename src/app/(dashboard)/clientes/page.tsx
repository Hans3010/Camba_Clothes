"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { toast } from "sonner"
import { DataTable } from "@/components/ui/data-table"
import { ClienteForm } from "@/components/forms/cliente-form"
import { createClientesColumns, ClienteRow } from "@/components/tables/clientes-columns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editOpen, setEditOpen] = useState(false)

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

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

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

      {loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">Cargando clientes...</p>
      ) : (
        <DataTable
          searchKey="nombreCompleto"
          columns={columns}
          data={clientes}
        />
      )}

      {/* Dialog: Crear cliente */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Cliente</DialogTitle>
          </DialogHeader>
          <ClienteForm
            onSuccess={() => {
              setCreateOpen(false)
              fetchClientes()
            }}
            onCancel={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar cliente */}
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
