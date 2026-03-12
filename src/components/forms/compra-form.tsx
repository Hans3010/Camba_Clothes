"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { compraSchema, CompraFormValues } from "@/lib/validations/compra";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function CompraForm({ proveedores, productos }: { proveedores: any[], productos: any[] }) {
  const form = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema),
    defaultValues: {
      idUsuario: 1,
      idProveedor: 0,
      productoId: undefined,
      nombreProducto: "",
      cantidad: 1,
      precioUnitario: 0,
      fecha: "",
      numeroDocumento: "",
      tipoDocumento: "",
      subtotal: 0,
      descuento: 0,
      total: 0,
      estado: "ACTIVO",
    },
  });

  const onSubmit: SubmitHandler<CompraFormValues> = async (values) => {
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Error al registrar compra");

      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        {/* Proveedor */}
        <div>
          <label className="block text-sm font-medium">Proveedor</label>
          <Select onValueChange={(val) => form.setValue("idProveedor", Number(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona proveedor" />
            </SelectTrigger>
            <SelectContent>
              {proveedores.map((p) => (
                <SelectItem key={p.id} value={p.id.toString()}>
                  {p.nombreEmpresa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Producto */}
        <div>
          <label className="block text-sm font-medium">Producto</label>
          <Select onValueChange={(val) => form.setValue("productoId", Number(val))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona producto" />
            </SelectTrigger>
            <SelectContent>
              {productos.map((prod) => (
                <SelectItem key={prod.id} value={prod.id.toString()}>
                  {prod.nombre}
                </SelectItem>
              ))}
              <SelectItem value="nuevo">+ Crear nuevo producto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Nombre producto si es nuevo */}
        {form.watch("productoId") === undefined && (
          <div className="col-span-2">
            <label className="block text-sm font-medium">Nombre producto</label>
            <Input {...form.register("nombreProducto")} />
          </div>
        )}

        {/* Cantidad */}
        <div>
          <label className="block text-sm font-medium">Cantidad</label>
          <Input type="number" {...form.register("cantidad")} />
        </div>

        {/* Precio unitario */}
        <div>
          <label className="block text-sm font-medium">Precio unitario</label>
          <Input type="number" {...form.register("precioUnitario")} />
        </div>

        {/* Fecha */}
        <div>
          <label className="block text-sm font-medium">Fecha</label>
          <div className="flex gap-2">
            <Input type="date" {...form.register("fecha")} />
            <Input
              type="text"
              value={form.watch("fecha")}
              readOnly
              className="bg-gray-100"
            />
          </div>
        </div>

        {/* Subtotal */}
        <div>
          <label className="block text-sm font-medium">Subtotal</label>
          <Input type="number" {...form.register("subtotal")} />
        </div>

        {/* Descuento */}
        <div>
          <label className="block text-sm font-medium">Descuento</label>
          <Input type="number" {...form.register("descuento")} />
        </div>

        {/* Total */}
        <div>
          <label className="block text-sm font-medium">Total</label>
          <Input type="number" {...form.register("total")} />
        </div>
      </div>

      <Button type="submit" className="w-full">Registrar compra</Button>
    </form>
  );
}