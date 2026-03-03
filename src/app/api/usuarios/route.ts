import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { usuarioCreateSchema } from '@/lib/validations/usuario'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.rol !== 'ADMIN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  try {
    const usuarios = await prisma.usuario.findMany({
      include: { tipoUsuario: true },
      orderBy: { id: 'desc' },
    })
    const safe = usuarios.map(({ password, ...rest }) => rest)
    return NextResponse.json(safe)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  if (session.user.rol !== 'ADMIN') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  try {
    const body = await req.json()
    const result = usuarioCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const existe = await prisma.usuario.findFirst({
      where: { usuario: result.data.usuario },
    })
    if (existe) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(result.data.password, 10)
    const usuario = await prisma.usuario.create({
      data: {
        ...result.data,
        password: hashedPassword,
      },
    })

    const { password, ...safe } = usuario
    return NextResponse.json(safe, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
  }
}