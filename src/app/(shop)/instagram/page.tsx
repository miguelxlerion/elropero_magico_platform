import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Rss, Sparkles, UserCog } from "lucide-react";
import { InstagramProfileCard } from "@/components/instagram/InstagramProfileCard";
import { InstagramSection } from "@/components/instagram/InstagramSection";
import { Button } from "@/components/ui/button";
import { INSTAGRAM_HANDLE, getInstagramFeed } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Instagram",
  description:
    "Reels y fotos de El Ropero Mag&co: las piezas que llegan al ropero, probadores y detrás de cámaras, directo desde Instagram.",
  openGraph: {
    title: "Instagram de El Ropero Mag&co",
    description: "Reels y fotos del ropero: prendas que llegan cada semana, probadores y detrás de cámaras.",
    url: `${siteUrl}/instagram`,
  },
};

const SETUP_STEPS = [
  {
    icon: UserCog,
    title: "Cuenta Business o Creador",
    body: "Behold solo puede leer cuentas de Instagram Business o Media Creator. Cambiar el tipo de cuenta es gratis y se hace desde la app de Instagram, en Configuración → Cuenta.",
  },
  {
    icon: Sparkles,
    title: "Crear el feed en Behold",
    body: "En app.behold.so conectas la cuenta, eliges cuántas publicaciones y qué tipos mostrar (fotos, reels, videos y carruseles) y guardas el feed.",
  },
  {
    icon: Rss,
    title: "Pegar la URL del feed JSON",
    body: "En el feed abres «Embed code» y copias la URL de JSON feed (forma https://feeds.behold.so/XXXX). Va en .env.local como BEHOLD_FEED_URL; se lee desde el servidor, no queda expuesta en el navegador.",
  },
];

export default async function InstagramPage() {
  const feed = await getInstagramFeed();
  const items = feed?.items.slice(0, 12) ?? [];
  const profile = feed?.profile ?? null;
  const handle = profile?.username ?? INSTAGRAM_HANDLE;

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow eyebrow-line text-rosa-600">@{handle}</p>
          <h1 className="mt-4 font-display text-5xl sm:text-6xl">
            Lo que pasa <em className="italic">en el ropero</em>
          </h1>
          <p className="mt-5 text-tinta-500">
            Reels de las prendas que llegan, probadores reales y el detrás de cámaras de cada drop. Aquí se reproduce
            lo mismo que publicamos en Instagram, sin salir de la tienda.
          </p>
          {profile && (
            <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-tinta-500">
              {profile.avatar && (
                // La URL del avatar la decide Behold y cambia de host según el origen; con
                // images.unoptimized, next/image la sirve directa sin depender de remotePatterns.
                <Image src={profile.avatar} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
              )}
              <span>
                <strong className="font-semibold text-tinta">{profile.followers.toLocaleString("es-CO")}</strong>{" "}
                seguidores
                {profile.biography ? ` · ${profile.biography.slice(0, 80)}` : ""}
              </span>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <InstagramProfileCard handle={handle} />
          <a
            href={`https://www.instagram.com/${handle}/`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2 text-sm font-semibold text-hueso transition-colors hover:bg-tinta-700"
          >
            Seguir la cuenta <ArrowUpRight className="size-4" />
          </a>
        </div>
      </header>

      {items.length > 0 ? (
        <InstagramSection items={items} handle={handle} />
      ) : (
        <section className="mt-12 overflow-hidden rounded-[2rem] border border-border bg-white/60 p-8 sm:p-10">
          <div className="max-w-3xl">
            <p className="eyebrow text-tinta-400">Pendiente de conectar</p>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl">La rejilla se carga con Behold</h2>
            <p className="mt-4 text-tinta-500">
              Behold se conecta a la cuenta de Instagram y nos devuelve un feed JSON con las fotos, reels y carruseles
              ya normalizados. Así la rejilla se llena sola desde esta página, sin tokens de Meta y sin embeds que
              dependan de que el visitante tenga sesión.
            </p>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3">
              {SETUP_STEPS.map((step, i) => (
                <li key={step.title} className="rounded-2xl border border-border bg-hueso/70 p-5">
                  <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-tinta-400">
                    <step.icon className="size-4" /> {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="mt-3 font-display text-xl">{step.title}</p>
                  <p className="mt-2 text-sm text-tinta-500">{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-tinta-400">
              El plan gratuito de Behold entrega hasta 6 publicaciones; con eso la rejilla ya se muestra completa y se
              puede ampliar después.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild variant="sage">
                <a href="/manual">Manual de imagen para publicar</a>
              </Button>
              <InstagramProfileCard handle={handle} label="Mientras tanto, ver en Instagram" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
