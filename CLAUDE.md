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

**Módulos Desarrollados o en Progreso Avanzado:**
- **Autenticación:** Sistema de login configurado con NextAuth, middleware y protección de rutas.
- **Categorías:** CRUD de categorías de productos subido (`categoria-tab.tsx`, `categoria-form.tsx`), API REST y schemas Zod.
- **Productos:** CRUD de productos, incluyendo formulario, tabla de datos y toda la API REST respectiva.
- **Proveedores:** CRUD avanzado implementado con formularios (`proveedor-form.tsx`), tabla de datos (`proveedores-columns.tsx`), schemas de validación de Zod, y API REST (`/api/proveedores`).
- **Caja (Sesión de Caja):** Flujo de apertura de caja funcional, con formulario (`abrir-caja-form.tsx`), componente de resumen (`resumen-caja.tsx`), API REST especializada (`/api/sesion-caja`) y schemas asociados.
- **Layout y UI:** Sidebar, Header modularizados y stack inicial de componentes base listos en `components/ui/`.

**Módulos Pendientes (Estructura base de páginas creada, lógica pendiente):**
- Clientes, Punto de Venta (POS), Ventas, Compras, Inventario, Reportes, Dashboard (KPIs), Configuración de Usuarios.

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
