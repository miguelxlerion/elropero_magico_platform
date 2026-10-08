import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Bell, CalendarDays, Package, Receipt, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS } from "@/lib/constants";
import { ORDER_STATUS_META, PAYMENT_LABEL } from "@/lib/payments";
import { getDashboardData } from "@/lib/queries";
import { cn, formatCOP, formatShortDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard admin" };

const STATUS_PILL: Record<string, string> = {
  published: "bg-salvia-100 text-salvia-700",
  reserved: "bg-amber-50 text-amber-900",
  sold: "bg-tinta text-hueso",
  draft: "bg-beige-100 text-tinta-500",
};
const STATUS_LABEL: Record<string, string> = { published: "Publicado", reserved: "Reservado", sold: "Vendido", draft: "Borrador" };

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { kpis } = data;
  const maxCategory = Math.max(1, ...data.categories.map((c) => c.value));

  const cards = [
    { label: "Ventas confirmadas", value: formatCOP(kpis.revenue), hint: `${kpis.paidOrders} pedidos`, icon: TrendingUp },
    { label: "Ticket promedio", value: formatCOP(kpis.avgTicket), hint: `${kpis.pendingOrders} pagos pendientes`, icon: Receipt },
    { label: "Inventario publicado", value: String(kpis.published), hint: `${kpis.reserved} reservadas · ${kpis.sold} vendidas`, icon: Package },
    { label: "Lista de espera", value: String(kpis.subscribers), hint: "correo + WhatsApp", icon: Bell },
  ];

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-salvia-600">Panel de control</p>
          <h1 className="mt-2 font-display text-5xl">Buen día, equipo</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/drops">
              <CalendarDays /> Programar drop
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/productos/nuevo">
              <Sparkles /> Catalogar con IA
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-border bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tinta-400">{label}</p>
              <Icon className="size-4 text-salvia-600" />
            </div>
            <p className="mt-4 font-display text-4xl">{value}</p>
            <p className="mt-1 text-xs text-tinta-500">{hint}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-3xl border border-border bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Rendimiento por drop</h2>
            <Link href="/admin/drops" className="text-xs font-semibold underline underline-offset-4">Gestionar</Link>
          </div>
          <ul className="mt-6 space-y-5">
            {data.drops.map((d) => (
              <li key={d.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <p className="font-semibold">
                    Drop {String(d.number).padStart(2, "0")} · {d.name}
                    <span
                      className={cn(
                        "ml-2 rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider",
                        d.status === "live" ? "bg-salvia-100 text-salvia-700" : d.status === "upcoming" ? "bg-tinta text-hueso" : "bg-beige-100 text-tinta-500",
                      )}
                    >
                      {d.status === "live" ? "En vivo" : d.status === "upcoming" ? "Próximo" : "Finalizado"}
                    </span>
                  </p>
                  <p className="text-xs text-tinta-500">
                    {d.sold}/{d.total} vendidas · {d.subscribers} en lista de espera
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-beige-100">
                  <div className="h-full rounded-full bg-salvia-500" style={{ width: `${d.sellThrough}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-white p-6">
          <h2 className="font-display text-2xl">Inventario por categoría</h2>
          <ul className="mt-6 space-y-4">
            {data.categories.map((c) => (
              <li key={c.category} className="text-sm">
                <div className="flex justify-between">
                  <span>{CATEGORY_LABELS[c.category]}</span>
                  <span className="font-semibold">{c.value}</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-beige-100">
                  <div className="h-full rounded-full bg-tinta" style={{ width: `${(c.value / maxCategory) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-3xl border border-border bg-white">
          <h2 className="p-6 pb-4 font-display text-2xl">Pedidos recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-beige-50 text-left text-[0.65rem] uppercase tracking-[0.14em] text-tinta-400">
                <tr>
                  <th className="px-6 py-3">Referencia</th>
                  <th className="px-3 py-3">Cliente</th>
                  <th className="px-3 py-3">Pago</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-6 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((o) => (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-6 py-3">
                      <Link href={`/pedido/${o.reference}`} className="inline-flex items-center gap-1 font-mono text-xs font-semibold hover:underline">
                        {o.reference} <ArrowUpRight className="size-3" />
                      </Link>
                      <p className="text-[0.7rem] text-tinta-400">{formatShortDate(o.created_at)}</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium">{o.customer.fullName}</p>
                      <p className="text-[0.7rem] text-tinta-400">{o.shipping.city}</p>
                    </td>
                    <td className="px-3 py-3 text-tinta-500">{PAYMENT_LABEL[o.payment_method]}</td>
                    <td className="px-3 py-3 font-semibold">{formatCOP(o.total)}</td>
                    <td className="px-6 py-3">
                      <span className={cn("rounded-full px-2.5 py-1 text-[0.65rem] font-semibold", ORDER_STATUS_META[o.status].tone)}>
                        {ORDER_STATUS_META[o.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.recentOrders.length && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-tinta-400">Aún no hay pedidos.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-white p-6">
          <h2 className="font-display text-2xl">Últimas prendas</h2>
          <ul className="mt-4 divide-y divide-border">
            {data.recentProducts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <div className="relative aspect-[3/4] w-10 shrink-0 overflow-hidden rounded-lg bg-beige-100">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-tinta-400">{p.brand} · {formatCOP(p.price)}</p>
                </div>
                <span className={cn("rounded-full px-2 py-0.5 text-[0.62rem] font-semibold", STATUS_PILL[p.status])}>
                  {STATUS_LABEL[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
