"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Leaf, ShieldCheck } from "lucide-react";
import type { OrderTotals } from "@/lib/shipping";
import { formatCOP } from "@/lib/utils";
import type { CartItem, PaymentMethod } from "@/types/order";

function Line({ label, value, hint, strong }: { label: string; value: React.ReactNode; hint?: string; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className={strong ? "font-semibold" : "text-tinta-500"}>{label}</p>
        {hint && <p className="text-[0.7rem] text-tinta-400">{hint}</p>}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className={strong ? "font-display text-3xl font-semibold" : "font-semibold"}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function OrderSummary({
  items,
  totals,
  method,
  savings,
}: {
  items: CartItem[];
  totals: OrderTotals;
  method: PaymentMethod;
  savings: number;
}) {
  return (
    <div className="space-y-5 rounded-[2rem] border border-border bg-white/70 p-6">
      <p className="font-display text-2xl">Resumen del pedido</p>
      <ul className="space-y-3">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3">
            <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded-lg bg-beige-100">
              {i.image && <Image src={i.image} alt="" fill sizes="48px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{i.name}</p>
              <p className="text-xs text-tinta-400">
                {i.brand} · Talla {i.size}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatCOP(i.price)}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-3 border-t border-border pt-4 text-sm">
        <Line label={`Subtotal (${items.length} ${items.length === 1 ? "pieza" : "piezas"})`} value={formatCOP(totals.subtotal)} />
        <Line
          label={totals.quote.zone === "bogota" ? "Envío Bogotá" : "Envío nacional"}
          hint={totals.quote.eta}
          value={totals.quote.freeApplied ? "Gratis" : formatCOP(totals.shipping)}
        />
        {method === "cod" && (
          <Line label="Recargo contra entrega" hint="Manejo de efectivo de la transportadora" value={formatCOP(totals.codFee)} />
        )}
        <div className="border-t border-dashed border-border pt-3">
          <Line label="Total" value={formatCOP(totals.total)} strong />
          <p className="mt-1 text-[0.7rem] text-tinta-400">Precio final en pesos colombianos. Sin costos ocultos.</p>
        </div>
      </div>

      {savings > 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-salvia-50 p-3 text-xs text-salvia-700">
          <Leaf className="size-4 shrink-0" /> Estás ahorrando {formatCOP(savings)} frente al precio original de estas piezas.
        </p>
      )}
      <p className="flex items-center justify-center gap-2 text-xs text-tinta-400">
        <ShieldCheck className="size-3.5" /> Pagos procesados por Wompi · Bancolombia
      </p>
    </div>
  );
}
