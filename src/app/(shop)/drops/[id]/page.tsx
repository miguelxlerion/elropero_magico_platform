import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import { DropCountdown } from "@/components/layout/DropCountdown";
import { ProductCard } from "@/components/product/ProductCard";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/constants";
import { getAllDrops, getDropById, getDropProducts, toSnapshot } from "@/lib/queries";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

const pad = (n: number) => String(n).padStart(2, "0");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const drop = await getDropById(id);
  return drop
    ? { title: `Drop ${pad(drop.number)} · ${drop.name}`, description: drop.description }
    : { title: "Drop no encontrado" };
}

export default async function DropPage({ params }: Props) {
  const { id } = await params;
  const drop = await getDropById(id);
  if (!drop) notFound();
  const [products, allDrops] = await Promise.all([getDropProducts(drop.id), getAllDrops()]);
  const upcoming = drop.status === "upcoming";
  const sold = products.filter((p) => p.status === "sold").length;
  const available = products.filter((p) => p.status === "published").length;
  const sellThrough = products.length ? Math.round((sold / products.length) * 100) : 0;
  const others = allDrops.filter((d) => d.id !== drop.id);

  return (
    <div>
      <section className="relative isolate overflow-hidden bg-tinta text-hueso">
        {drop.cover_image && (
          <Image src={drop.cover_image} alt="" fill priority sizes="100vw" className="-z-10 object-cover opacity-45" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-tinta via-tinta/60 to-tinta/10" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-20 lg:pt-32">
          <Badge variant={upcoming ? "glass" : "sage"} className={cn(upcoming && "text-tinta")}>
            {upcoming ? "Próximo lanzamiento" : drop.status === "live" ? "En vivo ahora" : "Archivo"}
          </Badge>
          <p className="mt-6 font-display text-xl italic text-hueso/70">Drop {pad(drop.number)}</p>
          <h1 className="mt-1 font-display text-6xl font-medium leading-none sm:text-7xl lg:text-8xl">{drop.name}</h1>
          <p className="mt-5 max-w-2xl text-lg text-hueso/75">{drop.description}</p>
          <p className="mt-3 text-sm text-hueso/50">
            {drop.theme} · {upcoming ? "Se lanza el" : "Lanzado el"} {formatDate(drop.launch_date)}
          </p>
          {!upcoming && products.length > 0 && (
            <div className="mt-8 max-w-md">
              <div className="flex justify-between text-xs text-hueso/70">
                <span>{available} disponibles de {products.length}</span>
                <span>{sellThrough}% vendido</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15">
                <div className="h-full rounded-full bg-salvia-300" style={{ width: `${sellThrough}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {upcoming ? (
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-start">
            <div className="rounded-[2rem] border border-border bg-white/60 p-6 sm:p-8 lg:sticky lg:top-32">
              <p className="eyebrow text-salvia-600">Cuenta regresiva</p>
              <h2 className="mt-2 font-display text-3xl">Las piezas se revelan al llegar a cero</h2>
              <DropCountdown initialDrop={toSnapshot(drop)} variant="panel" className="mt-6" />
            </div>
            <div>
              <p className="mb-4 flex items-center gap-2 text-sm text-tinta-500">
                <Lock className="size-4" /> Avance de {products.length} piezas · detalles bloqueados hasta el lanzamiento
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.map((p) => (
                  <div key={p.id} className="group relative aspect-[3/4] overflow-hidden rounded-[1.25rem] bg-beige-100">
                    {p.images[0] && (
                      <Image src={p.images[0]} alt="" fill sizes="(min-width:640px) 20vw, 45vw" className="scale-110 object-cover blur-xl" />
                    )}
                    <div className="absolute inset-0 grid place-items-center bg-hueso/20">
                      <span className="rounded-full bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-tinta backdrop-blur">
                        {CATEGORY_LABELS[p.category]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} priority={i < 4} />
            ))}
          </div>
        ) : (
          <p className="text-center text-tinta-500">Este drop aún no tiene piezas publicadas.</p>
        )}

        {others.length > 0 && (
          <section className="mt-24">
            <h2 className="font-display text-3xl">Otros drops</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((d) => (
                <Link
                  key={d.id}
                  href={`/drops/${d.id}`}
                  className="group flex items-center justify-between rounded-2xl border border-border bg-white/60 p-5 transition hover:bg-white"
                >
                  <div>
                    <p className="text-xs text-tinta-400">
                      Drop {pad(d.number)} · {d.status === "upcoming" ? "Próximo" : d.status === "live" ? "En vivo" : "Archivo"}
                    </p>
                    <p className="font-display text-2xl">{d.name}</p>
                  </div>
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
