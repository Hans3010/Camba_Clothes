import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proveedorSchema } from "@/lib/validations/proveedor";

// GET: Obtener un solo proveedor para llenar el formulario al editar
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
    return NextResponse.json({ error: "Error al obtener proveedor" }, { status: 500 });
  }
}

// PUT: Actualizar el proveedor en la base de datos
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    
    // Validamos con tu esquema de proveedor.ts
    const validatedData = proveedorSchema.parse(body);

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id: Number(id) },
      data: validatedData,
    });

    return NextResponse.json(proveedorActualizado);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 });
  }
}