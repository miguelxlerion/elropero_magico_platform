"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Leaf, ShieldCheck, ShoppingBag, Trash2 } from "lucide-react";
import { ConditionBadge } from "@/components/product/ConditionBadge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { SHIPPING_RULES } from "@/lib/shipping";
import { formatCOP } from "@/lib/utils";

type Availability = { id: string; available: boolean; status: string };

export default function CarritoPage() {
  const { items, hydrated, remove, removeMany, subtotal, savings } = useCart();
  const [availability, setAvailability] = useState<Record<string, Availability>>({});
  const ids = items.map((i) => i.id).join(",");

  useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ids.split(",") }),
    })
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data: { items: Availability[] }) => {
        if (cancelled) return;
        setAvailability(Object.fromEntries(data.items.map((i) => [i.id, i])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [ids]);

  const unavailable = items.filter((i) => availability[i.id] && !availability[i.id].available);

  if (!hydrated) {
    return <div className="mx-auto min-h-[50vh] max-w-6xl px-4 py-16" />;
  }

  if (!items.length) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-28 text-center">
        <div className="grid size-20 place-items-center rounded-full bg-beige-100">
          <ShoppingBag className="size-7 text-tinta-500" />
        </div>
        <h1 className="mt-6 font-display text-5xl">Tu carrito está vacío</h1>
        <p className="mt-3 text-tinta-500">Cada pieza existe una sola vez. Cuando encuentres la tuya, no la dejes ir.</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/catalogo">Explorar catálogo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl">Tu carrito</h1>
      <p className="mt-2 text-tinta-500">
        {items.length} {items.length === 1 ? "pieza única" : "piezas únicas"} · se reservan al iniciar el pago
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          {unavailable.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm text-terracota">
              <AlertTriangle className="size-4" />
              <span className="flex-1">
                {unavailable.length === 1 ? "Una pieza ya no está disponible." : `${unavailable.length} piezas ya no están disponibles.`}
              </span>
              <Button size="sm" variant="outline" onClick={() => removeMany(unavailable.map((i) => i.id))}>
                Quitarlas
              </Button>
            </div>
          )}
          <ul className="divide-y divide-border border-y border-border">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const off = availability[item.id] && !availability[item.id].available;
                return (
                  <motion.li
                    key={item.id}
                    layout
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-5 py-6"
                  >
                    <Link href={`/producto/${item.slug}`} className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-2xl bg-beige-100 sm:w-32">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="128px" className={`object-cover ${off ? "grayscale" : ""}`} />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="eyebrow text-tinta-400">{item.brand}</p>
                          <Link href={`/producto/${item.slug}`} className="mt-1 block truncate font-display text-2xl hover:text-salvia-700">
                            {item.name}
                          </Link>
                          <p className="mt-1 text-sm text-tinta-500">Talla {item.size}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCOP(item.price)}</p>
                          {item.original_price && <p className="text-xs text-tinta-400 line-through">{formatCOP(item.original_price)}</p>}
                        </div>
                      </div>
                      <div className="mt-3">
                        <ConditionBadge condition={item.condition} score={item.condition_score} />
                      </div>
                      <div className="mt-auto flex items-center justify-between pt-3">
                        {off ? (
                          <span className="text-xs font-semibold text-terracota">
                            {availability[item.id].status === "sold" ? "Vendida" : "Reservada por otra persona"}
                          </span>
                        ) : (
                          <span className="text-xs text-salvia-700">Disponible · 1 de 1</span>
                        )}
                        <button type="button" onClick={() => remove(item.id)} className="inline-flex items-center gap-1.5 text-xs text-tinta-400 hover:text-terracota">
                          <Trash2 className="size-3.5" /> Quitar
                        </button>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        </div>

        <aside className="h-fit space-y-4 rounded-[2rem] border border-border bg-white/70 p-6 lg:sticky lg:top-32">
          <p className="font-display text-2xl">Resumen</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-tinta-500">Subtotal</span>
              <span className="font-semibold">{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-tinta-500">Envío</span>
              <span className="text-tinta-500">desde {formatCOP(SHIPPING_RULES.bogota.cost)}</span>
            </div>
          </div>
          {savings > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-salvia-50 p-3 text-xs text-salvia-700">
              <Leaf className="size-4" /> Ahorras {formatCOP(savings)} frente al precio original
            </p>
          )}
          <Button asChild size="lg" className="w-full" disabled={unavailable.length > 0}>
            <Link href={unavailable.length > 0 ? "#" : "/checkout"} aria-disabled={unavailable.length > 0}>
              Continuar al pago <ArrowRight />
            </Link>
          </Button>
          <p className="flex items-center justify-center gap-2 text-xs text-tinta-400">
            <ShieldCheck className="size-3.5" /> Pago seguro con Wompi · Bancolombia
          </p>
        </aside>
      </div>
    </div>
  );
}
