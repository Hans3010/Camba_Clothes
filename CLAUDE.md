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

## Estructura del Proyecto
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx              ← Sidebar + Header compartido
│   │   ├── dashboard/page.tsx      ← KPIs principales
│   │   ├── pos/page.tsx            ← Punto de venta (vista principal)
│   │   ├── ventas/page.tsx         ← Historial de ventas
│   │   ├── productos/page.tsx      ← CRUD productos
│   │   ├── clientes/page.tsx       ← CRUD clientes
│   │   ├── inventario/page.tsx     ← Movimientos de inventario
│   │   ├── proveedores/page.tsx    ← CRUD proveedores
│   │   ├── compras/page.tsx        ← Registro de compras
│   │   ├── reportes/page.tsx       ← Reportes y gráficos
│   │   └── configuracion/page.tsx  ← Usuarios, categorías, tipos de pago
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── usuarios/route.ts
│       ├── productos/route.ts
│       ├── clientes/route.ts
│       ├── ventas/route.ts
│       ├── compras/route.ts
│       ├── proveedores/route.ts
│       ├── categorias/route.ts
│       ├── sesion-caja/route.ts
│       ├── movimientos/route.ts
│       └── reportes/route.ts
├── components/
│   ├── ui/                ← Componentes shadcn (no tocar manualmente)
│   ├── layout/            ← Sidebar, Header, UserNav
│   ├── forms/             ← Formularios reutilizables
│   ├── tables/            ← Columnas y DataTables por módulo
│   └── pos/               ← Componentes específicos del punto de venta
├── lib/
│   ├── prisma.ts          ← Singleton de PrismaClient
│   ├── auth.ts            ← Configuración de NextAuth
│   ├── utils.ts           ← Utilidades generales (cn, formatCurrency, etc.)
│   └── validations/       ← Schemas de Zod por módulo
├── types/
│   └── index.ts           ← Tipos TypeScript compartidos
└── hooks/
    └── ...                ← Custom hooks (useDebounce, etc.)
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
