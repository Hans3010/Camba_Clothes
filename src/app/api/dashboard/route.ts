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

  const [ventas, ventasAnteriores, stockCriticoList, clientesConVentas] = await Promise.all([
    prisma.venta.findMany({
      where: ventaWhere,
      include: {
        tipoPago: { select: { tipoMetodo: true } },
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
    prisma.cliente.findMany({
      where: { estado: "ACTIVO" },
      select: {
        id: true,
        nombre: true,
        apPaterno: true,
        ventas: {
          where: { estado: "COMPLETADA" },
          select: { id: true, total: true },
        },
      },
    }),
  ])

  const ventasTotales = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const cantidadTransacciones = ventas.length
  const ticketPromedio = cantidadTransacciones > 0 ? ventasTotales / cantidadTransacciones : 0

  const productMap = new Map<number, { id: number; nombreProducto: string; talla: string; color: string; cantidadVendida: number; totalVendido: number }>()
  let totalMargenPonderado = 0
  let totalSubtotal = 0

  // Ventas por tipo de pago
  const tipoPagoMap = new Map<string, number>()
  // Ventas por día
  const ventasPorDiaMap = new Map<string, number>()

  for (const venta of ventas) {
    // Tipo de pago aggregation
    const tp = venta.tipoPago.tipoMetodo
    tipoPagoMap.set(tp, (tipoPagoMap.get(tp) || 0) + Number(venta.total))

    // Ventas por día
    const diaKey = venta.fecha.toISOString().split("T")[0]
    ventasPorDiaMap.set(diaKey, (ventasPorDiaMap.get(diaKey) || 0) + Number(venta.total))

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

  // Segmentación de clientes
  let frecuentes = 0
  let ocasionales = 0
  let nuevos = 0
  for (const c of clientesConVentas) {
    const total = c.ventas.length
    if (total >= 5) frecuentes++
    else if (total >= 2) ocasionales++
    else if (total === 1) nuevos++
  }

  const ventasPorTipoPago = Array.from(tipoPagoMap.entries()).map(([nombre, total]) => ({
    nombre,
    total,
  }))

  const ventasPorDia = Array.from(ventasPorDiaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, total]) => ({
      fecha,
      total,
    }))

  return NextResponse.json({
    ventasTotales,
    cantidadTransacciones,
    ticketPromedio,
    margenPromedio,
    comparativa: { ventasAnterior, porcentajeCambio },
    topProductos,
    stockCritico: stockCriticoList,
    segmentacionClientes: {
      frecuentes,
      ocasionales,
      nuevos,
      total: clientesConVentas.length,
    },
    ventasPorTipoPago,
    ventasPorDia,
  })
}
