import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compraSchema } from "@/lib/validations/compra";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const compra = await prisma.compra.findUnique({
      where: { id: Number(id) },
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

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validated = compraSchema.parse(body);

    const compra = await prisma.compra.update({
      where: { id: Number(id) },
      data: {
        idProveedor: validated.idProveedor,
        numeroDocumento: validated.numeroDocumento,
        tipoDocumento: validated.tipoDocumento,
        descuento: validated.descuento,
      },
    });

    return NextResponse.json(compra);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al actualizar compra" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.compra.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Compra eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Error al eliminar compra" }, { status: 500 });
  }
}
