"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { proveedorSchema, ProveedorFormValues } from "@/lib/validations/proveedor";

interface ProveedorFormProps {
  initialId?: number | null;
  onSuccess?: () => void;
}

export const ProveedorForm = ({ initialId, onSuccess }: ProveedorFormProps) => {
  const [loading, setLoading] = useState(false);

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: { 
      nombreEmpresa: "", 
      representante: "", 
      telefono: "", 
      correo: "",
      ubicacion: "" 
    },
  });

  useEffect(() => {
    if (initialId) {
      const fetchProveedor = async () => {
        try {
          const res = await fetch(`/api/proveedores/${initialId}`);
          const data = await res.json();
          // Sincronizamos los datos que vienen de la API con tu esquema
          form.reset({
            nombreEmpresa: data.nombreEmpresa || "",
            representante: data.representante || "",
            telefono: data.telefono || "",
            correo: data.correo || "",
            ubicacion: data.ubicacion || "",
          });
        } catch (error) {
          toast.error("Error al cargar proveedor");
        }
      };
      fetchProveedor();
    } else {
      form.reset({ nombreEmpresa: "", representante: "", telefono: "", correo: "", ubicacion: "" });
    }
  }, [initialId, form]);

  const onSubmit = async (values: ProveedorFormValues) => {
    try {
      setLoading(true);
      const url = initialId ? `/api/proveedores/${initialId}` : "/api/proveedores";
      const method = initialId ? "PUT" : "POST";

      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error en la operación");

      toast.success(initialId ? "Actualizado correctamente" : "Registrado correctamente");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error en la operación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 border p-4 rounded-xl shadow-sm bg-card">
        <h3 className="font-bold text-lg">{initialId ? "Editar Proveedor" : "Nuevo Proveedor"}</h3>
        
        <FormField
          control={form.control}
          name="nombreEmpresa" // Coincide con tu esquema
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Empresa</FormLabel>
              <FormControl><Input disabled={loading} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="representante" // Coincide con tu esquema
          render={({ field }) => (
            <FormItem>
              <FormLabel>Representante</FormLabel>
              <FormControl><Input disabled={loading} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl><Input disabled={loading} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="correo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo (Opcional)</FormLabel>
                <FormControl><Input disabled={loading} type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="ubicacion"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ubicación / Dirección</FormLabel>
              <FormControl><Input disabled={loading} {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={loading} className="w-full" type="submit">
          {initialId ? "Guardar Cambios" : "Registrar Proveedor"}
        </Button>
      </form>
    </Form>
  );
};