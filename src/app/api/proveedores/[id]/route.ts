import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Obtener un solo proveedor
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proveedor = await prisma.proveedor.findUnique({
      where: { id: Number(id) },
    });
    return NextResponse.json(proveedor);
  } catch {
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 });
  }
}

// PUT: Actualizar un proveedor
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json();
    const proveedor = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: body,
    });
    return NextResponse.json(proveedor);
  } catch {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}