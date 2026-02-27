"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, ProductoFormValues } from "@/lib/validations/producto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface ProductoFormProps {
  defaultValues?: ProductoFormValues & { stock?: number; margen?: number };
  onSubmit: SubmitHandler<ProductoFormValues>;
}

export default function ProductoForm({ defaultValues, onSubmit }: ProductoFormProps) {
  const form = useForm<ProductoFormValues>({
    resolver: zodResolver(productoSchema),
    defaultValues,
  });

  const [categorias, setCategorias] = useState<{ id: number; nombreCategoria: string }[]>([]);

  useEffect(() => {
    fetch("/api/categorias")
      .then((res) => res.json())
      .then((data) => setCategorias(Array.isArray(data) ? data : []));
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Categoría */}
        <FormField
          control={form.control}   // ✅ correcto
          name="idCategoriaProducto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select
                onValueChange={(val) => field.onChange(Number(val))}
                defaultValue={field.value ? String(field.value) : undefined}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.nombreCategoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Nombre */}
        <FormField
          control={form.control}
          name="nombreProducto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre</FormLabel>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Marca */}
        <FormField
          control={form.control}
          name="marca"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Marca</FormLabel>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Talla */}
        <FormField
          control={form.control}
          name="talla"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Talla</FormLabel>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color */}
        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color</FormLabel>
              <Input {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Temporada */}
        <FormField
          control={form.control}
          name="temporada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temporada</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona temporada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primavera">Primavera</SelectItem>
                  <SelectItem value="Verano">Verano</SelectItem>
                  <SelectItem value="Otoño">Otoño</SelectItem>
                  <SelectItem value="Invierno">Invierno</SelectItem>
                  <SelectItem value="TODO_EL_ANNO">Todo el año</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Precio */}
        <FormField
          control={form.control}
          name="precioVenta"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio Venta (Bs.)</FormLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Costo */}
        <FormField
          control={form.control}
          name="costo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo (Bs.)</FormLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stock mínimo */}
        <FormField
          control={form.control}
          name="stockMinimo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock mínimo</FormLabel>
              <Input
                type="number"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Estado */}
        <FormField
          control={form.control}
          name="estado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVO">ACTIVO</SelectItem>
                  <SelectItem value="INACTIVO">INACTIVO</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Stock y margen informativos */}
        {defaultValues && (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <p>Stock actual: {defaultValues.stock}</p>
            <p>Margen: {defaultValues.margen}%</p>
          </div>
        )}

        <Button type="submit">Guardar</Button>
      </form>
    </Form>
  );
}

