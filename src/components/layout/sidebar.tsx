"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Warehouse,
  Truck,
  ShoppingBag,
  BarChart3,
  Settings,
  Vault,
  ShoppingBag as BrandIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard",     label: "Dashboard",     icon: LayoutDashboard },
  { href: "/caja",          label: "Caja",           icon: Vault },
  { href: "/pos",           label: "POS",            icon: ShoppingCart },
  { href: "/ventas",        label: "Ventas",         icon: Receipt },
  { href: "/categoria",        label: "Categoria",         icon: Receipt },
  { href: "/productos",     label: "Productos",      icon: Package },
  { href: "/clientes",      label: "Clientes",       icon: Users },
  { href: "/inventario",    label: "Inventario",     icon: Warehouse },
  { href: "/proveedores",   label: "Proveedores",    icon: Truck },
  { href: "/compras",       label: "Compras",        icon: ShoppingBag },
  { href: "/reportes",      label: "Reportes",       icon: BarChart3 },
  { href: "/configuracion", label: "Configuración",  icon: Settings },
]

function NavContent() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 h-screen border-r bg-background shrink-0">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <BrandIcon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-bold leading-none">CambaClothes</p>
          <p className="text-xs text-muted-foreground">Sistema POS</p>
        </div>
      </div>
      <NavContent />
    </aside>
  )
}

export function MobileSidebarContent() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <BrandIcon className="h-5 w-5 text-primary" />
        <div>
          <p className="text-sm font-bold leading-none">CambaClothes</p>
          <p className="text-xs text-muted-foreground">Sistema POS</p>
        </div>
      </div>
      <NavContent />
    </div>
  )
}
