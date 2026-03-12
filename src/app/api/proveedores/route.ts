import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { proveedorSchema } from "@/lib/validations/proveedor";

// GET: Listar todos los proveedores
export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      orderBy: { id: "desc" }, // Los más nuevos primero
    });
    return NextResponse.json(proveedores);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener la lista de proveedores" }, 
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo proveedor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validamos los datos con Zod antes de tocar la base de datos
    const validatedData = proveedorSchema.parse(body);

    const nuevoProveedor = await prisma.proveedor.create({
      data: validatedData,
    });

    return NextResponse.json(nuevoProveedor, { status: 201 });
  } catch (error) {
    console.error("Error en POST proveedores:", error);
    return NextResponse.json(
      { error: "Error al crear el proveedor. Verifique los datos." }, 
      { status: 400 }
    );
  }
}