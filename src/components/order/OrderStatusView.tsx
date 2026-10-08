"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Clock, FlaskConical, Loader2, MessageCircle, PackageCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RESERVATION_MINUTES, SITE } from "@/lib/constants";
import { ORDER_STATUS_META, PAYMENT_LABEL } from "@/lib/payments";
import { cn, formatCOP, formatDateTime, getTimeLeft, whatsappLink } from "@/lib/utils";
import type { Order } from "@/types/order";

const TIMELINE = ["Pedido recibido", "Pago confirmado", "Preparando", "En camino", "Entregado"];

function stepFor(order: Order) {
  switch (order.status) {
    case "pending":
      return 0;
    case "paid":
    case "cod_confirmed":
      return 2;
    case "shipped":
      return 3;
    case "delivered":
      return 4;
    default:
      return -1;
  }
}

function ReservationTimer({ createdAt }: { createdAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);
  if (now === null) return null;
  const t = getTimeLeft(new Date(createdAt).getTime() + RESERVATION_MINUTES * 60_000, now);
  return (
    <span className="font-semibold tabular-nums">
      {String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")}
    </span>
  );
}

export function OrderStatusView({ order, sandbox }: { order: Order; sandbox: boolean }) {
  const router = useRouter();
  const [simulating, setSimulating] = useState<"APPROVED" | "DECLINED" | null>(null);
  const meta = ORDER_STATUS_META[order.status];
  const step = stepFor(order);
  const success = order.status === "paid" || order.status === "cod_confirmed" || order.status === "shipped" || order.status === "delivered";
  const failed = order.status === "failed" || order.status === "expired" || order.status === "cancelled";

  const simulate = async (outcome: "APPROVED" | "DECLINED") => {
    setSimulating(outcome);
    const res = await fetch(`/api/orders/${order.reference}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    setSimulating(null);
    if (!res.ok) {
      toast.error("No se pudo simular el pago");
      return;
    }
    toast.success(outcome === "APPROVED" ? "Pago aprobado (sandbox)" : "Pago rechazado (sandbox)");
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className={cn(
            "mx-auto grid size-20 place-items-center rounded-full",
            success ? "bg-salvia-600 text-white" : failed ? "bg-orange-50 text-terracota" : "bg-amber-50 text-amber-900",
          )}
        >
          {success ? <Check className="size-9" strokeWidth={2.5} /> : failed ? <X className="size-9" /> : <Clock className="size-9" />}
        </motion.div>
        <p className="eyebrow mt-6 text-tinta-400">Pedido {order.reference}</p>
        <h1 className="mt-2 font-display text-5xl">
          {success ? `¡Gracias, ${order.customer.fullName.split(" ")[0]}!` : meta.label}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-tinta-500">{meta.description}</p>
        {order.status === "pending" && (
          <p className="mt-3 text-sm text-amber-900">
            Reserva activa por <ReservationTimer createdAt={order.created_at} />
          </p>
        )}
      </div>

      {sandbox && order.status === "pending" && (
        <div className="mx-auto mt-10 max-w-xl rounded-[2rem] border border-dashed border-amber-300 bg-amber-50/60 p-6 text-center">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-amber-900">
            <FlaskConical className="size-4" /> Checkout Wompi en modo sandbox
          </p>
          <p className="mt-2 text-sm text-amber-900/80">
            Configura <code>NEXT_PUBLIC_WOMPI_PUBLIC_KEY</code> y <code>WOMPI_INTEGRITY_SECRET</code> para redirigir al
            checkout real. Mientras tanto, simula la respuesta de {PAYMENT_LABEL[order.payment_method]}:
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Button variant="sage" onClick={() => simulate("APPROVED")} disabled={simulating !== null}>
              {simulating === "APPROVED" ? <Loader2 className="animate-spin" /> : <Check />} Aprobar pago
            </Button>
            <Button variant="outline" onClick={() => simulate("DECLINED")} disabled={simulating !== null}>
              {simulating === "DECLINED" ? <Loader2 className="animate-spin" /> : <X />} Rechazar
            </Button>
          </div>
        </div>
      )}

      {step >= 0 && (
        <ol className="mx-auto mt-12 grid max-w-3xl grid-cols-5 gap-2">
          {TIMELINE.map((label, i) => (
            <li key={label} className="text-center">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.15 * i, duration: 0.5 }}
                className={cn("h-1.5 origin-left rounded-full", i <= step ? "bg-salvia-500" : "bg-beige-200")}
              />
              <p className={cn("mt-2 text-[0.68rem] font-semibold", i <= step ? "text-tinta" : "text-tinta-400")}>{label}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 grid gap-6 md:grid-cols-[1.3fr_1fr]">
        <div className="rounded-[2rem] border border-border bg-white/70 p-6">
          <p className="font-display text-2xl">Tus piezas</p>
          <ul className="mt-4 space-y-3">
            {order.items.map((i) => (
              <li key={i.slug} className="flex items-center gap-3">
                <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden rounded-xl bg-beige-100">
                  {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{i.name}</p>
                  <p className="text-xs text-tinta-400">
                    {i.brand} · Talla {i.size}
                  </p>
                </div>
                <p className="font-semibold">{formatCOP(i.price)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-tinta-500">Subtotal</dt><dd>{formatCOP(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-tinta-500">Envío ({order.shipping.zone === "bogota" ? "Bogotá" : "nacional"})</dt><dd>{order.shipping_cost ? formatCOP(order.shipping_cost) : "Gratis"}</dd></div>
            {order.cod_fee > 0 && <div className="flex justify-between"><dt className="text-tinta-500">Recargo contra entrega</dt><dd>{formatCOP(order.cod_fee)}</dd></div>}
            <div className="flex justify-between border-t border-dashed border-border pt-2 text-base font-semibold"><dt>Total</dt><dd>{formatCOP(order.total)}</dd></div>
          </dl>
        </div>
        <div className="space-y-4">
          <div className="rounded-[2rem] border border-border bg-white/70 p-6 text-sm">
            <p className="flex items-center gap-2 font-semibold"><PackageCheck className="size-4 text-salvia-600" /> Entrega</p>
            <p className="mt-3 text-tinta-600">{order.customer.fullName}</p>
            <p className="text-tinta-500">{order.shipping.address}{order.shipping.neighborhood ? `, ${order.shipping.neighborhood}` : ""}</p>
            <p className="text-tinta-500">{order.shipping.city}, {order.shipping.department}</p>
            <p className="mt-3 rounded-xl bg-salvia-50 px-3 py-2 text-xs text-salvia-700">{order.shipping.eta}</p>
            <p className="mt-4 text-xs text-tinta-400">Pago: {PAYMENT_LABEL[order.payment_method]} · {formatDateTime(order.created_at)}</p>
          </div>
          <a
            href={whatsappLink(SITE.whatsapp, `Hola Mag&co, tengo una consulta sobre mi pedido ${order.reference}`)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-tinta px-6 py-3 text-sm font-semibold text-hueso transition hover:bg-tinta-700"
          >
            <MessageCircle className="size-4" /> Escríbenos por WhatsApp
          </a>
          <Link href="/catalogo" className="block text-center text-sm font-semibold underline underline-offset-4">
            Seguir explorando
          </Link>
        </div>
      </div>
    </div>
  );
}
