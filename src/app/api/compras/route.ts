import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { compraSchema } from "@/lib/validations/compra"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const compras = await prisma.compra.findMany({
      include: {
        proveedor: { select: { nombreEmpresa: true } },
        usuario: { select: { usuario: true } },
        detalles: {
          include: { producto: { select: { nombreProducto: true } } },
        },
      },
      orderBy: { fecha: "desc" },
    })
    return NextResponse.json(compras)
  } catch {
    return NextResponse.json({ error: "Error al obtener compras" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await req.json()
    const result = compraSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
    }

    const { idProveedor, numeroDocumento, tipoDocumento, descuento, items } = result.data

    // Calcular totales
    const subtotal = items.reduce((acc, item) => acc + item.precioCompra * item.cantidad, 0)
    const total = subtotal - (descuento ?? 0)

    const compra = await prisma.$transaction(async (tx) => {
      // 1. Crear la cabecera de la compra
      const nuevaCompra = await tx.compra.create({
        data: {
          idUsuario: session.user.id,
          idProveedor,
          numeroDocumento: numeroDocumento ?? null,
          tipoDocumento: tipoDocumento ?? null,
          subtotal,
          descuento: descuento ?? 0,
          total,
        },
      })

      // 2. Por cada item: detalle + stock + movimiento
      for (const item of items) {
        const subtotalItem = item.precioCompra * item.cantidad

        await tx.detalleCompra.create({
          data: {
            idCompra: nuevaCompra.id,
            idProducto: item.idProducto,
            cantidad: item.cantidad,
            precioCompra: item.precioCompra,
            subtotal: subtotalItem,
          },
        })

        await tx.producto.update({
          where: { id: item.idProducto },
          data: {
            stock: { increment: item.cantidad },
            costo: item.precioCompra,
          },
        })

        await tx.movimientoInventario.create({
          data: {
            idProducto: item.idProducto,
            idUsuario: session.user.id,
            tipo: "ENTRADA",
            origen: "COMPRA",
            cantidad: item.cantidad,
            descripcion: `Compra #${nuevaCompra.id} — Proveedor ID ${idProveedor}`,
          },
        })
      }

      return nuevaCompra
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Error al registrar compra" }, { status: 500 })
  }
}
