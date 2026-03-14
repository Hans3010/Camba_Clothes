import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proveedorSchema } from "@/lib/validations/proveedor";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(id) },
    });

    if (!proveedor) {
      return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 });
    }

    return NextResponse.json(proveedor);
  } catch (error) {
    return NextResponse.json({ error: "Error al buscar proveedor" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const validatedData = proveedorSchema.parse(body);

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: validatedData,
    });

    return NextResponse.json(proveedorActualizado);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al actualizar el proveedor" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.proveedor.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: "Proveedor eliminado con éxito" });
  } catch (error) {
    return NextResponse.json(
      { error: "No se puede eliminar. El proveedor tiene registros asociados." }, 
      { status: 400 }
    );
  }
}