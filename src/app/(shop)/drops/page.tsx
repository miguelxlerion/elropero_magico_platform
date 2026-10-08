import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SITE } from "@/lib/constants";
import { getAllDrops } from "@/lib/queries";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calendario de drops",
  description: "Colecciones limitadas de moda de segunda mano cada 15 días.",
};

const pad = (n: number) => String(n).padStart(2, "0");

export default async function DropsPage() {
  const drops = await getAllDrops();
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="max-w-2xl">
        <p className="eyebrow text-salvia-600">Calendario</p>
        <h1 className="mt-3 font-display text-5xl sm:text-6xl">Un drop cada {SITE.dropCadenceDays} días</h1>
        <p className="mt-4 text-tinta-500">
          Colecciones pequeñas, curadas alrededor de un tema. Se lanzan los viernes a las 7:00 p. m. (hora Bogotá) y
          cada pieza existe una sola vez.
        </p>
      </header>
      <ol className="relative mt-14 space-y-6 border-l border-border pl-8">
        {drops.map((d) => (
          <li key={d.id} className="relative">
            <span className="absolute -left-[2.45rem] top-8 grid size-5 place-items-center rounded-full border-4 border-hueso bg-salvia-500" />
            <Link
              href={`/drops/${d.id}`}
              className="group grid overflow-hidden rounded-[2rem] border border-border bg-white/60 transition hover:bg-white hover:shadow-[0_30px_60px_-40px_rgba(21,20,18,0.4)] sm:grid-cols-[220px_1fr]"
            >
              <div className="relative aspect-[16/10] sm:aspect-auto">
                {d.cover_image && (
                  <Image
                    src={d.cover_image}
                    alt=""
                    fill
                    sizes="220px"
                    className={`object-cover transition duration-700 group-hover:scale-105 ${d.status === "upcoming" ? "blur-sm" : ""}`}
                  />
                )}
              </div>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={d.status === "live" ? "sage" : d.status === "upcoming" ? "default" : "beige"}>
                    {d.status === "live" ? "En vivo" : d.status === "upcoming" ? "Próximo" : "Archivo"}
                  </Badge>
                  <span className="inline-flex items-center gap-1.5 text-xs capitalize text-tinta-500">
                    <CalendarDays className="size-3.5" /> {formatDateTime(d.launch_date)}
                  </span>
                </div>
                <p className="mt-3 font-display text-3xl">
                  Drop {pad(d.number)} · {d.name}
                </p>
                <p className="mt-1 text-sm text-tinta-500">{d.theme}</p>
                <p className="mt-3 text-xs text-tinta-400">{d.product_ids.length} piezas</p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
