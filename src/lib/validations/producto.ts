import { z } from "zod";

export const productoSchema = z.object({
  idCategoriaProducto: z.number().int(), // categoría como número entero
  nombreProducto: z.string().min(1, "El nombre es obligatorio"),
  marca: z.string().optional(),
  talla: z.string().min(1, "La talla es obligatoria"),
  color: z.string().min(1, "El color es obligatorio"),
  temporada: z.enum(["Primavera", "Verano", "Otoño", "Invierno", "TODO_EL_ANNO"]),
  precioVenta: z.number().min(0, "Debe ser mayor o igual a 0"),
  costo: z.number().min(0, "Debe ser mayor o igual a 0"),
  stockMinimo: z.number().min(0, "Debe ser mayor o igual a 0"),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type ProductoFormValues = z.infer<typeof productoSchema>;