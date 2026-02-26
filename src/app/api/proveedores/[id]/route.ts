import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener un solo proveedor
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(params.id) },
    });
    return NextResponse.json(proveedor);
  } catch (error) {
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 });
  }
}

// PUT: Actualizar un proveedor
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const proveedor = await prisma.proveedor.update({
      where: { id: Number(params.id) },
      data: body,
    });
    return NextResponse.json(proveedor);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}