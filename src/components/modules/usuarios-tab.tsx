"use client";

import { useEffect, useState } from "react";
import { UsuarioForm } from "@/components/forms/usuario-form";
import { DataTable } from "@/components/ui/data-table";
import { columns, UsuarioColumn } from "@/components/tables/usuarios-columns";
import { Separator } from "@/components/ui/separator";

export const UsuariosTab = () => {
  const [data, setData] = useState<UsuarioColumn[]>([]);

  // Función para traer usuarios de la API
  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const usuarios = await res.json();
      
      const formatted = usuarios.map((u: any) => ({
        id: u.id,
        usuario: u.usuario,
        rol: u.tipoUsuario?.rol || "N/A",
        estado: u.estado,
      }));
      setData(formatted);
    } catch (error) {
      console.error("Error al cargar usuarios", error);
    }
  };

  // Cargar al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Izquierdo: Formulario */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-medium">Nuevo Usuario</h3>
          <UsuarioForm onSuccess={fetchUsuarios} /> 
        </div>

        {/* Lado Derecho: Tabla */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium">Usuarios Registrados</h3>
          <DataTable searchKey="usuario" columns={columns} data={data} />
        </div>
      </div>
    </div>
  );
};