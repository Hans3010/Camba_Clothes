import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { usuarioCreateSchema } from '@/lib/validations/usuario';

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      include: { tipoUsuario: true },
      orderBy: { id: 'desc' },
    });
    // Quitamos el password antes de enviar al frontend por seguridad
    const safe = usuarios.map(({ password, ...rest }) => rest);
    return NextResponse.json(safe);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = usuarioCreateSchema.parse(body);

    const existe = await prisma.usuario.findFirst({
      where: { usuario: validated.usuario },
    });
    
    if (existe) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(validated.password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        ...validated,
        password: hashedPassword,
      },
    });

    const { password, ...safe } = usuario;
    return NextResponse.json(safe, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 });
  }
}