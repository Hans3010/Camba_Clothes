"use client";

import { useEffect, useState } from "react";
import CompraForm from "@/components/forms/compra-form";
import ProductoForm from "@/components/forms/producto-form";

export default function ComprasPage() {
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const resProv = await fetch("/api/proveedores");
      const resProd = await fetch("/api/productos");
      setProveedores(await resProv.json());
      setProductos(await resProd.json());
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Registrar Compra</h1>
      <CompraForm proveedores={proveedores} productos={productos} />

      <h2 className="text-xl font-semibold">Registrar Producto</h2>
      <ProductoForm
        onSubmit={async (values) => {
          const res = await fetch("/api/productos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
          });
          if (res.ok) {
            const nuevo = await res.json();
            setProductos((prev) => [...prev, nuevo]);
          }
        }}
      />
    </div>
  );
}