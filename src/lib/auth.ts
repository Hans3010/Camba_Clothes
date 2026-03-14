import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        usuario: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.usuario || !credentials?.password) return null

        let user
        try {
          user = await prisma.usuario.findUnique({
            where: { usuario: credentials.usuario },
            include: { tipoUsuario: true },
          })
          console.log("[auth] user found:", user ? user.usuario : "null")
        } catch (e) {
          console.error("[auth] DB error:", e)
          return null
        }

        if (!user || user.estado !== "ACTIVO") {
          console.log("[auth] user not found or inactive")
          return null
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)
        console.log("[auth] passwordMatch:", passwordMatch)
        if (!passwordMatch) return null

        return {
          id: user.id,
          usuario: user.usuario,
          rol: user.tipoUsuario.rol,
          idTipoUsuario: user.idTipoUsuario,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as unknown as number
        token.usuario = user.usuario
        token.rol = user.rol
        token.idTipoUsuario = user.idTipoUsuario
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.usuario = token.usuario
      session.user.rol = token.rol
      session.user.idTipoUsuario = token.idTipoUsuario
      return session
    },
  },
}
