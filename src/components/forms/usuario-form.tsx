"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usuarioCreateSchema, UsuarioCreateValues } from "@/lib/validations/usuario";

interface UsuarioFormProps {
  onSuccess?: () => void;
}

export const UsuarioForm = ({ onSuccess }: UsuarioFormProps) => {
  const [loading, setLoading] = useState(false);

  // El tipado <UsuarioCreateValues> aquí es lo que quita el error en 'control'
  const form = useForm<UsuarioCreateValues>({
    resolver: zodResolver(usuarioCreateSchema),
    defaultValues: {
      usuario: "",
      password: "",
      idTipoUsuario: 2, // 2 es Vendedor por defecto
      estado: "ACTIVO",
    },
  });

  const onSubmit = async (values: UsuarioCreateValues) => {
    try {
      setLoading(true);
      const response = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear el usuario");
      }

      toast.success("Usuario registrado con éxito");
      form.reset(); // Limpia el formulario
      
      if (onSuccess) {
        onSuccess(); // Refresca la tabla automáticamente
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-xl bg-white shadow-sm">
        <FormField
          control={form.control}
          name="usuario"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Nombre de Usuario</FormLabel>
              <FormControl>
                <Input disabled={loading} placeholder="ej. jairo_admin" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold">Contraseña</FormLabel>
              <FormControl>
                <Input 
                  disabled={loading} 
                  type="password" 
                  placeholder="Mínimo 6 caracteres" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="idTipoUsuario"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Rol de Usuario</FormLabel>
                <Select 
                  disabled={loading} 
                  onValueChange={(value) => field.onChange(Number(value))} 
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">Administrador</SelectItem>
                    <SelectItem value="2">Vendedor</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold">Estado</FormLabel>
                <Select 
                  disabled={loading} 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ACTIVO">Activo</SelectItem>
                    <SelectItem value="INACTIVO">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button disabled={loading} className="w-full mt-2" type="submit">
          {loading ? "Registrando..." : "Registrar Nuevo Usuario"}
        </Button>
      </form>
    </Form>
  );
};