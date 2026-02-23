import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Iniciando seed de CambaClothes...")

  // ──────────────────────────────────────────────
  // 1. TIPOS DE USUARIO
  // ──────────────────────────────────────────────
  const tipoAdmin = await prisma.tipoUsuario.upsert({
    where: { rol: "ADMIN" },
    update: {},
    create: { rol: "ADMIN" },
  })

  const tipoVendedor = await prisma.tipoUsuario.upsert({
    where: { rol: "VENDEDOR" },
    update: {},
    create: { rol: "VENDEDOR" },
  })

  console.log("✅ Tipos de usuario creados")

  // ──────────────────────────────────────────────
  // 2. USUARIOS
  // ──────────────────────────────────────────────
  const hashAdmin = await bcrypt.hash("admin123", 10)
  const hashVendedor = await bcrypt.hash("vendedor123", 10)

  await prisma.usuario.upsert({
    where: { usuario: "admin" },
    update: {},
    create: {
      idTipoUsuario: tipoAdmin.id,
      usuario: "admin",
      password: hashAdmin,
      estado: "ACTIVO",
    },
  })

  await prisma.usuario.upsert({
    where: { usuario: "vendedor" },
    update: {},
    create: {
      idTipoUsuario: tipoVendedor.id,
      usuario: "vendedor",
      password: hashVendedor,
      estado: "ACTIVO",
    },
  })

  console.log("✅ Usuarios creados (admin / vendedor)")

  // ──────────────────────────────────────────────
  // 3. CATEGORÍAS DE PRODUCTO
  // ──────────────────────────────────────────────
  const categorias = await Promise.all([
    prisma.categoriaProducto.upsert({
      where: { id: 1 },
      update: {},
      create: { nombreCategoria: "Camisa", descripcion: "Camisas y blusas para dama y caballero" },
    }),
    prisma.categoriaProducto.upsert({
      where: { id: 2 },
      update: {},
      create: { nombreCategoria: "Pantalón", descripcion: "Pantalones de vestir, jeans y casuales" },
    }),
    prisma.categoriaProducto.upsert({
      where: { id: 3 },
      update: {},
      create: { nombreCategoria: "Vestido", descripcion: "Vestidos de noche, casual y formal" },
    }),
    prisma.categoriaProducto.upsert({
      where: { id: 4 },
      update: {},
      create: { nombreCategoria: "Calzado", descripcion: "Zapatos, sandalias, botas y tenis" },
    }),
    prisma.categoriaProducto.upsert({
      where: { id: 5 },
      update: {},
      create: { nombreCategoria: "Accesorio", descripcion: "Carteras, cinturones, pañuelos y joyería" },
    }),
  ])

  console.log("✅ 5 categorías creadas")

  // ──────────────────────────────────────────────
  // 4. PROVEEDORES
  // ──────────────────────────────────────────────
  await prisma.proveedor.upsert({
    where: { id: 1 },
    update: {},
    create: {
      nombreEmpresa: "Textiles del Oriente S.R.L.",
      representante: "Carlos Mendoza",
      telefono: "76543210",
      correo: "ventas@textilesOriente.com.bo",
      ubicacion: "Av. Cañoto #234, Santa Cruz",
    },
  })

  await prisma.proveedor.upsert({
    where: { id: 2 },
    update: {},
    create: {
      nombreEmpresa: "Modas Importadas Bolivia",
      representante: "Ana Flores",
      telefono: "72198345",
      correo: "contacto@modasbolivia.com",
      ubicacion: "Calle Libertad #89, Santa Cruz",
    },
  })

  await prisma.proveedor.upsert({
    where: { id: 3 },
    update: {},
    create: {
      nombreEmpresa: "Distribuidora Chic Fashion",
      representante: "Roberto Vargas",
      telefono: "69871234",
      correo: "rvargas@chicfashion.bo",
      ubicacion: "Mercado Los Pozos, Santa Cruz",
    },
  })

  console.log("✅ 3 proveedores creados")

  // ──────────────────────────────────────────────
  // 5. TIPOS DE PAGO
  // ──────────────────────────────────────────────
  await prisma.tipoPago.upsert({
    where: { tipoMetodo: "EFECTIVO" },
    update: {},
    create: { tipoMetodo: "EFECTIVO", moneda: "BOB" },
  })

  await prisma.tipoPago.upsert({
    where: { tipoMetodo: "TARJETA" },
    update: {},
    create: { tipoMetodo: "TARJETA", moneda: "BOB" },
  })

  await prisma.tipoPago.upsert({
    where: { tipoMetodo: "QR" },
    update: {},
    create: { tipoMetodo: "QR", moneda: "BOB" },
  })

  console.log("✅ 3 tipos de pago creados")

  // ──────────────────────────────────────────────
  // 6. PRODUCTOS (10 variados con precios en BOB)
  // margen = ((precioVenta - costo) / precioVenta) * 100
  // ──────────────────────────────────────────────
  const [catCamisa, catPantalon, catVestido, catCalzado, catAccesorio] = categorias

  const productos = [
    {
      idCategoriaProducto: catCamisa.id,
      nombreProducto: "Camisa Oxford Slim Fit",
      marca: "Zara Man",
      talla: "M",
      color: "Blanco",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 189.0,
      costo: 95.0,
      margen: parseFloat((((189.0 - 95.0) / 189.0) * 100).toFixed(2)),
      stock: 25,
      stockMinimo: 5,
    },
    {
      idCategoriaProducto: catCamisa.id,
      nombreProducto: "Blusa Floral Manga Corta",
      marca: "Mango",
      talla: "S",
      color: "Rosa",
      temporada: "VERANO" as const,
      precioVenta: 149.0,
      costo: 70.0,
      margen: parseFloat((((149.0 - 70.0) / 149.0) * 100).toFixed(2)),
      stock: 18,
      stockMinimo: 4,
    },
    {
      idCategoriaProducto: catPantalon.id,
      nombreProducto: "Jean Skinny Mujer",
      marca: "Levi's",
      talla: "28",
      color: "Azul Oscuro",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 320.0,
      costo: 160.0,
      margen: parseFloat((((320.0 - 160.0) / 320.0) * 100).toFixed(2)),
      stock: 15,
      stockMinimo: 5,
    },
    {
      idCategoriaProducto: catPantalon.id,
      nombreProducto: "Pantalón Chino Hombre",
      marca: "H&M",
      talla: "32",
      color: "Beige",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 275.0,
      costo: 130.0,
      margen: parseFloat((((275.0 - 130.0) / 275.0) * 100).toFixed(2)),
      stock: 3,
      stockMinimo: 5,
    },
    {
      idCategoriaProducto: catVestido.id,
      nombreProducto: "Vestido Midi Floral",
      marca: "Zara",
      talla: "M",
      color: "Verde",
      temporada: "PRIMAVERA" as const,
      precioVenta: 380.0,
      costo: 185.0,
      margen: parseFloat((((380.0 - 185.0) / 380.0) * 100).toFixed(2)),
      stock: 10,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catVestido.id,
      nombreProducto: "Vestido Noche Sin Mangas",
      marca: "Pull&Bear",
      talla: "S",
      color: "Negro",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 450.0,
      costo: 210.0,
      margen: parseFloat((((450.0 - 210.0) / 450.0) * 100).toFixed(2)),
      stock: 2,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catCalzado.id,
      nombreProducto: "Zapatilla Running Nike",
      marca: "Nike",
      talla: "40",
      color: "Blanco/Negro",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 650.0,
      costo: 380.0,
      margen: parseFloat((((650.0 - 380.0) / 650.0) * 100).toFixed(2)),
      stock: 8,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catCalzado.id,
      nombreProducto: "Sandalia Taco Aguja",
      marca: "Aldo",
      talla: "37",
      color: "Nude",
      temporada: "VERANO" as const,
      precioVenta: 420.0,
      costo: 200.0,
      margen: parseFloat((((420.0 - 200.0) / 420.0) * 100).toFixed(2)),
      stock: 6,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catAccesorio.id,
      nombreProducto: "Cartera de Cuero Pequeña",
      marca: "Coach",
      talla: "Única",
      color: "Café",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 280.0,
      costo: 120.0,
      margen: parseFloat((((280.0 - 120.0) / 280.0) * 100).toFixed(2)),
      stock: 12,
      stockMinimo: 4,
    },
    {
      idCategoriaProducto: catAccesorio.id,
      nombreProducto: "Cinturón Cuero Trenzado",
      marca: "Genérico",
      talla: "M",
      color: "Negro",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 95.0,
      costo: 40.0,
      margen: parseFloat((((95.0 - 40.0) / 95.0) * 100).toFixed(2)),
      stock: 20,
      stockMinimo: 5,
    },
    // Productos 11–15
    {
      idCategoriaProducto: catCamisa.id,
      nombreProducto: "Camisa Lino Casual",
      marca: "Reserved",
      talla: "L",
      color: "Celeste",
      temporada: "VERANO" as const,
      precioVenta: 210.0,
      costo: 105.0,
      margen: parseFloat((((210.0 - 105.0) / 210.0) * 100).toFixed(2)),
      stock: 14,
      stockMinimo: 4,
    },
    {
      idCategoriaProducto: catPantalon.id,
      nombreProducto: "Jogger Deportivo",
      marca: "Adidas",
      talla: "M",
      color: "Gris",
      temporada: "TODO_EL_ANNO" as const,
      precioVenta: 290.0,
      costo: 140.0,
      margen: parseFloat((((290.0 - 140.0) / 290.0) * 100).toFixed(2)),
      stock: 9,
      stockMinimo: 4,
    },
    {
      idCategoriaProducto: catVestido.id,
      nombreProducto: "Vestido Verano Estampado",
      marca: "Bershka",
      talla: "M",
      color: "Amarillo",
      temporada: "VERANO" as const,
      precioVenta: 340.0,
      costo: 155.0,
      margen: parseFloat((((340.0 - 155.0) / 340.0) * 100).toFixed(2)),
      stock: 4,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catCalzado.id,
      nombreProducto: "Bota Cuero Mujer",
      marca: "Steve Madden",
      talla: "38",
      color: "Marrón",
      temporada: "OTONO" as const,
      precioVenta: 580.0,
      costo: 310.0,
      margen: parseFloat((((580.0 - 310.0) / 580.0) * 100).toFixed(2)),
      stock: 2,
      stockMinimo: 3,
    },
    {
      idCategoriaProducto: catAccesorio.id,
      nombreProducto: "Gorro Lana Tejido",
      marca: "Genérico",
      talla: "Única",
      color: "Vino",
      temporada: "INVIERNO" as const,
      precioVenta: 75.0,
      costo: 30.0,
      margen: parseFloat((((75.0 - 30.0) / 75.0) * 100).toFixed(2)),
      stock: 30,
      stockMinimo: 8,
    },
  ]

  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { id: productos.indexOf(producto) + 1 },
      update: {},
      create: {
        ...producto,
        precioVenta: producto.precioVenta,
        costo: producto.costo,
        margen: producto.margen,
        estado: "ACTIVO",
      },
    })
  }

  console.log("✅ 15 productos creados")
  console.log("\n🎉 Seed completado exitosamente!")
  console.log("─────────────────────────────────────")
  console.log("  Usuario ADMIN    → usuario: admin    | password: admin123")
  console.log("  Usuario VENDEDOR → usuario: vendedor | password: vendedor123")
  console.log("─────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
