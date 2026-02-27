# CambaClothes — Sistema POS

Sistema de gestión comercial interno para una boutique de ropa en Santa Cruz, Bolivia.
Desarrollado como proyecto académico con Next.js 15 y PostgreSQL.

> **Uso interno en mostrador.** No es e-commerce, no tiene facturación fiscal ni pasarelas de pago externas.

---

## Equipo

| Nombre                     | Rol             |
|----------------------------|-----------------|
| Hans Ribera Morant         | Team Lead       |
| John Jairo Zurita          | Desarrollador   |
| Luis Merma Alarcon         | Scrum Master    |
| Jhonnathan Mamani Canaviri | Desarrollador   |

---

## Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Base de datos:** PostgreSQL + Prisma ORM 7
- **Autenticación:** NextAuth.js v4 (JWT)
- **UI:** shadcn/ui + Tailwind CSS v4
- **Formularios:** react-hook-form + zod
- **Tablas:** @tanstack/react-table

---

## Requisitos previos

- Node.js 20+
- PostgreSQL corriendo localmente (o remoto)

---

## Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Hans3010/Camba_Clothes.git
cd camba-clothes

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env
# Editar .env con tus credenciales de PostgreSQL

# 4. Aplicar migraciones
npx prisma generate

npx prisma migrate dev

# 5. Cargar datos iniciales
npm run seed

# 6. Levantar el servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

**Credenciales de prueba:**
```
usuario: admin      | password: admin123
usuario: vendedor   | password: vendedor123
```

---

## Variables de entorno

Crear un archivo `.env` en la raíz :

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/camba_clothes"
NEXTAUTH_SECRET="un_secret_seguro_y_largo"
NEXTAUTH_URL="http://localhost:3000"
```

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run seed` | Carga datos iniciales en la DB |
| `npm run db:reset` | Resetea la DB y vuelve a seedear |

---

## Estructura del proyecto

```text
src/
├── app/
│   ├── (auth)/               ← Páginas de login (sin sidebar)
│   │   └── login/page.tsx
│   ├── (dashboard)/          ← Todas las páginas protegidas
│   │   ├── layout.tsx        ← Sidebar + Header compartido
│   │   ├── caja/             ← Apertura/cierre de caja
│   │   ├── categoria/        ← Gestión de categorías
│   │   ├── clientes/         ← CRUD clientes
│   │   ├── compras/          ← Registro de compras
│   │   ├── configuracion/    ← Ajustes (roles, usuarios)
│   │   ├── dashboard/        ← KPIs
│   │   ├── inventario/       ← Movimientos de stock
│   │   ├── pos/              ← Punto de venta
│   │   ├── productos/        ← CRUD productos
│   │   ├── proveedores/      ← CRUD proveedores
│   │   ├── reportes/         ← Gráficos y reportes
│   │   └── ventas/           ← Historial de ventas
│   └── api/                  ← API Routes (Next.js)
├── components/
│   ├── forms/                ← Formularios interactivos
│   ├── layout/               ← Sidebar y Header
│   ├── modules/              ← Componentes modulares complejos
│   ├── pos/                  ← Componentes del punto de venta
│   ├── tables/               ← Columnas y DataTables por módulo
│   └── ui/                   ← Componentes shadcn (NO editar)
├── generated/
│   └── prisma/               ← Tipos y cliente de Prisma generados
├── lib/
│   ├── prisma.ts             ← Singleton de PrismaClient
│   ├── auth.ts               ← Configuración de NextAuth
│   ├── utils.ts              ← Utilidades (cn, formatCurrency)
│   └── validations/          ← Schemas de Zod por módulo
├── types/
│   └── next-auth.d.ts        ← Tipos extendidos de sesión
├── hooks/                    ← Custom hooks
└── middleware.ts             ← Protección de rutas
prisma/
├── schema.prisma             ← Esquema de la base de datos
├── migrations/               ← Migraciones generadas automáticamente
└── seed.ts                   ← Datos iniciales
```

### Dónde trabaja cada módulo

| Módulo | Archivos a tocar |
|--------|-----------------|
| Auth / Usuarios | `app/(dashboard)/configuracion/`, `app/api/usuarios/`, `components/forms/` |
| Productos | `app/(dashboard)/productos/`, `app/api/productos/`, `components/tables/` |
| Clientes | `app/(dashboard)/clientes/`, `app/api/clientes/`, `components/forms/` |
| Proveedores | `app/(dashboard)/proveedores/`, `app/api/proveedores/` |
| POS / Ventas | `app/(dashboard)/pos/`, `app/(dashboard)/ventas/`, `app/api/ventas/`, `components/pos/` |
| Compras | `app/(dashboard)/compras/`, `app/api/compras/` |
| Inventario | `app/(dashboard)/inventario/`, `app/api/movimientos/` |
| Dashboard / Reportes | `app/(dashboard)/dashboard/`, `app/(dashboard)/reportes/`, `app/api/reportes/` |

> **Nunca editar** `src/components/ui/` ni `src/generated/prisma/` — son archivos generados automáticamente.

---

## Flujo de trabajo con Git

### Ramas

```
main      ← código estable y revisado (solo via PR)
develop   ← rama de integración (aquí se trabaja)
```

**Regla principal: nunca hacer push directo a `main`.**
Todo el trabajo va a `develop`. Cuando un módulo esté completo y revisado, se hace un Pull Request de `develop` → `main`.

### Flujo recomendado

```bash
# Antes de empezar a trabajar, siempre actualizar develop
git checkout develop
git pull origin develop

# Trabajar, hacer cambios...

# Subir a develop
git add src/app/(dashboard)/productos/ src/app/api/productos/
git commit -m "feat(productos): agregar CRUD completo con tabla y formulario"
git push origin develop
```

### Convención de commits

Poner siempre una descripción corta. Opcionalmente agregar un cuerpo con los puntos más importantes.

**Formato:**
```
descripción corta en presente

- Detalle 1
- Detalle 2
```



**Ejemplos:**
```bash
git commit -m "se agregó la tabla con filtro y paginación"

git commit -m "se implementó el carrito y confirmación de venta

- Búsqueda de productos por nombre
- Agregar/quitar items del carrito
- Selección de tipo de pago
- Registro de venta con transacción Prisma"

```

---

## Consideraciones importantes

- **Soft delete:** nunca usar `delete` en Prisma para registros con relaciones. Usar el campo `estado: "INACTIVO"` o `"ANULADO"`.
- **Transacciones:** operaciones que afectan múltiples tablas (crear venta, registrar compra) deben usar `prisma.$transaction()`.
- **Validación:** toda API Route debe validar el body con Zod antes de tocar la base de datos.
- **Server vs Client Components:** por defecto todo es Server Component. Solo agregar `"use client"` cuando se necesiten hooks o eventos.
- **Sesión de caja:** no se puede registrar una venta sin una `sesionCaja` con estado `"ABIERTA"`.
- **Stock:** el campo `stock` vive en `Producto` y se actualiza atómicamente con cada venta/compra/ajuste.
- **Moneda:** todo en BOB. Formatear precios como `Bs. 1,234.00`.
- **Margen:** `((precioVenta - costo) / precioVenta) * 100`. Recalcular siempre que cambie precio o costo.
