import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { crearVentaSchema } from "@/lib/validations/venta"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const ventas = await prisma.venta.findMany({
    include: {
      cliente: true,
      usuario: { select: { id: true, usuario: true } },
      tipoPago: true,
      detalles: {
        include: {
          producto: {
            select: { id: true, nombreProducto: true, talla: true, color: true },
          },
        },
      },
    },
    orderBy: { fecha: "desc" },
    take: 100,
  })

  return NextResponse.json(ventas)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const body = await req.json()
  const result = crearVentaSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { idCliente, idTipoPago, items } = result.data

  // 1. Verificar sesión de caja abierta
  const sesionCaja = await prisma.sesionCaja.findFirst({
    where: { idUsuario: session.user.id, estado: "ABIERTA" },
  })
  if (!sesionCaja) {
    return NextResponse.json(
      { error: "No tienes una sesión de caja abierta", code: "NO_CAJA" },
      { status: 409 }
    )
  }

  // 2. Verificar stock de todos los productos
  const productIds = items.map((i) => i.idProducto)
  const productos = await prisma.producto.findMany({
    where: { id: { in: productIds } },
    select: { id: true, nombreProducto: true, stock: true },
  })

  const stockErrors: string[] = []
  for (const item of items) {
    const p = productos.find((p) => p.id === item.idProducto)
    if (!p) {
      stockErrors.push(`Producto ID ${item.idProducto} no encontrado`)
    } else if (p.stock < item.cantidad) {
      stockErrors.push(`"${p.nombreProducto}" — stock disponible: ${p.stock}`)
    }
  }
  if (stockErrors.length > 0) {
    return NextResponse.json({ error: "Stock insuficiente", items: stockErrors }, { status: 409 })
  }

  // 3. Calcular totales
  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const total = subtotal

  // 4. Crear la venta en transacción atómica
  const venta = await prisma.$transaction(async (tx) => {
    const nuevaVenta = await tx.venta.create({
      data: {
        idCliente,
        idUsuario: session.user.id,
        idSesionCaja: sesionCaja.id,
        idTipoPago,
        estado: "COMPLETADA",
        subtotal,
        total,
        detalles: {
          create: items.map((item) => ({
            idProducto: item.idProducto,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.precio * item.cantidad,
          })),
        },
      },
      include: {
        detalles: {
          include: {
            producto: {
              select: { id: true, nombreProducto: true, talla: true, color: true },
            },
          },
        },
        cliente: true,
        tipoPago: true,
        usuario: { select: { id: true, usuario: true } },
      },
    })

    // Decrementar stock y registrar movimientos de inventario
    for (const item of items) {
      await tx.producto.update({
        where: { id: item.idProducto },
        data: { stock: { decrement: item.cantidad } },
      })

      await tx.movimientoInventario.create({
        data: {
          idProducto: item.idProducto,
          idUsuario: session.user.id,
          tipo: "SALIDA",
          origen: "VENTA",
          cantidad: -item.cantidad,
          descripcion: `Venta #${nuevaVenta.id}`,
        },
      })
    }

    return nuevaVenta
  })

  return NextResponse.json(venta, { status: 201 })
}
