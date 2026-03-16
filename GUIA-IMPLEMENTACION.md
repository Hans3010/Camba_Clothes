# Guía de Implementación — Requisitos Funcionales Pendientes

## Estado General del Proyecto

### Completado
| Módulo | Estado | Notas |
|--------|--------|-------|
| Autenticación | 100% | Login, roles, middleware |
| Usuarios | 100% | CRUD completo, solo ADMIN |
| Categorías | 100% | CRUD con soft delete |
| Proveedores | 100% | CRUD con soft delete |
| Productos | 100% | CRUD con stock, margen, alertas |
| Clientes | 100% | CRUD + segmentación (frecuente/ocasional/nuevo) |
| Sesión de Caja | 100% | Apertura, cierre, historial |
| POS | 100% | Búsqueda, carrito, checkout, nota de venta |
| Ventas (historial) | 100% | DataTable, detalle, anulación |
| Compras | 100% | Registro, historial, edición inline |
| Inventario | 100% | Valoración, movimientos, ajuste manual |

### Pendiente
| Módulo | Estado | Requisitos |
|--------|--------|------------|
| Dashboard | 0% | RF-33 |
| Reportes | 0% | RF-34, RF-35, RF-36, RF-37, RF-38 |

---

## RF-33: Dashboard de KPIs (Prioridad ALTA)

**Archivo**: `src/app/(dashboard)/dashboard/page.tsx` (actualmente placeholder)
**API nueva**: `src/app/api/dashboard/route.ts`

### Qué debe mostrar
1. **KPIs principales** (cards superiores):
   - Ventas totales del día / semana / mes (con selector de período)
   - Número de transacciones del período
   - Ticket promedio (total ventas / nro transacciones)
   - Margen de ganancia promedio del período

2. **Productos más vendidos** (top 5):
   - Tabla o lista con nombre, cantidad vendida, ingresos generados
   - Filtrable por período

3. **Stock crítico** (alertas):
   - Lista de productos donde `stock <= stockMinimo`
   - Mostrar stock actual vs mínimo, categoría

4. **Comparativa con período anterior**:
   - Ventas de esta semana vs semana pasada (porcentaje de cambio)
   - Indicador visual (flecha arriba/abajo, verde/rojo)

### Cómo implementarlo
1. Crear `GET /api/dashboard` que reciba query params `periodo` (dia/semana/mes)
2. Consultas Prisma:
   - Ventas: `prisma.venta.aggregate()` con filtro de fecha y `estado: "COMPLETADA"`
   - Top productos: `prisma.detalleVenta.groupBy({ by: ['idProducto'], _sum: { cantidad: true, subtotal: true } })`
   - Stock crítico: `prisma.producto.findMany({ where: { stock: { lte: prisma.producto.fields.stockMinimo } } })`
3. La página es `"use client"` con `useState` para el selector de período
4. Usar Cards de shadcn para KPIs, Table para top productos, Badge para alertas de stock

### Datos que ya existen en la DB
- Ventas con fecha, total, detalles (producto, cantidad, precio)
- Productos con stock, stockMinimo, costo, precioVenta, margen

---

## RF-34: Reporte de Ventas por Período (Prioridad ALTA)

**Archivo**: `src/app/(dashboard)/reportes/page.tsx` (actualmente placeholder)
**API nueva**: `src/app/api/reportes/ventas/route.ts`

### Qué debe mostrar
1. **Filtros**: Rango de fechas (desde/hasta), tipo de pago, vendedor
2. **Resumen**: Total vendido, cantidad de ventas, ticket promedio, total anuladas
3. **Tabla de ventas**: Fecha, cliente, vendedor, tipo pago, total, estado
4. **Tendencias**: Gráfico de ventas por día/semana dentro del rango (opcional, con recharts o chart.js)

### Cómo implementarlo
1. `GET /api/reportes/ventas?desde=2026-01-01&hasta=2026-03-15&tipoPago=1&vendedor=1`
2. Consulta:
   ```
   prisma.venta.findMany({
     where: { fecha: { gte: desde, lte: hasta }, estado: "COMPLETADA" },
     include: { cliente: true, usuario: true, tipoPago: true, detalles: { include: { producto: true } } }
   })
   ```
3. Calcular totales en el API o en el cliente con `useMemo`
4. Usar Tabs de shadcn para separar "Resumen" y "Detalle"

---

## RF-35: Reporte de Inventario (Prioridad ALTA)

**Nota**: Gran parte de esto ya está implementado en `inventario/page.tsx` (tab Valoración). Solo falta integrarlo como reporte exportable.

### Qué debe mostrar
1. **Estado actual**: Productos con stock disponible, stock mínimo, estado (OK/Crítico/Agotado)
2. **Valor total en almacén**: Suma de (stock × costo) de todos los productos activos
3. **Filtros**: Por categoría, por estado de stock (todos/crítico/agotado/OK)

### Qué hacer
- Ya tienes la tabla de valoración en inventario. Para el reporte:
  1. Reutilizar la lógica existente
  2. Agregar un botón "Exportar" (opcional: generar CSV o PDF)
  3. Agregar agrupación por categoría si se desea

---

## RF-36: Reporte de Productos Más Vendidos (Prioridad MEDIA)

**API nueva**: `src/app/api/reportes/top-productos/route.ts`

### Qué debe mostrar
1. **Ranking**: Top N productos más vendidos por cantidad y por ingresos
2. **Filtros**: Período (día/semana/mes/rango personalizado), categoría
3. **Datos por producto**: Nombre, categoría, unidades vendidas, ingresos, margen

### Cómo implementarlo
1. `GET /api/reportes/top-productos?desde=...&hasta=...&categoria=1&limit=10`
2. Consulta:
   ```
   prisma.detalleVenta.groupBy({
     by: ['idProducto'],
     where: { venta: { fecha: { gte, lte }, estado: "COMPLETADA" } },
     _sum: { cantidad: true, subtotal: true },
     orderBy: { _sum: { cantidad: 'desc' } },
     take: limit
   })
   ```
3. Luego hacer un `findMany` de los productos para obtener nombre, categoría, margen
4. Mostrar como tabla con posición (#1, #2...) y opcionalmente un gráfico de barras

---

## RF-37: Cuadro de Mando Integral — CMI (Prioridad MEDIA)

**Archivo**: Puede ir como tab adicional en reportes o como sección dentro del dashboard.

### Las 4 perspectivas del CMI
1. **Financiera** (márgenes, ingresos):
   - Margen de ganancia promedio
   - Ingresos totales del período
   - Costo total de mercadería vendida
   - Ya tienes: margen en cada producto, totales de venta

2. **Clientes** (frecuencia, segmentación):
   - Distribución por segmento (frecuente/ocasional/nuevo)
   - Tasa de retención (clientes con >1 compra / total clientes)
   - Ya tienes: API `/api/clientes/segmentacion` con todos estos datos

3. **Procesos internos** (rotación de inventario):
   - Rotación = Costo mercadería vendida / Valor promedio inventario
   - Productos sin movimiento en X días
   - Tasa de anulación (ventas anuladas / ventas totales)

4. **Aprendizaje y crecimiento** (evolución de ventas):
   - Comparativa de ventas mes actual vs mes anterior
   - Tendencia de ventas (creciente/decreciente)
   - Ventas por vendedor

### Cómo implementarlo
1. `GET /api/reportes/cmi?periodo=mes` que devuelva las 4 perspectivas
2. Mostrar como 4 cards/secciones, cada una con 2-3 indicadores
3. Usar Badge de shadcn para estado (bueno/regular/malo)
4. Colores: verde (meta cumplida), amarillo (en rango), rojo (por debajo)

---

## RF-38: Reporte de Rentabilidad por Producto (Prioridad MEDIA)

**API nueva**: `src/app/api/reportes/rentabilidad/route.ts`

### Qué debe mostrar
1. **Por producto**: Nombre, categoría, costo, precio venta, margen %, unidades vendidas, ganancia total
2. **Por categoría**: Margen promedio, total vendido, ganancia acumulada
3. **Filtros**: Período, categoría
4. **Ordenamiento**: Por margen (mayor a menor) o por ganancia total

### Cómo implementarlo
1. Consulta combina productos con sus detalles de venta:
   ```
   prisma.producto.findMany({
     where: { estado: "ACTIVO" },
     include: {
       categoria: true,
       detallesVenta: {
         where: { venta: { estado: "COMPLETADA", fecha: { gte, lte } } },
         select: { cantidad: true, precio: true, subtotal: true }
       }
     }
   })
   ```
2. Calcular en el API:
   - `unidadesVendidas = sum(detallesVenta.cantidad)`
   - `ingresos = sum(detallesVenta.subtotal)`
   - `costoTotal = unidadesVendidas * producto.costo`
   - `ganancia = ingresos - costoTotal`
3. Agrupar también por categoría para vista resumida
4. Tabla con dos tabs: "Por Producto" y "Por Categoría"

---

## Orden de Implementación Recomendado

```
1. RF-33  Dashboard de KPIs          ← Primero (prioridad alta + base para todo lo demás)
2. RF-34  Ventas por período         ← Segundo (prioridad alta)
3. RF-35  Reporte de inventario      ← Tercero (ya tienes 80% hecho en inventario/page.tsx)
4. RF-38  Rentabilidad por producto  ← Cuarto (reutiliza datos de productos y ventas)
5. RF-36  Productos más vendidos     ← Quinto (query simple de groupBy)
6. RF-37  CMI                        ← Último (combina datos de todos los anteriores)
```

## Notas Técnicas
- Todas las consultas de reportes deben filtrar `estado: "COMPLETADA"` en ventas
- Los períodos deben calcularse en UTC o en la zona horaria de Bolivia (UTC-4)
- Para gráficos puedes usar `recharts` (ya es popular en Next.js) o chart.js
- Los reportes son solo para rol ADMIN
- No se necesitan cambios al schema de Prisma — toda la data ya existe
