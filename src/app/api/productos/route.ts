import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      include: { categoria: true },
      orderBy: { id: "desc" },
    });
    return NextResponse.json(productos);
  } catch {
    return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nuevo = await prisma.producto.create({
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
    return NextResponse.json(nuevo, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}
