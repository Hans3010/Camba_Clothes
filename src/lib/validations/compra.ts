import { z } from "zod";

export const compraSchema = z.object({
  idUsuario: z.coerce.number().int().positive().transform(Number),
  idProveedor: z.coerce.number().int().positive().transform(Number),
  productoId: z.coerce.number().optional(), // si ya existe
  nombreProducto: z.string().min(1).optional(), // si es nuevo
  cantidad: z.coerce.number().min(1).transform(Number),
  precioUnitario: z.coerce.number().min(0).transform(Number),
  fecha: z.string().min(1),
  numeroDocumento: z.string().min(1),
  tipoDocumento: z.string().min(1),
  subtotal: z.coerce.number().min(0).transform(Number),
  descuento: z.coerce.number().min(0).transform(Number),
  total: z.coerce.number().positive().transform(Number),
  estado: z.enum(["ACTIVO", "INACTIVO"]),
});

export type CompraFormValues = z.infer<typeof compraSchema>;