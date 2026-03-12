import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compraSchema } from "@/lib/validations/compra";

// Obtener una compra por ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const compra = await prisma.compra.findUnique({
      where: { id: Number(params.id) },
      include: { proveedor: true, usuario: true },
    });

    if (!compra) {
      return NextResponse.json({ error: "Compra no encontrada" }, { status: 404 });
    }

    return NextResponse.json(compra);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al obtener compra" }, { status: 500 });
  }
}

// Actualizar una compra por ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const validated = compraSchema.parse(body);

    const compra = await prisma.compra.update({
      where: { id: Number(params.id) },
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

    return NextResponse.json(compra);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar compra" }, { status: 500 });
  }
}

// Eliminar una compra por ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.compra.delete({
      where: { id: Number(params.id) },
    });

    return NextResponse.json({ message: "Compra eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar compra" }, { status: 500 });
  }
}