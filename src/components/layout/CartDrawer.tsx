"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Leaf, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/hooks/useCart";
import { SHIPPING_RULES } from "@/lib/shipping";
import { formatCOP } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, setOpen, remove, subtotal, savings, count } = useCart();
  const toFree = Math.max(0, SHIPPING_RULES.freeBogotaFrom - subtotal);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Tu ropero</SheetTitle>
          <SheetDescription>
            {count === 0 ? "Aún no has elegido piezas." : `${count} ${count === 1 ? "pieza única" : "piezas únicas"}`}
          </SheetDescription>
        </SheetHeader>

        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-beige-100">
              <ShoppingBag className="size-6 text-tinta-500" />
            </div>
            <p className="font-display text-2xl">Tu carrito está vacío</p>
            <p className="max-w-xs text-sm text-tinta-500">
              Cada prenda existe una sola vez. Cuando encuentres la tuya, no la dejes ir.
            </p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/catalogo">Explorar catálogo</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="border-b border-border bg-salvia-50 px-6 py-3 text-xs text-salvia-700">
              {toFree > 0 ? (
                <>
                  Te faltan <strong>{formatCOP(toFree)}</strong> para envío gratis en Bogotá
                </>
              ) : (
                <strong>¡Tienes envío gratis en Bogotá! 🎉</strong>
              )}
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-salvia-100">
                <motion.div
                  className="h-full bg-salvia-500"
                  initial={false}
                  animate={{ width: `${Math.min(100, (subtotal / SHIPPING_RULES.freeBogotaFrom) * 100)}%` }}
                />
              </div>
            </div>
            <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <motion.li
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                    className="flex gap-4"
                  >
                    <Link
                      href={`/producto/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded-xl bg-beige-100"
                    >
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <p className="eyebrow truncate text-tinta-400">{item.brand}</p>
                      <p className="truncate font-display text-lg leading-tight">{item.name}</p>
                      <p className="text-xs text-tinta-500">Talla {item.size} · Estado {item.condition_score}/10</p>
                      <div className="mt-auto flex items-center justify-between pt-1">
                        <span className="text-sm font-semibold">{formatCOP(item.price)}</span>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          className="inline-flex items-center gap-1 text-xs text-tinta-400 transition hover:text-terracota"
                        >
                          <X className="size-3" /> Quitar
                        </button>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <div className="space-y-3 border-t border-border px-6 py-5">
              <div className="flex justify-between text-sm">
                <span className="text-tinta-500">Subtotal</span>
                <span className="font-semibold">{formatCOP(subtotal)}</span>
              </div>
              {savings > 0 && (
                <p className="flex items-center gap-2 text-xs text-salvia-700">
                  <Leaf className="size-3.5" /> Ahorras {formatCOP(savings)} frente al precio original
                </p>
              )}
              <p className="text-xs text-tinta-400">Envío y método de pago se calculan en el checkout.</p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/carrito">Ver carrito</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/checkout">
                    Pagar <ArrowRight />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
