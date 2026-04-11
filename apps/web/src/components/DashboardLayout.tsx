"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Boxes,
  ClipboardList,
  ShoppingCart,
  Layers,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Locations", href: "/dashboard/locations", icon: MapPin },
  { label: "Inventory", href: "/dashboard/inventory", icon: Boxes },
  { label: "Purchase Orders", href: "/dashboard/purchase-orders", icon: ClipboardList },
  { label: "Sales Orders", href: "/dashboard/sales-orders", icon: ShoppingCart },
  { label: "Wave Picks", href: "/dashboard/wave-picks", icon: Layers },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-2 border-r border-white/20 px-4 py-6 glass-sidebar crystalline-edge">
        <div className="mb-6 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img src="/logo.png" alt="Kratos" className="h-10 w-auto" />
            <div>
              <h3 className="text-sm font-bold leading-tight font-[family-name:var(--font-headline)]">
                Kratos WMS
              </h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                Trade Hero AU
              </p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all",
                  isActive
                    ? "border-r-4 border-tertiary bg-primary/10 font-bold text-primary"
                    : "text-on-surface-variant hover:bg-white/40 hover:pl-6",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-white/20 pt-4">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-primary transition-all"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          <button className="flex w-full items-center gap-3 px-4 py-2 text-sm text-on-surface-variant hover:text-error transition-all">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
