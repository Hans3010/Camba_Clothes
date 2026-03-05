import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const movimientos = await prisma.movimientoInventario.findMany({
      include: {
        producto: { select: { id: true, nombreProducto: true, talla: true, color: true } },
        usuario: { select: { id: true, usuario: true } },
      },
      orderBy: { fecha: "desc" },
      take: 200,
    })
    return NextResponse.json(movimientos)
  } catch {
    return NextResponse.json({ error: "Error al obtener movimientos" }, { status: 500 })
  }
}
