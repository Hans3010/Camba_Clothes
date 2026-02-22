---
name: prisma-orm
description: "Prisma ORM patterns for CambaClothes database. Use when creating or modifying the schema, writing database queries, creating migrations, seeding data, or any database-related code."
---

## Version
Prisma ORM v5 (NOT v6 or v7) with PostgreSQL provider (SQLite for dev).

## Schema Location
`prisma/schema.prisma`

## PrismaClient Singleton
Always use the singleton pattern in `lib/prisma.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```
Import as: `import { prisma } from "@/lib/prisma";`

## Schema Conventions
- Use `@id @default(autoincrement())` for primary keys
- Use `@default(now())` for createdAt fields
- Use `@relation` explicitly for all foreign keys
- Use `@map` if the database column name differs from the field name
- Define enums for fixed values:
  ```prisma
  enum Rol {
    ADMIN
    VENDEDOR
  }

  enum Estado {
    ACTIVO
    INACTIVO
  }

  enum EstadoVenta {
    COMPLETADA
    ANULADA
  }
  ```

## Soft Deletes
- NEVER use `prisma.model.delete()` for entities with relationships
- Instead, update the `estado` field to INACTIVO or ANULADO
- When querying lists, filter by `estado: "ACTIVO"` by default
- Example: `await prisma.producto.findMany({ where: { estado: "ACTIVO" } })`

## Transactions
Use `prisma.$transaction()` when multiple tables are affected in one operation:
```typescript
// Example: Creating a sale
await prisma.$transaction(async (tx) => {
  // 1. Create the sale
  const venta = await tx.venta.create({ data: { ... } });
  
  // 2. Create sale details
  for (const item of items) {
    await tx.detalleVenta.create({ data: { ... } });
    
    // 3. Update product stock
    await tx.producto.update({
      where: { id: item.idProducto },
      data: { stock: { decrement: item.cantidad } },
    });
    
    // 4. Create inventory movement
    await tx.movimientoInventario.create({ data: { ... } });
  }
  
  return venta;
});
```

## Stock Management
- Stock is stored in `Producto.stock` (integer field)
- Use `{ increment: n }` and `{ decrement: n }` for atomic updates
- NEVER read stock, calculate, and write back — use Prisma atomic operations
- Alert threshold is `Producto.stockMinimo`

## Queries
- Use `include` for eager loading relations: `include: { categoria: true }`
- Use `select` when you only need specific fields
- Use `orderBy` for sorting: `orderBy: { createdAt: "desc" }`
- Use `where` with `contains` for search: `where: { nombre: { contains: query, mode: "insensitive" } }`
- Pagination: use `skip` and `take`

## Commands
- After schema changes: `npx prisma generate`
- Push to database (dev): `npx prisma db push`
- Create migration (prod): `npx prisma migrate dev --name description`
- Open Prisma Studio: `npx prisma studio`
- Seed: `npx prisma db seed`
