"use client";
import React, { useState, useEffect } from "react";

interface Categoria {
  id: number;
  nombreCategoria: string;
  descripcion: string;
}

export default function CategoriasTab() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nombre: "", descripcion: "" });

  // 🔹 Cargar categorías al inicio
  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(data));
  }, []);

  const openNewDialog = () => {
    setEditId(null);
    setFormData({ nombre: "", descripcion: "" });
    setShowDialog(true);
  };

  const openEditDialog = (cat: Categoria) => {
    setEditId(cat.id);
    setFormData({ nombre: cat.nombreCategoria, descripcion: cat.descripcion });
    setShowDialog(true);
  };

  const handleSave = async () => {
    const payload = {
      nombreCategoria: formData.nombre,
      descripcion: formData.descripcion,
    };

    let res;
    if (editId) {
      res = await fetch(`/api/categorias/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      const lista = await fetch("/api/categorias").then((r) => r.json());
      setCategorias(lista);
      setShowDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={openNewDialog}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Nueva Categoría
      </button>

      <table className="w-full border border-gray-300 mt-4">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Nombre</th>
            <th className="px-4 py-2 text-left">Descripción</th>
            <th className="px-4 py-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categorias.map((cat) => (
            <tr key={cat.id} className="border-t">
              <td className="px-4 py-2">{cat.nombreCategoria}</td>
              <td className="px-4 py-2">{cat.descripcion}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => openEditDialog(cat)}
                  className="text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showDialog && (
        <div className="fixed top-1/3 left-1/3 bg-white border border-gray-300 p-6 rounded shadow-lg">
          <h3 className="text-lg font-bold mb-4">
            {editId ? "Editar Categoría" : "Nueva Categoría"}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Descripción</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowDialog(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
