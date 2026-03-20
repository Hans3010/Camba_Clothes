"use client"

import { useSession } from "next-auth/react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Vault, Receipt, Package, TrendingUp, DollarSign, BarChart3 } from "lucide-react"
import { TabSesiones } from "@/components/modules/reportes/tab-sesiones"
import { TabVentasPeriodo } from "@/components/modules/reportes/tab-ventas-periodo"
import { TabInventario } from "@/components/modules/reportes/tab-inventario"
import { TabTopProductos } from "@/components/modules/reportes/tab-top-productos"
import { TabRentabilidad } from "@/components/modules/reportes/tab-rentabilidad"
import { TabCMI } from "@/components/modules/reportes/tab-cmi"

export default function ReportesPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.rol === "ADMIN"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reportes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? "Panel de reportes y análisis del negocio" : "Tu historial de sesiones de caja"}
        </p>
      </div>

      <Tabs defaultValue="sesiones">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="sesiones">
            <Vault className="h-4 w-4 mr-2" />
            Sesiones
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="ventas">
                <Receipt className="h-4 w-4 mr-2" />
                Ventas
              </TabsTrigger>
              <TabsTrigger value="inventario">
                <Package className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="top">
                <TrendingUp className="h-4 w-4 mr-2" />
                Top Productos
              </TabsTrigger>
              <TabsTrigger value="rentabilidad">
                <DollarSign className="h-4 w-4 mr-2" />
                Rentabilidad
              </TabsTrigger>
              <TabsTrigger value="cmi">
                <BarChart3 className="h-4 w-4 mr-2" />
                CMI
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="sesiones" className="mt-4">
          <TabSesiones isAdmin={isAdmin} />
        </TabsContent>

        {isAdmin && (
          <>
            <TabsContent value="ventas" className="mt-4">
              <TabVentasPeriodo />
            </TabsContent>
            <TabsContent value="inventario" className="mt-4">
              <TabInventario />
            </TabsContent>
            <TabsContent value="top" className="mt-4">
              <TabTopProductos />
            </TabsContent>
            <TabsContent value="rentabilidad" className="mt-4">
              <TabRentabilidad />
            </TabsContent>
            <TabsContent value="cmi" className="mt-4">
              <TabCMI />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}
