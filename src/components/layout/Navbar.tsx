"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, LogOut, Menu, Search, ShoppingBag, User } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import type { DropSnapshot } from "@/types/drop";
import { DropCountdown } from "./DropCountdown";
import { Logo } from "./Logo";
import { ThemeSwitcher } from "./ThemeSwitcher";

type NavbarProps = {
  user: { name: string; role: "customer" | "admin" } | null;
  announcement: DropSnapshot | null;
  liveDropId: string | null;
};

export function Navbar({ user, announcement, liveDropId }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { count, setOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const links = [
    { href: "/catalogo", label: "Catálogo" },
    ...(liveDropId ? [{ href: `/drops/${liveDropId}`, label: "Drop en vivo" }] : []),
    { href: "/catalogo?categoria=accesorios&3d=1", label: "Probador 3D" },
    { href: "/drops", label: "Calendario" },
    { href: "/#historia", label: "Historia" },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUserMenu(false);
    router.push("/");
    router.refresh();
  };

  const messages = [
    announcement
      ? announcement.status === "upcoming"
        ? `Drop ${String(announcement.number).padStart(2, "0")} · ${announcement.name} — se revela en `
        : `Drop ${String(announcement.number).padStart(2, "0")} · ${announcement.name} está en vivo`
      : "Nuevos drops cada 15 días",
    "Envío el mismo día en Bogotá",
    "PSE · Nequi · Daviplata · Tarjeta · Contra entrega",
    "Cada pieza revisada en 23 puntos y medida en cm",
  ];

  return (
    <header className="sticky top-0 z-40">
      <div className="overflow-hidden bg-tinta text-hueso">
        <div className="flex w-max animate-marquee gap-12 whitespace-nowrap py-2 text-[0.7rem] font-medium tracking-[0.12em]">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex gap-12" aria-hidden={dup === 1}>
              {messages.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-12">
                  <span>
                    {m}
                    {i === 0 && announcement?.status === "upcoming" && (
                      <DropCountdown initialDrop={announcement} variant="inline" showNotify={false} className="font-semibold text-salvia-200" />
                    )}
                  </span>
                  <span className="text-salvia-300">✦</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <motion.nav
        initial={false}
        animate={{
          backgroundColor: scrolled
            ? "color-mix(in srgb, var(--color-hueso) 86%, transparent)"
            : "color-mix(in srgb, var(--color-hueso) 0%, transparent)",
          boxShadow: scrolled ? "0 10px 40px -24px rgba(21,20,18,0.35)" : "0 0 0 rgba(0,0,0,0)",
        }}
        transition={{ duration: 0.3 }}
        className={cn("border-b backdrop-blur-xl transition-colors", scrolled ? "border-border" : "border-transparent")}
      >
        <div className="mx-auto grid h-[4.5rem] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full hover:bg-beige-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="size-5" />
            </button>
            <ul className="hidden items-center gap-1 lg:flex">
              {links.map((link) => {
                const active = link.href === pathname || (link.href !== "/" && pathname.startsWith(link.href.split("?")[0]) && !link.href.includes("?"));
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "relative rounded-full px-3 py-2 text-[0.8rem] font-semibold tracking-wide text-tinta-500 transition-colors hover:text-tinta",
                        active && "text-tinta",
                      )}
                    >
                      {link.label}
                      {active && (
                        <motion.span layoutId="nav-underline" className="absolute inset-x-3 -bottom-0.5 h-px bg-tinta" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <Logo />

          <div className="flex items-center justify-end gap-1">
            <ThemeSwitcher className="mr-1 hidden md:inline-flex" />
            <Link href="/catalogo" className="hidden size-10 place-items-center rounded-full hover:bg-beige-100 sm:grid" aria-label="Buscar en el catálogo">
              <Search className="size-[1.15rem]" />
            </Link>
            <div className="relative">
              {user ? (
                <button
                  type="button"
                  onClick={() => setUserMenu((v) => !v)}
                  className="grid size-10 place-items-center rounded-full bg-beige-100 text-xs font-bold uppercase hover:bg-beige-200"
                  aria-label="Mi cuenta"
                >
                  {user.name.slice(0, 1)}
                </button>
              ) : (
                <Link href="/login" className="grid size-10 place-items-center rounded-full hover:bg-beige-100" aria-label="Ingresar">
                  <User className="size-[1.15rem]" />
                </Link>
              )}
              <AnimatePresence>
                {user && userMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl"
                  >
                    <p className="px-3 py-2 text-sm">
                      Hola, <strong>{user.name.split(" ")[0]}</strong>
                    </p>
                    {user.role === "admin" && (
                      <Link href="/admin/dashboard" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-beige-50">
                        <LayoutDashboard className="size-4" /> Panel admin
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-terracota hover:bg-orange-50"
                    >
                      <LogOut className="size-4" /> Cerrar sesión
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative grid size-10 place-items-center rounded-full hover:bg-beige-100"
              aria-label={`Abrir carrito (${count})`}
            >
              <ShoppingBag className="size-[1.15rem]" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    className="absolute -right-0.5 -top-0.5 grid size-5 place-items-center rounded-full bg-salvia-600 text-[0.62rem] font-bold text-white"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.nav>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-6">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <Logo className="mb-10 mt-2 items-start" />
          <ul className="space-y-1">
            {links.map((link, i) => (
              <motion.li key={link.href} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                <Link href={link.href} className="block py-3 font-display text-3xl" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              </motion.li>
            ))}
          </ul>
          <div className="mt-6">
            <p className="eyebrow mb-2 text-tinta-400">Paleta de la tienda</p>
            <ThemeSwitcher />
          </div>
          <div className="mt-auto space-y-2 border-t border-border pt-6 text-sm">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin/dashboard" className="block py-1.5 font-semibold">
                    Panel admin
                  </Link>
                )}
                <button type="button" onClick={logout} className="py-1.5 text-terracota">
                  Cerrar sesión
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block py-1.5 font-semibold">
                  Ingresar
                </Link>
                <Link href="/registro" className="block py-1.5 text-tinta-500">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
