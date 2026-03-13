"use client";

import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, ProductoFormValues } from "@/lib/validations/producto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";

const TEMPORADAS: { value: ProductoFormValues["temporada"]; label: string }[] = [
  { value: "PRIMAVERA",    label: "Primavera" },
  { value: "VERANO",       label: "Verano" },
  { value: "OTONO",        label: "Otoño" },
  { value: "INVIERNO",     label: "Invierno" },
  { value: "TODO_EL_ANNO", label: "Todo el año" },
]

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="idCategoriaProducto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoría</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(Number(val))}
                    value={field.value ? String(field.value) : undefined}
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
          </div>
          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
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

        <FormField
          control={form.control}
          name="nombreProducto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del producto</FormLabel>
              <Input placeholder="Ej: Camisa Oxford Slim Fit" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="marca"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <Input placeholder="Ej: Zara" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="temporada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temporada</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona temporada" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPORADAS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="talla"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Talla</FormLabel>
                <Input placeholder="Ej: M, L, XL, 38" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                <Input placeholder="Ej: Blanco" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="precioVenta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Precio venta (Bs.)</FormLabel>
                <Input
                  type="number"
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                />
                <FormMessage />
              </FormItem>
            )}
          />
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
        </div>

        {defaultValues?.stock !== undefined && (
          <div className="flex gap-6 text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2">
            <span>Stock actual: <strong className="text-foreground">{defaultValues.stock}</strong></span>
            {defaultValues.margen !== undefined && (
              <span>Margen actual: <strong className="text-foreground">{Number(defaultValues.margen).toFixed(1)}%</strong></span>
            )}
          </div>
        )}

        <Button type="submit" className="w-full">Guardar</Button>
      </form>
    </Form>
  );
}
