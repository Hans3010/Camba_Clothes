"use client";

import { useState, useEffect } from "react";
import { ProveedorForm } from "@/components/forms/proveedor-form";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/tables/proveedores-columns";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ProveedoresPage() {
  const [data, setData] = useState([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProveedores = async () => {
    try {
      const res = await fetch("/api/proveedores");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error al cargar proveedores:", error);
    }
  };

  useEffect(() => { 
    fetchProveedores(); 
  }, []);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Módulo de Proveedores</h1>
        {editingId && (
          <Button variant="outline" onClick={() => setEditingId(null)}>
            <Plus className="mr-2 h-4 w-4" /> Registrar Nuevo
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          {/* El formulario recibe el ID para saber si edita o crea */}
          <ProveedorForm 
            initialId={editingId} 
            onSuccess={() => {
              fetchProveedores();
              setEditingId(null);
            }} 
          />
        </div>
        <div className="lg:col-span-2">
          <DataTable 
            searchKey="nombreEmpresa" // Sincronizado con tu esquema
            columns={columns(setEditingId)} 
            data={data} 
          />
        </div>
      </div>
    </div>
  );
}