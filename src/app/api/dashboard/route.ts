import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function getDateRange(periodo: string) {
  const ahora = new Date()
  const hoyStr = ahora.toISOString().split("T")[0]
  let desde: Date
  let desdeAnterior: Date

  if (periodo === "semana") {
    desde = new Date(ahora)
    desde.setDate(desde.getDate() - 7)
    desdeAnterior = new Date(desde)
    desdeAnterior.setDate(desdeAnterior.getDate() - 7)
  } else if (periodo === "mes") {
    desde = new Date(ahora)
    desde.setMonth(desde.getMonth() - 1)
    desdeAnterior = new Date(desde)
    desdeAnterior.setMonth(desdeAnterior.getMonth() - 1)
  } else {
    desde = new Date(`${hoyStr}T00:00:00.000Z`)
    desdeAnterior = new Date(desde)
    desdeAnterior.setDate(desdeAnterior.getDate() - 1)
  }

  return { desde, hasta: new Date(`${hoyStr}T23:59:59.999Z`), desdeAnterior }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const periodo = req.nextUrl.searchParams.get("periodo") || "dia"
  const isAdmin = session.user.rol === "ADMIN"
  const { desde, hasta, desdeAnterior } = getDateRange(periodo)

  const ventaWhere = {
    estado: "COMPLETADA" as const,
    fecha: { gte: desde, lte: hasta },
    ...(!isAdmin && { idUsuario: session.user.id }),
  }

  const ventaWhereAnterior = {
    estado: "COMPLETADA" as const,
    fecha: { gte: desdeAnterior, lt: desde },
    ...(!isAdmin && { idUsuario: session.user.id }),
  }

  const [ventas, ventasAnteriores, stockCriticoList] = await Promise.all([
    prisma.venta.findMany({
      where: ventaWhere,
      include: {
        detalles: {
          include: {
            producto: { select: { id: true, nombreProducto: true, costo: true, talla: true, color: true } },
          },
        },
      },
    }),
    prisma.venta.findMany({
      where: ventaWhereAnterior,
      select: { total: true },
    }),
    isAdmin
      ? prisma.$queryRawUnsafe<Array<{ id: number; nombreProducto: string; talla: string; color: string; stock: number; stockMinimo: number }>>(
          `SELECT id, "nombreProducto", talla, color, stock, "stockMinimo" FROM "Producto" WHERE estado = 'ACTIVO' AND stock <= "stockMinimo" ORDER BY stock ASC LIMIT 10`
        )
      : Promise.resolve([]),
  ])

  const ventasTotales = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const cantidadTransacciones = ventas.length
  const ticketPromedio = cantidadTransacciones > 0 ? ventasTotales / cantidadTransacciones : 0

  const productMap = new Map<number, { id: number; nombreProducto: string; talla: string; color: string; cantidadVendida: number; totalVendido: number; sumMargen: number }>()
  let totalMargenPonderado = 0
  let totalSubtotal = 0

  for (const venta of ventas) {
    for (const det of venta.detalles) {
      const costo = Number(det.producto.costo)
      const precio = Number(det.precio)
      const subtotal = Number(det.subtotal)
      const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0

      totalMargenPonderado += margen * subtotal
      totalSubtotal += subtotal

      const existing = productMap.get(det.idProducto)
      if (existing) {
        existing.cantidadVendida += det.cantidad
        existing.totalVendido += subtotal
      } else {
        productMap.set(det.idProducto, {
          id: det.producto.id,
          nombreProducto: det.producto.nombreProducto,
          talla: det.producto.talla,
          color: det.producto.color,
          cantidadVendida: det.cantidad,
          totalVendido: subtotal,
          sumMargen: 0,
        })
      }
    }
  }

  const margenPromedio = totalSubtotal > 0 ? totalMargenPonderado / totalSubtotal : 0

  const topProductos = Array.from(productMap.values())
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, 5)

  const ventasAnterior = ventasAnteriores.reduce((acc, v) => acc + Number(v.total), 0)
  const porcentajeCambio = ventasAnterior > 0 ? ((ventasTotales - ventasAnterior) / ventasAnterior) * 100 : ventasTotales > 0 ? 100 : 0

  return NextResponse.json({
    ventasTotales,
    cantidadTransacciones,
    ticketPromedio,
    margenPromedio,
    comparativa: { ventasAnterior, porcentajeCambio },
    topProductos,
    stockCritico: stockCriticoList,
  })
}
