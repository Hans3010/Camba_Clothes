import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const numId = Number(id);
    const body = await req.json();

    const result = proveedorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Datos inválidos", details: result.error.flatten() }, { status: 400 });
    }

    const existe = await prisma.proveedor.findFirst({
      where: {
        nombreEmpresa: { equals: result.data.nombreEmpresa, mode: "insensitive" },
        NOT: { id: numId },
      },
    });
    if (existe) {
      return NextResponse.json({ error: "Ya existe un proveedor con ese nombre de empresa" }, { status: 400 });
    }

    const proveedorActualizado = await prisma.proveedor.update({
      where: { id: numId },
      data: result.data,
    });

    return NextResponse.json(proveedorActualizado);
  } catch (error) {
    return NextResponse.json({ error: "Error al actualizar proveedor" }, { status: 500 });
  }
}
