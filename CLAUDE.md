# CambaClothes - Sistema POS para Boutique de Ropa

## Proyecto
Sistema de gestión comercial interno para una boutique de ropa en Santa Cruz, Bolivia.
NO es e-commerce. NO tiene facturación fiscal. NO tiene pasarelas de pago externas.
Solo uso interno en mostrador. Dos roles: ADMIN y VENDEDOR.

## Stack Tecnológico
- **Framework**: Next.js 15 (App Router) con TypeScript
- **Base de datos**: Prisma ORM + PostgreSQL (SQLite para desarrollo local)
- **Autenticación**: NextAuth.js v4 con CredentialsProvider
- **UI**: shadcn/ui + Tailwind CSS
- **Formularios**: react-hook-form + zod
- **Tablas**: @tanstack/react-table con shadcn DataTable
- **Notificaciones**: Sonner (toast)

## Estructura Actual del Proyecto
```text
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + Header compartido
│   │   ├── caja/page.tsx           ← Apertura/cierre de caja
│   │   ├── categoria/page.tsx      ← Gestión de categorías
│   │   ├── clientes/page.tsx       ← CRUD clientes
│   │   ├── compras/page.tsx        ← Registro de compras
│   │   ├── configuracion/page.tsx  ← Ajustes (roles, usuarios)
│   │   ├── dashboard/page.tsx      ← KPIs principales
│   │   ├── inventario/page.tsx     ← Movimientos de stock
│   │   ├── pos/page.tsx            ← Punto de venta
│   │   ├── productos/page.tsx      ← CRUD productos
│   │   ├── proveedores/            ← CRUD proveedores
│   │   │   ├── page.tsx
│   │   │   └── nuevo/page.tsx
│   │   ├── reportes/page.tsx       ← Reportes y gráficos
│   │   └── ventas/page.tsx         ← Historial de ventas
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── categorias/             ← Endpoints API de categorías
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── productos/              ← Endpoints API de productos
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       ├── proveedores/            ← Endpoints API de proveedores
│       │   ├── route.ts
│       │   └── [id]/route.ts
│       └── sesion-caja/            ← Endpoints API de sesiones de caja
│           ├── route.ts
│           └── [id]/route.ts
├── components/
│   ├── forms/                      ← Formularios interactivos
│   │   ├── abrir-caja-form.tsx
│   │   ├── categoria-form.tsx
│   │   ├── producto-form.tsx
│   │   └── proveedor-form.tsx
│   ├── layout/                     ← Componentes de estructura
│   │   ├── header.tsx
│   │   └── sidebar.tsx
│   ├── modules/                    ← Componentes modulares complejos
│   │   └── categoria-tab.tsx
│   ├── pos/                        ← UI específica del POS
│   │   └── resumen-caja.tsx
│   ├── tables/                     ← Columnas y configuraciones de tablas
│   │   ├── productos-columns.tsx
│   │   └── proveedores-columns.tsx
│   └── ui/                         ← Componentes genéricos de shadcn/ui
├── generated/                      ← Archivos generados automáticamente
│   └── prisma/                     ← Tipos de base de datos
├── lib/
│   ├── auth.ts                     ← Configuración de NextAuth
│   ├── prisma.ts                   ← Singleton de PrismaClient
│   ├── utils.ts                    ← Utilidades (cn, formatCurrency)
│   └── validations/                ← Schemas de Zod (categoria.ts, producto.ts, proveedor.ts, sesion-caja.ts)
└── types/
    └── next-auth.d.ts              ← Tipos de sesión extendidos
```

## Decisiones Arquitectónicas
- **Soft delete siempre**: Usar campo `estado` (ACTIVO/INACTIVO/ANULADO), nunca eliminar registros con relaciones
- **Stock en Producto**: El campo `stock` se almacena directamente en la tabla Producto y se actualiza con cada venta/compra/ajuste
- **stockMinimo**: Campo en Producto para disparar alertas cuando stock <= stockMinimo
- **Moneda**: BOB (Bolivianos), sin manejo multi-moneda
- **Sesión de caja obligatoria**: No se puede registrar una venta sin una sesionCaja abierta
- **motivoAnulacion**: Campo en Venta que se llena solo cuando se anula una venta
- **Margen de ganancia**: Calculado como ((precioVenta - costo) / precioVenta) * 100

## Convenciones de Código
- Usar **Server Components** por defecto. Solo agregar `"use client"` cuando se necesiten hooks, event handlers o APIs del navegador
- API Routes en `app/api/` usando `NextRequest` y `NextResponse`
- Formularios con `react-hook-form` + `zod` + componente `Form` de shadcn
- Tablas de datos con `@tanstack/react-table` + patrón DataTable de shadcn
- Toast con `Sonner` para notificaciones de éxito/error
- PrismaClient como singleton en `lib/prisma.ts` para evitar agotamiento de conexiones en desarrollo
- Usar `prisma.$transaction()` para operaciones que afectan múltiples tablas (ej: crear venta + actualizar stock)
- Importaciones con alias `@/` (ej: `@/lib/prisma`, `@/components/ui/button`)
- Nombres de archivos en kebab-case
- Componentes en PascalCase
- Variables y funciones en camelCase

## Estado Actual de Desarrollo

**Módulos Completados:**
- **Autenticación:** Login con NextAuth, middleware y protección de rutas. Roles ADMIN y VENDEDOR.
- **Usuarios:** CRUD completo en `/configuracion`. API REST (`/api/usuarios`) con auth y restricción ADMIN. Formulario con validación Zod.
- **Categorías:** CRUD completo (`categoria-tab.tsx`, `categoria-form.tsx`), API REST (`/api/categorias`) y schemas Zod.
- **Proveedores:** CRUD completo con soft delete, formulario (`proveedor-form.tsx`), tabla (`proveedores-columns.tsx`) y API REST (`/api/proveedores`).
- **Productos:** CRUD completo con soft delete, búsqueda/filtrado, cálculo de margen y API REST (`/api/productos`).
- **Caja (Sesión de Caja):** Apertura/cierre funcional, formulario (`abrir-caja-form.tsx`), resumen (`resumen-caja.tsx`) y API REST (`/api/sesion-caja`).
- **POS (Punto de Venta):** UI completa con búsqueda de productos (debounce 300ms), carrito interactivo, checkout dialog con búsqueda y creación rápida de clientes, selector de tipo de pago y nota de venta imprimible. API REST (`/api/ventas`, `/api/pos/productos`, `/api/tipos-pago`).
- **Movimientos de Inventario:** Tabla de movimientos con lectura desde `/api/inventario`. Log de auditoría automático en cada venta.
- **Layout y UI:** Sidebar con secciones agrupadas, Header y stack de componentes shadcn/ui.

**Módulos con API lista pero UI pendiente:**
- **Clientes:** API REST completa (`/api/clientes`, GET buscable + POST). Página `clientes/page.tsx` es placeholder.
- **Ventas (historial):** API REST (`/api/ventas`, GET + POST con transacción atómica). Página `ventas/page.tsx` es placeholder.

**Módulos Pendientes:**
- Compras (registro de compras a proveedores, actualizar stock)
- Dashboard (KPIs: ventas totales, productos más vendidos, stock crítico, margen promedio)
- Reportes (ventas por período, inventario, rentabilidad por producto)

**Notas de arquitectura vigentes:**
- `movimientoInventario.origen` es requerido — usar `"VENTA"`, `"COMPRA"`, `"AJUSTE_MANUAL"`, `"STOCK_INICIAL"` o `"DEVOLUCION"` según el contexto
- Soft delete implementado en: `Producto`, `categoriaProducto`, `Proveedor`, `Cliente`, `Compra` (campo `estado`)
- `/api/usuarios` y derivados requieren rol ADMIN (verificado con `getServerSession`)

## Tablas de la Base de Datos (13 tablas)
tipoUsuario, Usuario, categoriaProducto, Producto, Proveedor, Compra, detalleCompra, Cliente, tipoPago, sesionCaja, Venta, detalleVenta, movimientoInventario

## Orden de Desarrollo (seguir este orden estrictamente)
1. Auth (login, roles, middleware de protección de rutas)
2. Usuarios (CRUD, solo ADMIN)
3. Categorías de Producto (CRUD, solo ADMIN)
4. Proveedores (CRUD, solo ADMIN)
5. Productos (CRUD con stock, stockMinimo, cálculo de margen)
6. Clientes (CRUD, buscable por nombre/teléfono)
7. Sesión de Caja (abrir/cerrar)
8. Ventas / POS (búsqueda de productos, carrito, pago, nota de venta)
9. Compras (registro de compras a proveedores, actualizar stock)
10. Movimientos de Inventario (log de auditoría)
11. Dashboard (KPIs: ventas totales, productos más vendidos, stock crítico, margen promedio)
12. Reportes (ventas por período, inventario, rentabilidad por producto)

## Usuarios del Sistema
| Rol | Acceso |
|-----|--------|
| ADMIN | Todo el sistema |
| VENDEDOR | POS, Ventas, Clientes, Consulta de inventario |
