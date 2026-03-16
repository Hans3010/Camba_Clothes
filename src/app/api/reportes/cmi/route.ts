import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN") return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const params = req.nextUrl.searchParams
  const ahora = new Date()
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)

  const desde = params.get("desde") ? new Date(params.get("desde")!) : inicioMes
  const hastaRaw = params.get("hasta") ? new Date(params.get("hasta")!) : ahora
  const hasta = new Date(hastaRaw)
  hasta.setHours(23, 59, 59, 999)

  const diffMs = hasta.getTime() - desde.getTime()
  const desdeAnterior = new Date(desde.getTime() - diffMs)

  const [ventasActuales, ventasAnteriores, compras, todosProductos, clientesConVentas, ventasAnuladas] = await Promise.all([
    prisma.venta.findMany({
      where: { estado: "COMPLETADA", fecha: { gte: desde, lte: hasta } },
      include: {
        detalles: {
          include: { producto: { select: { id: true, nombreProducto: true, talla: true, color: true, costo: true, categoria: { select: { nombreCategoria: true } } } } },
        },
        cliente: { select: { id: true } },
      },
    }),
    prisma.venta.findMany({
      where: { estado: "COMPLETADA", fecha: { gte: desdeAnterior, lt: desde } },
      include: {
        detalles: { include: { producto: { select: { costo: true } } } },
      },
    }),
    prisma.compra.aggregate({
      where: { estado: "ACTIVO", fecha: { gte: desde, lte: hasta } },
      _sum: { total: true },
    }),
    prisma.producto.findMany({
      where: { estado: "ACTIVO" },
      select: { id: true, stock: true, stockMinimo: true },
    }),
    prisma.cliente.findMany({
      where: { estado: "ACTIVO" },
      include: {
        ventas: {
          where: { estado: "COMPLETADA", fecha: { gte: desde, lte: hasta } },
          select: { id: true, total: true, fecha: true },
        },
      },
    }),
    prisma.venta.count({
      where: { estado: "ANULADA", fecha: { gte: desde, lte: hasta } },
    }),
  ])

  const ingresosBrutos = ventasActuales.reduce((acc, v) => acc + Number(v.total), 0)
  let costoTotal = 0
  const productRentMap = new Map<number, { id: number; nombreProducto: string; talla: string; color: string; categoria: string; cantidadVendida: number; ingreso: number; costo: number }>()
  const categoriaRentMap = new Map<string, { categoria: string; cantidadVendida: number; ingreso: number; costo: number }>()

  for (const v of ventasActuales) {
    for (const det of v.detalles) {
      const costoUnit = Number(det.producto.costo)
      const subtotal = Number(det.subtotal)
      const costoLinea = costoUnit * det.cantidad
      costoTotal += costoLinea

      const existing = productRentMap.get(det.producto.id)
      if (existing) {
        existing.cantidadVendida += det.cantidad
        existing.ingreso += subtotal
        existing.costo += costoLinea
      } else {
        productRentMap.set(det.producto.id, {
          id: det.producto.id,
          nombreProducto: det.producto.nombreProducto,
          talla: det.producto.talla,
          color: det.producto.color,
          categoria: det.producto.categoria.nombreCategoria,
          cantidadVendida: det.cantidad,
          ingreso: subtotal,
          costo: costoLinea,
        })
      }

      const cat = det.producto.categoria.nombreCategoria
      const existingCat = categoriaRentMap.get(cat)
      if (existingCat) {
        existingCat.cantidadVendida += det.cantidad
        existingCat.ingreso += subtotal
        existingCat.costo += costoLinea
      } else {
        categoriaRentMap.set(cat, { categoria: cat, cantidadVendida: det.cantidad, ingreso: subtotal, costo: costoLinea })
      }
    }
  }

  const gananciaTotal = ingresosBrutos - costoTotal
  const margenPromedio = ingresosBrutos > 0 ? (gananciaTotal / ingresosBrutos) * 100 : 0

  const clienteIdsEnPeriodo = new Set(ventasActuales.map((v) => v.cliente.id))
  const clientesNuevos = clientesConVentas.filter((c) => {
    if (c.ventas.length === 0) return false
    const primeraCompra = new Date(Math.min(...c.ventas.map((v) => new Date(v.fecha).getTime())))
    return primeraCompra >= desde && primeraCompra <= hasta
  }).length

  const frecuentes = clientesConVentas.filter((c) => c.ventas.length >= 5).length
  const ocasionales = clientesConVentas.filter((c) => c.ventas.length >= 1 && c.ventas.length < 5).length
  const ticketPromedioClientes = ventasActuales.length > 0 ? ingresosBrutos / ventasActuales.length : 0

  const totalUnidadesVendidas = ventasActuales.reduce((acc, v) => acc + v.detalles.reduce((a, d) => a + d.cantidad, 0), 0)
  const totalStock = todosProductos.reduce((acc, p) => acc + p.stock, 0)
  const rotacionInventario = totalStock > 0 ? totalUnidadesVendidas / totalStock : 0
  const productosStockCritico = todosProductos.filter((p) => p.stock > 0 && p.stock <= p.stockMinimo).length
  const productosAgotados = todosProductos.filter((p) => p.stock === 0).length
  const totalVentasPeriodo = ventasActuales.length + ventasAnuladas
  const tasaAnulacion = totalVentasPeriodo > 0 ? (ventasAnuladas / totalVentasPeriodo) * 100 : 0

  const ventasAnteriorTotal = ventasAnteriores.reduce((acc, v) => acc + Number(v.total), 0)
  let costoAnterior = 0
  for (const v of ventasAnteriores) {
    for (const det of v.detalles) {
      costoAnterior += Number(det.producto.costo) * det.cantidad
    }
  }
  const margenAnterior = ventasAnteriorTotal > 0 ? ((ventasAnteriorTotal - costoAnterior) / ventasAnteriorTotal) * 100 : 0
  const cambioVentas = ventasAnteriorTotal > 0 ? ((ingresosBrutos - ventasAnteriorTotal) / ventasAnteriorTotal) * 100 : ingresosBrutos > 0 ? 100 : 0
  const cambioMargen = margenAnterior > 0 ? margenPromedio - margenAnterior : 0

  const rentabilidadProductos = Array.from(productRentMap.values())
    .map((p) => ({
      ...p,
      ganancia: p.ingreso - p.costo,
      margen: p.ingreso > 0 ? ((p.ingreso - p.costo) / p.ingreso) * 100 : 0,
    }))
    .sort((a, b) => b.ganancia - a.ganancia)

  const rentabilidadCategorias = Array.from(categoriaRentMap.values())
    .map((c) => ({
      ...c,
      ganancia: c.ingreso - c.costo,
      margen: c.ingreso > 0 ? ((c.ingreso - c.costo) / c.ingreso) * 100 : 0,
    }))
    .sort((a, b) => b.ganancia - a.ganancia)

  return NextResponse.json({
    financiera: {
      ingresosBrutos,
      costoTotal,
      gananciaTotal,
      margenPromedio,
      totalCompras: Number(compras._sum.total || 0),
    },
    clientes: {
      clientesActivos: clienteIdsEnPeriodo.size,
      clientesNuevos,
      frecuentes,
      ocasionales,
      ticketPromedio: ticketPromedioClientes,
    },
    procesosInternos: {
      rotacionInventario,
      productosStockCritico,
      productosAgotados,
      tasaAnulacion,
    },
    aprendizaje: {
      cambioVentas,
      cambioMargen,
      ventasActual: ingresosBrutos,
      ventasAnterior: ventasAnteriorTotal,
    },
    rentabilidadProductos,
    rentabilidadCategorias,
  })
}
