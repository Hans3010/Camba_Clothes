import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const ADMIN_ROUTES = [
  "/ventas",
  "/compras",
  "/proveedores",
  "/reportes",
  "/configuracion",
  "/inventario",
  "/categoria",
]

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const rol = req.nextauth.token?.rol

    const isAdminRoute = ADMIN_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    )

    if (isAdminRoute && rol !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/caja/:path*",
    "/ventas/:path*",
    "/productos/:path*",
    "/clientes/:path*",
    "/inventario/:path*",
    "/proveedores/:path*",
    "/compras/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
    "/categoria",
  ],
}
