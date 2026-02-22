---
name: pos-system
description: "CambaClothes POS business rules and domain logic. Use ALWAYS when creating any feature, component, API route, or database query for this project. This skill contains the complete business context, database schema, user roles, and module specifications."
---

## About CambaClothes
Internal POS (Point of Sale) system for a clothing boutique in Santa Cruz, Bolivia.
- NO e-commerce, NO online sales
- NO integration with external payment gateways
- NO fiscal invoicing
- Internal use only: one physical store, two user roles
- Currency: BOB (Bolivianos). Format prices as "Bs. 1,234.00"

## User Roles and Access Control

### ADMIN (Administrador del Sistema)
Full access to all modules:
- Usuarios: Create, edit, activate/deactivate users
- Productos: Full CRUD, manage categories
- Proveedores: Full CRUD
- Inventario: View movements, manual adjustments
- Ventas: View history, annul sales
- Compras: Register purchases from suppliers
- Clientes: Full CRUD
- Reportes: All reports and KPIs
- Configuración: Manage categories, payment types, users

### VENDEDOR (Vendedor / Cajero)
Partial access (operational only):
- POS: Register sales (MAIN function)
- Clientes: Register new clients, search clients
- Inventario: View stock only (no adjustments)
- Sesión de Caja: Open and close their own cash register session

## Database Schema (13 tables)

### tipoUsuario
- id (PK, autoincrement)
- rol (String: "ADMIN" or "VENDEDOR")

### Usuario
- id (PK, autoincrement)
- idTipoUsuario (FK → tipoUsuario)
- usuario (String, unique - login username)
- password (String - hashed with bcrypt)
- estado (String: "ACTIVO" / "INACTIVO")

### categoriaProducto
- id (PK, autoincrement)
- nombreCategoria (String: "Camisa", "Pantalón", "Vestido", "Calzado", "Accesorio")
- descripcion (String, optional)

### Producto
- id (PK, autoincrement)
- idCategoriaProducto (FK → categoriaProducto)
- nombreProducto (String)
- precioVenta (Decimal)
- marca (String, optional)
- talla (String)
- color (String)
- temporada (String: "Primavera", "Verano", "Otoño", "Invierno", "Todo el año")
- costo (Decimal - acquisition cost)
- margen (Decimal - calculated: ((precioVenta - costo) / precioVenta) * 100)
- stock (Int - current quantity available)
- stockMinimo (Int - threshold for alerts)
- estado (String: "ACTIVO" / "INACTIVO")

### Proveedor
- id (PK, autoincrement)
- nombreEmpresa (String)
- representante (String, optional)
- telefono (String)
- correo (String, optional)
- ubicacion (String, optional)

### Cliente
- id (PK, autoincrement)
- nombre (String)
- apPaterno (String)
- apMaterno (String, optional)
- telefono (String)
- correo (String, optional)

### tipoPago
- id (PK, autoincrement)
- tipoMetodo (String: "Efectivo", "Tarjeta", "QR")
- moneda (String: "BOB")

### sesionCaja
- id (PK, autoincrement)
- idUsuario (FK → Usuario)
- horaApertura (DateTime)
- horaCierre (DateTime, nullable - null while open)
- montoInicial (Decimal - cash at opening)
- montoFinal (Decimal, nullable - cash at closing)
- estado (String: "ABIERTA" / "CERRADA")

### Venta
- id (PK, autoincrement)
- idCliente (FK → Cliente)
- idUsuario (FK → Usuario - who made the sale)
- idSesionCaja (FK → sesionCaja)
- idTipoPago (FK → tipoPago)
- fecha (DateTime, default now)
- estado (String: "COMPLETADA" / "ANULADA")
- subtotal (Decimal)
- total (Decimal)
- motivoAnulacion (String, nullable - only filled when annulled)

### detalleVenta
- id (PK, autoincrement)
- idVenta (FK → Venta)
- idProducto (FK → Producto)
- cantidad (Int)
- precio (Decimal - unit price at time of sale)
- subtotal (Decimal - cantidad * precio)

### Compra
- id (PK, autoincrement)
- idUsuario (FK → Usuario - who registered the purchase)
- idProveedor (FK → Proveedor)
- fecha (DateTime, default now)
- numeroDocumento (String, optional)
- tipoDocumento (String, optional)
- subtotal (Decimal)
- descuento (Decimal, default 0)
- total (Decimal)

### detalleCompra
- id (PK, autoincrement)
- idCompra (FK → Compra)
- idProducto (FK → Producto)
- cantidad (Int)
- precioCompra (Decimal)
- subtotal (Decimal)

### movimientoInventario
- id (PK, autoincrement)
- idProducto (FK → Producto)
- idUsuario (FK → Usuario)
- fecha (DateTime, default now)
- tipo (String: "ENTRADA" / "SALIDA" / "AJUSTE")
- cantidad (Int - positive for entries, negative for exits)
- descripcion (String - reason for the movement)

## Critical Business Rules

### Sales (Ventas)
1. A sesionCaja MUST be open (estado = "ABIERTA") before any sale can be registered
2. When a sale is created:
   - Create Venta record
   - Create detalleVenta for each product
   - Decrement Producto.stock for each product (use Prisma atomic decrement)
   - Create movimientoInventario with tipo="SALIDA" for each product
   - All in a single transaction
3. Validate stock availability BEFORE creating the sale. If any product has insufficient stock, reject the entire sale
4. When a sale is annulled (only ADMIN can do this):
   - Set Venta.estado = "ANULADA"
   - Set Venta.motivoAnulacion (REQUIRED)
   - Increment Producto.stock back for each product
   - Create movimientoInventario with tipo="AJUSTE" and descripcion explaining the reversal

### Purchases (Compras)
1. When a purchase is registered:
   - Create Compra record
   - Create detalleCompra for each product
   - Increment Producto.stock for each product
   - Create movimientoInventario with tipo="ENTRADA" for each product
   - All in a single transaction

### Cash Register (Sesión de Caja)
1. A user can only have ONE open session at a time
2. Opening: Set montoInicial (starting cash amount)
3. Closing: Calculate montoFinal based on sales made during the session
4. All sales during a session are linked via idSesionCaja

### Stock Alerts
- When Producto.stock <= Producto.stockMinimo, flag the product as critical
- Show these alerts in the Dashboard and optionally in the sidebar

### Margin Calculation
- margen = ((precioVenta - costo) / precioVenta) * 100
- Recalculate whenever precioVenta or costo changes
- Display as percentage with 2 decimal places

## POS Interface (Most Important View)
The POS screen should have:
- LEFT side: Product search (by name, barcode, category) + product grid/list
- RIGHT side: Cart with selected items, quantities, subtotals
- BOTTOM RIGHT: Total, payment method selection, confirm sale button
- After confirming: Generate a printable receipt (nota de venta)
- The interface must be fast — optimized for cashier workflow with minimal clicks

## Dashboard KPIs
- Ventas totales del día/semana/mes
- Productos más vendidos (top 5)
- Productos con stock crítico
- Margen de ganancia promedio
- Número de transacciones del día
- Comparativa con período anterior

## Reports
- Ventas por período (día, semana, mes) with charts
- Estado actual del inventario (stock, valor total)
- Productos más vendidos por categoría
- Rentabilidad por producto y categoría
- Cierre de caja diario
