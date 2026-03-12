import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compraSchema } from "@/lib/validations/compra";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = compraSchema.parse(body);

    let producto;

    if (validated.productoId) {
      // Buscar producto existente
      const productoExistente = await prisma.producto.findUnique({
        where: { id: validated.productoId },
      });

      producto = await prisma.producto.update({
        where: { id: validated.productoId },
        data: {
          stock: (productoExistente?.stock ?? 0) + validated.cantidad,
          precioVenta: validated.precioUnitario, // usamos el campo correcto
        },
      });
    } else {
      // Crear producto nuevo con los atributos de tu tabla
      producto = await prisma.producto.create({
        data: {
          idCategoriaProducto: 1, // puedes ajustar según tu lógica
          nombreProducto: validated.nombreProducto!,
          precioVenta: validated.precioUnitario,
          marca: "GENERICA", // puedes capturarlo en el form si quieres
          talla: "N/A",
          color: "N/A",
          // 👇 temporada debe ser un valor válido del enum o undefined
          temporada: undefined, 
          costo: validated.precioUnitario,
          margen: 0,
          stock: validated.cantidad,
          stockMinimo: 1,
          estado: "ACTIVO", // este sí es válido en tu enum EstadoGeneral
        },
      });
    }

    // Crear compra (sin productoId porque tu modelo Compra no lo tiene)
    const compra = await prisma.compra.create({
      data: {
        idUsuario: validated.idUsuario,
        idProveedor: validated.idProveedor,
        fecha: validated.fecha,
        numeroDocumento: validated.numeroDocumento,
        tipoDocumento: validated.tipoDocumento,
        subtotal: validated.subtotal,
        descuento: validated.descuento,
        total: validated.total,
        estado: validated.estado,
      },
    });

    return NextResponse.json({ compra, producto }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al crear compra" }, { status: 500 });
  }
}