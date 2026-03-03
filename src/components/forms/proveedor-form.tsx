"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { proveedorSchema, ProveedorFormValues } from "@/lib/validations/proveedor";

interface ProveedorFormProps {
  initialData?: ProveedorFormValues & { id: number };
}

export const ProveedorForm = ({ initialData }: ProveedorFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues: initialData || {
      nombreEmpresa: "",
      representante: "",
      telefono: "",
      correo: "",
      ubicacion: "",
    },
  });

  const onSubmit = async (values: ProveedorFormValues) => {
    try {
      setLoading(true);
      const url = initialData 
        ? `/api/proveedores/${initialData.id}` 
        : "/api/proveedores";
      
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Error en la petición");

      toast.success(initialData ? "Proveedor actualizado" : "Proveedor creado");
      router.refresh();
      router.push("/proveedores");
    } catch {
      toast.error("Algo salió mal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombreEmpresa"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la Empresa</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Ej: Textiles Santa Cruz" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="representante"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Representante</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="Nombre del contacto" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input disabled={loading} placeholder="70000000" {...field} />
                </FormControl>
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
                <FormControl>
                  <Input disabled={loading} type="email" placeholder="proveedor@mail.com" {...field} />
                </FormControl>
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
              <FormLabel>Ubicación</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="Dirección detallada" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={loading} className="ml-auto" type="submit">
          {initialData ? "Guardar cambios" : "Registrar Proveedor"}
        </Button>
      </form>
    </Form>
  );
};