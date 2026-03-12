"use client";

import { useState, useEffect } from "react";
import { ProveedorForm } from "@/components/forms/proveedor-form";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/tables/proveedores-columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function ProveedoresPage() {
  const [data, setData] = useState([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProveedores = async () => {
    try {
      const res = await fetch("/api/proveedores");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    try {
      const res = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Eliminado");
      fetchProveedores();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  useEffect(() => { fetchProveedores(); }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
        {editingId && (
          <Button variant="outline" onClick={() => setEditingId(null)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProveedorForm 
            initialId={editingId} 
            onSuccess={() => { fetchProveedores(); setEditingId(null); }} 
          />
        </div>
        <div className="lg:col-span-2">
          <DataTable 
            searchKey="nombreEmpresa" 
            columns={columns(setEditingId, onDelete)} 
            data={data} 
          />
        </div>
      </div>
    </div>
  );
}