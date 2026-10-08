"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, Sparkles, Store } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/productos/nuevo", label: "Catalogar con IA", icon: Sparkles },
  { href: "/admin/drops", label: "Drops", icon: CalendarDays },
];

export function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="border-b border-border bg-hueso lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
        <div className="flex items-center justify-between lg:block">
          <Logo className="items-start" />
          <span className="rounded-full bg-tinta px-2.5 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-hueso lg:mt-3 lg:inline-block">
            Admin
          </span>
        </div>
        <nav className="no-scrollbar flex gap-1 overflow-x-auto lg:flex-col">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active ? "bg-tinta text-hueso" : "text-tinta-500 hover:bg-beige-100 hover:text-tinta",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
          <Link href="/" className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-tinta-500 hover:bg-beige-100 hover:text-tinta">
            <Store className="size-4" /> Ver tienda
          </Link>
        </nav>
        <div className="mt-auto hidden rounded-2xl bg-beige-100 p-4 text-sm lg:block">
          <p className="font-semibold">{user.name}</p>
          <p className="truncate text-xs text-tinta-500">{user.email}</p>
          <button type="button" onClick={logout} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-terracota">
            <LogOut className="size-3.5" /> Cerrar sesión
          </button>
        </div>
      </div>
    </aside>
  );
}
