import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/pos/:path*",
    "/ventas/:path*",
    "/productos/:path*",
    "/clientes/:path*",
    "/inventario/:path*",
    "/proveedores/:path*",
    "/compras/:path*",
    "/reportes/:path*",
    "/configuracion/:path*",
    "/caja/:path*",
  ],
}
