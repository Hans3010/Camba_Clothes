import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const ajusteSchema = z.object({
  idProducto: z.number().int().positive(),
  cantidad: z.number().int().refine((v) => v !== 0, { message: "La cantidad no puede ser 0" }),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres"),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN")
    return NextResponse.json({ error: "Solo el administrador puede realizar ajustes" }, { status: 403 })

  try {
    const body = await req.json()
    const result = ajusteSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { idProducto, cantidad, motivo } = result.data

    // Validate product exists
    const producto = await prisma.producto.findUnique({ where: { id: idProducto } })
    if (!producto) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    // Prevent negative stock
    const nuevoStock = producto.stock + cantidad
    if (nuevoStock < 0) {
      return NextResponse.json(
        { error: `Stock insuficiente. Stock actual: ${producto.stock}, ajuste solicitado: ${cantidad}` },
        { status: 400 }
      )
    }

    await prisma.$transaction([
      prisma.producto.update({
        where: { id: idProducto },
        data: { stock: { increment: cantidad } },
      }),
      prisma.movimientoInventario.create({
        data: {
          idProducto,
          idUsuario: session.user.id,
          tipo: "AJUSTE",
          origen: "AJUSTE_MANUAL",
          cantidad,
          descripcion: motivo,
        },
      }),
    ])

    return NextResponse.json(
      { message: "Ajuste realizado correctamente", nuevoStock },
      { status: 200 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al realizar el ajuste" }, { status: 500 })
  }
}
