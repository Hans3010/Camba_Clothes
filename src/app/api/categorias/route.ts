import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { categoriaSchema } from '@/lib/validations/categoria';

export async function GET() {
  try {
    const categorias = await prisma.categoriaProducto.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(categorias);
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = categoriaSchema.parse(body);
    const categoria = await prisma.categoriaProducto.create({
      data: validated,
    });
    return NextResponse.json(categoria, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 },
    );
  }
}