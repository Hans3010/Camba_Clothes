import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const producto = await prisma.producto.findUnique({
      where: { id: Number(id) },
      include: { categoria: true }, // 👈 relación correcta
    });
    if (!producto) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    return NextResponse.json(producto);
  } catch {
    return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json();
    const actualizado = await prisma.producto.update({
      where: { id: Number(id) },
      data: {
        idCategoriaProducto: body.idCategoriaProducto,
        nombreProducto: body.nombreProducto,
        marca: body.marca,
        talla: body.talla,
        color: body.color,
        temporada: body.temporada,
        precioVenta: body.precioVenta,
        costo: body.costo,
        margen: body.margen,
        stock: body.stock,
        stockMinimo: body.stockMinimo,
        estado: body.estado,
      },
    });
    return NextResponse.json(actualizado);
  } catch {
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.producto.delete({
      where: { id: Number(id) },
    });
    return NextResponse.json({ message: "Producto eliminado" });
  } catch {
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
