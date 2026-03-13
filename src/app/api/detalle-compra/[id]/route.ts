import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const detalleCompraSchema = z.object({
  idCompra: z.coerce.number().int().positive("Selecciona una compra"),
  idProducto: z.coerce.number().int().positive("Selecciona un producto"),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  precioCompra: z.coerce.number().positive("El precio debe ser mayor a 0"),
  subtotal: z.coerce.number().positive("El subtotal debe ser mayor a 0"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const detalle = await prisma.detalleCompra.findUnique({
      where: { id: Number(params.id) },
      include: { producto: true, compra: true },
    });

    if (!detalle) {
      return NextResponse.json({ error: "Detalle no encontrado" }, { status: 404 });
    }

    return NextResponse.json(detalle);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener detalle" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = detalleCompraSchema.parse(body);

    const detalle = await prisma.detalleCompra.update({
      where: { id: Number(params.id) },
      data: {
        idCompra: validated.idCompra,
        idProducto: validated.idProducto,
        cantidad: validated.cantidad,
        precioCompra: validated.precioCompra,
        subtotal: validated.subtotal,
      },
    });

    return NextResponse.json(detalle);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar detalle" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.detalleCompra.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: "Detalle eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar detalle" }, { status: 500 });
  }
}