import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { proveedorSchema } from "@/lib/validations/proveedor";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const proveedores = await prisma.proveedor.findMany({
      orderBy: { nombreEmpresa: "asc" },
    });
    
    return NextResponse.json(proveedores);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al obtener los proveedores" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const result = proveedorSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const newProveedor = await prisma.proveedor.create({
      data: {
        nombreEmpresa: result.data.nombreEmpresa,
        representante: result.data.representante,
        telefono: result.data.telefono,
        correo: result.data.correo || null,
        ubicacion: result.data.ubicacion || null,
      },
    });

    return NextResponse.json(newProveedor, { status: 201 });
  } catch (error) {
    console.error("Error al crear proveedor:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al crear el proveedor" },
      { status: 500 }
    );
  }
}
