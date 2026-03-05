"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Tag,
  Users,
  ArrowUpDown,
  Truck,
  ShoppingBag,
  BarChart3,
  Settings,
  Vault,
  ShoppingBag as BrandIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavLink = { kind: "link"; href: string; label: string; icon: React.ElementType }
type NavSection = { kind: "section"; label: string }
type NavEntry = NavLink | NavSection

const navEntries: NavEntry[] = [
  { kind: "link",    href: "/dashboard",     label: "Dashboard",        icon: LayoutDashboard },

  { kind: "section", label: "Operaciones" },
  { kind: "link",    href: "/pos",           label: "Punto de Venta",   icon: ShoppingCart },
  { kind: "link",    href: "/caja",          label: "Caja",             icon: Vault },

  { kind: "section", label: "Registros" },
  { kind: "link",    href: "/ventas",        label: "Historial",        icon: Receipt },

  { kind: "section", label: "Catálogo" },
  { kind: "link",    href: "/productos",     label: "Productos",        icon: Package },
  { kind: "link",    href: "/categoria",     label: "Categorías",       icon: Tag },
  { kind: "link",    href: "/clientes",      label: "Clientes",         icon: Users },

  { kind: "section", label: "Abastecimiento" },
  { kind: "link",    href: "/proveedores",   label: "Proveedores",      icon: Truck },
  { kind: "link",    href: "/compras",       label: "Compras",          icon: ShoppingBag },

  { kind: "section", label: "Control" },
  { kind: "link",    href: "/inventario",    label: "Movimientos",      icon: ArrowUpDown },
  { kind: "link",    href: "/reportes",      label: "Reportes",         icon: BarChart3 },

  { kind: "section", label: "Sistema" },
  { kind: "link",    href: "/configuracion", label: "Configuración",    icon: Settings },
]

function NavContent() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto">
      {navEntries.map((entry, i) => {
        if (entry.kind === "section") {
          return (
            <p
              key={i}
              className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 first:pt-0"
            >
              {entry.label}
            </p>
          )
        }

        const isActive = pathname === entry.href || pathname.startsWith(entry.href + "/")
        return (
          <Link
            key={entry.href}
            href={entry.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors mb-0.5",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <entry.icon className="h-4 w-4 shrink-0" />
            {entry.label}
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
