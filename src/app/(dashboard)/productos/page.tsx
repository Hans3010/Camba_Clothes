"use client";

import { useEffect, useState } from "react";

interface Producto {
  id: number
  nombreProducto: string
  precioVenta: number | string
  categoria?: { nombreCategoria: string } | null
}

export default function ProductosPage() {
  const [productos, setProductos] = useState<Producto[]>([]);

  useEffect(() => {
    fetch("/api/productos")
      .then((res) => res.json())
      .then((data) => {
        // 👈 validar que la respuesta sea un array
        if (Array.isArray(data)) {
          setProductos(data);
        } else {
          console.error("Respuesta inesperada de la API:", data);
          setProductos([]); // evitar romper el .map()
        }
      })
      .catch((err) => {
        console.error("Error al cargar productos:", err);
        setProductos([]);
      });
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Lista de productos</h1>

      {productos.length === 0 ? (
        <p className="text-gray-500">No hay productos disponibles</p>
      ) : (
        <ul className="space-y-2">
          {productos.map((p) => (
            <li key={p.id} className="border p-2 rounded">
              <p className="font-semibold">{p.nombreProducto}</p>
              <p>Precio: {p.precioVenta} Bs.</p>
              <p>Categoría: {p.categoria?.nombreCategoria ?? "Sin categoría"}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
