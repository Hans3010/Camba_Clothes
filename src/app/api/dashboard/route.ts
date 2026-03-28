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

  const ventaAnuladaWhere = {
    estado: "ANULADA" as const,
    fecha: { gte: desde, lte: hasta },
    ...(!isAdmin && { idUsuario: session.user.id }),
  }

  const ventaWhereAnterior = {
    estado: "COMPLETADA" as const,
    fecha: { gte: desdeAnterior, lt: desde },
    ...(!isAdmin && { idUsuario: session.user.id }),
  }

  const [
    ventas, 
    ventasAnteriores,
    ventasAnuladasCount,
    productosAll, 
    clientesConVentas
  ] = await Promise.all([
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
      include: {
        detalles: { include: { producto: { select: { costo: true } } } }
      }
    }),
    prisma.venta.count({ where: ventaAnuladaWhere }),
    isAdmin 
      ? prisma.producto.findMany({
        where: { estado: 'ACTIVO' },
        select: { id: true, nombreProducto: true, stock: true, stockMinimo: true, costo: true, talla: true, color: true }
      })
      : Promise.resolve([]),
    prisma.cliente.findMany({
      where: { estado: "ACTIVO" },
      select: {
        id: true,
        nombre: true,
        apPaterno: true,
        ventas: {
          where: { estado: "COMPLETADA" },
          select: { id: true, total: true, fecha: true },
          orderBy: { fecha: 'asc' }
        },
      },
    }),
  ])

  // --- FINANZAS ---
  const ventasTotales = ventas.reduce((acc, v) => acc + Number(v.total), 0) // Ingresos Brutos
  let costoTotalVentas = 0
  let gananciaBruta = 0

  // Top productos y ventas por dia para los graficos
  const productMap = new Map<number, { id: number; nombreProducto: string; talla: string; color: string; cantidadVendida: number; totalVendido: number }>()
  
  // Guardamos Ingreso y Ganancia por día
  const ventasPorDiaMap = new Map<string, { ingreso: number, ganancia: number }>()

  for (const venta of ventas) {
    const diaKey = venta.fecha.toISOString().split("T")[0]
    const currentDia = ventasPorDiaMap.get(diaKey) || { ingreso: 0, ganancia: 0 }
    currentDia.ingreso += Number(venta.total)

    let gananciaVenta = 0;

    for (const det of venta.detalles) {
      const costo = Number(det.producto.costo) * det.cantidad
      const rebajaReal = Number(det.precio) * det.cantidad
      
      costoTotalVentas += costo
      gananciaVenta += (rebajaReal - costo)

      const existing = productMap.get(det.idProducto)
      if (existing) {
        existing.cantidadVendida += det.cantidad
        existing.totalVendido += rebajaReal
      } else {
        productMap.set(det.idProducto, {
          id: det.producto.id,
          nombreProducto: det.producto.nombreProducto,
          talla: det.producto.talla,
          color: det.producto.color,
          cantidadVendida: det.cantidad,
          totalVendido: rebajaReal,
        })
      }
    }

    gananciaBruta += gananciaVenta
    currentDia.ganancia += gananciaVenta
    ventasPorDiaMap.set(diaKey, currentDia)
  }

  const margenPromedio = ventasTotales > 0 ? (gananciaBruta / ventasTotales) * 100 : 0

  // Comparativa ventas periodo anterior
  const ventasAnterior = ventasAnteriores.reduce((acc, v) => acc + Number(v.total), 0)
  const porcentajeCambio = ventasAnterior > 0 ? ((ventasTotales - ventasAnterior) / ventasAnterior) * 100 : ventasTotales > 0 ? 100 : 0

  let gananciaAnterior = 0
  for (const v of ventasAnteriores) {
    for (const d of v.detalles) {
      const costo = Number(d.producto.costo) * d.cantidad
      const rebajaReal = Number(d.precio) * d.cantidad
      gananciaAnterior += (rebajaReal - costo)
    }
  }
  const porcentajeCambioGanancia = gananciaAnterior > 0 ? ((gananciaBruta - gananciaAnterior) / gananciaAnterior) * 100 : gananciaBruta > 0 ? 100 : 0

  // --- CLIENTES ---
  const cantidadTransacciones = ventas.length
  const ticketPromedio = cantidadTransacciones > 0 ? ventasTotales / cantidadTransacciones : 0

  // El sistema de clientes que estaba antes ( Segmentación )
  let frecuentes = 0
  let ocasionales = 0
  let nuevos = 0
  
  // También calculamos los activos y nuevos del periodo actual solo para KPIs
  let clientesActivos = 0
  let nuevosDelPeriodo = 0
  let frecuentesActivos = 0

  for (const c of clientesConVentas) {
    const totalVentas = c.ventas.length
    if (totalVentas >= 5) frecuentes++
    else if (totalVentas >= 2) ocasionales++
    else if (totalVentas === 1) nuevos++

    // Métricas del periodo
    const comprasEnPeriodo = c.ventas.filter(v => v.fecha >= desde && v.fecha <= hasta)
    if (comprasEnPeriodo.length > 0) {
      clientesActivos++
      
      const primeraCompra = c.ventas[0]
      if (primeraCompra && primeraCompra.fecha >= desde && primeraCompra.fecha <= hasta) {
        nuevosDelPeriodo++
      }

      if (totalVentas >= 5) {
        frecuentesActivos++
      }
    }
  }

  // --- PROCESOS INTERNOS ---
  const productosStockCriticoList = productosAll.filter(p => p.stock <= p.stockMinimo)
  const productosStockCritico = productosStockCriticoList.length

  // Calcular inventario valorado
  const inventarioValoradoTotal = productosAll.reduce((acc, p) => acc + (Number(p.costo) * p.stock), 0)
  
  // Rotación = Costo Total de Ventas / Inventario Valorado Promedio (usando el actual como aprox)
  const rotacionInventario = inventarioValoradoTotal > 0 ? costoTotalVentas / inventarioValoradoTotal : 0

  // Tasa Anulación
  const totalOperaciones = cantidadTransacciones + ventasAnuladasCount
  const tasaAnulacion = totalOperaciones > 0 ? (ventasAnuladasCount / totalOperaciones) * 100 : 0


  // --- DATOS PARA GRÁFICOS ---
  const topProductos = Array.from(productMap.values())
    .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
    .slice(0, 5)

  const ventasPorDia = Array.from(ventasPorDiaMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([fecha, { ingreso, ganancia }]) => ({
      fecha,
      ingreso,
      ganancia
    }))

  return NextResponse.json({
    // Finanzas
    ingresosBrutos: ventasTotales,
    gananciaBruta,
    margenPromedio,
    comparativa: { ventasAnterior, porcentajeCambio, porcentajeCambioGanancia },
    
    // Clientes
    clientesActivos,
    clientesNuevos: nuevosDelPeriodo,
    clientesFrecuentes: frecuentesActivos,
    ticketPromedio,
    segmentacionClientes: {
      frecuentes,
      ocasionales,
      nuevos,
      total: clientesConVentas.length,
    },
    
    // Procesos Internos
    rotacionInventario,
    productosStockCritico,
    tasaAnulacion,

    // Listas/Gráficos
    topProductos,
    ventasPorDia,
    stockCriticoList: productosStockCriticoList.slice(0, 10) // Muestra max 10 en lista
  })
}
