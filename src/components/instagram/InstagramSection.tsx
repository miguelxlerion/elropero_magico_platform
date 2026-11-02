"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  AtSign as Instagram,
  Clapperboard,
  Expand,
  Heart,
  Images,
  LayoutGrid,
  MessageCircle,
  Pause,
  Play,
  Repeat2,
  Video,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { INSTAGRAM_KIND_ORDER, KIND_LABEL, type InstagramItem, type InstagramKind } from "@/lib/instagram";
import { cn } from "@/lib/utils";

const KIND_ICON = { reel: Clapperboard, video: Video, carousel: Repeat2, photo: Images } as const;

const AUTOPLAY_MS = 6500;

type Filter = "todo" | InstagramKind;
type View = "carrusel" | "rejilla";

function relativeDate(iso: string) {
  if (!iso) return "";
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (Number.isNaN(days)) return "";
  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 30) return `hace ${days} días`;
  if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
  return `hace ${Math.floor(days / 365)} año${days >= 730 ? "s" : ""}`;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return reduced;
}

/**
 * `playable` monta el `<video>` solo en la diapositiva visible: así nada se reproduce fuera de
 * pantalla y las tarjetas inactivas no dejan controles alcanzables con el teclado.
 */
function ItemMedia({
  item,
  alt,
  playable,
  contain = false,
  sizes,
}: {
  item: InstagramItem;
  alt: string;
  playable: boolean;
  contain?: boolean;
  sizes: string;
}) {
  const fit = contain ? "object-contain" : "object-cover";
  if (item.video && playable) {
    // El video siempre se encaja: recortar un reel cuadrado contra un marco 4:5 perdería el centro
    // de la toma, y el fondo oscuro hace de barras.
    return (
      <video
        src={item.video}
        poster={item.image}
        controls
        playsInline
        preload="none"
        className="h-full w-full bg-black object-contain"
      />
    );
  }
  return <Image src={item.image} alt={alt} fill sizes={sizes} className={cn(fit, "bg-beige-50")} />;
}

function KindBadge({ item, className }: { item: InstagramItem; className?: string }) {
  const Icon = KIND_ICON[item.kind];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-tinta/80 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-hueso backdrop-blur",
        className,
      )}
    >
      <Icon className="size-3" /> {KIND_LABEL[item.kind]}
    </span>
  );
}

function ItemStats({ item }: { item: InstagramItem }) {
  return (
    <span className="inline-flex items-center gap-3 text-xs text-tinta-400">
      <span className="inline-flex items-center gap-1">
        <Heart className="size-3.5" /> {item.likes}
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="size-3.5" /> {item.comments}
      </span>
      {relativeDate(item.publishedAt)}
    </span>
  );
}

function InstagramCarousel({
  items,
  handle,
  onOpen,
}: {
  items: InstagramItem[];
  handle: string;
  onOpen: (index: number) => void;
}) {
  // El carrusel recuerda la publicación por id: al cambiar de filtro, si la diapositiva ya no está
  // en la lista se cae a la primera, sin efecto de reinicio ni índices fuera de rango.
  const [slideId, setSlideId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const reduced = usePrefersReducedMotion();
  const many = items.length > 1;
  const found = items.findIndex((item) => item.id === slideId);
  const index = found === -1 ? 0 : found;
  const current = items[index];

  useEffect(() => {
    if (!many || paused || reduced) return;
    const id = window.setInterval(() => setSlideId(items[(index + 1) % items.length].id), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [many, paused, reduced, index, items]);

  const step = (delta: number) => setSlideId(items[(index + delta + items.length) % items.length].id);
  const autoplaying = many && !paused && !reduced;

  return (
    <div
      className="overflow-hidden rounded-[2rem] border border-border bg-white/60"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="relative">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((item, i) => (
            <div key={item.id} className="w-full shrink-0" aria-hidden={i !== index}>
              <div className="relative aspect-[4/5] max-h-[56vh] w-full overflow-hidden bg-tinta">
                <ItemMedia
                  item={item}
                  alt={`${KIND_LABEL[item.kind]} de @${handle}`}
                  playable={i === index}
                  sizes="100vw"
                />
              </div>
            </div>
          ))}
        </div>

        <KindBadge item={current} className="absolute left-4 top-4" />

        {many && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Publicación anterior"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-hueso/85 text-tinta shadow-lg backdrop-blur transition hover:bg-hueso"
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Publicación siguiente"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-hueso/85 text-tinta shadow-lg backdrop-blur transition hover:bg-hueso"
            >
              <ArrowRight className="size-4" />
            </button>
          </>
        )}

        {many && !reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={autoplaying ? "Pausar el carrusel" : "Reanudar el carrusel"}
            className="absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-tinta/80 text-hueso backdrop-blur transition hover:bg-tinta"
          >
            {autoplaying ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        )}
      </div>

      <div className="space-y-4 p-5 sm:p-6">
        <p className="text-sm leading-relaxed text-tinta-600">{current.caption || "Publicación del ropero"}</p>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="eyebrow text-tinta-400">
            {String(index + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
          </span>

          {many && (
            <div className="flex items-center gap-2">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSlideId(items[i].id)}
                  aria-label={`Ver la publicación ${i + 1}`}
                  aria-current={i === index}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    i === index ? "w-7 bg-tinta" : "w-2 bg-tinta/25 hover:bg-tinta/50",
                  )}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3">
            <ItemStats item={current} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onOpen(index)}
            className="inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2 text-sm font-semibold text-hueso transition-colors hover:bg-tinta-700"
          >
            <Expand className="size-4" /> Ver completo
          </button>
          <a
            href={current.permalink}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-tinta-600 transition-colors hover:border-tinta/40 hover:text-tinta"
          >
            <Instagram className="size-4" /> Ver en Instagram
          </a>
        </div>
      </div>
    </div>
  );
}

function InstagramGrid({ items, handle, onOpen }: { items: InstagramItem[]; handle: string; onOpen: (i: number) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id}>
          <button
            type="button"
            onClick={() => onOpen(i)}
            aria-label={`Abrir ${KIND_LABEL[item.kind]} de @${handle}`}
            className="group block w-full overflow-hidden rounded-3xl border border-border bg-white/60 text-left transition hover:border-tinta/30 hover:bg-white hover:shadow-[0_30px_60px_-40px_rgba(21,20,18,0.4)]"
          >
            <div className="relative aspect-square overflow-hidden bg-beige-50">
              <Image
                src={item.image}
                alt={item.alt || item.caption || `Publicación de @${handle}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <KindBadge item={item} className="absolute left-3 top-3" />
              <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full bg-tinta/70 px-2.5 py-1 text-[0.65rem] font-semibold text-hueso backdrop-blur">
                <Heart className="size-3" /> {item.likes}
                <MessageCircle className="size-3" /> {item.comments}
              </span>
            </div>
            <div className="p-4">
              <p className="line-clamp-2 text-sm text-tinta-600">{item.caption || "Publicación del ropero"}</p>
              <p className="mt-2 text-xs text-tinta-400">{relativeDate(item.publishedAt)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function InstagramSection({ items, handle }: { items: InstagramItem[]; handle: string }) {
  const [filter, setFilter] = useState<Filter>("todo");
  const [view, setView] = useState<View>("carrusel");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const counts = useMemo(() => {
    const map = new Map<InstagramKind, number>();
    for (const item of items) map.set(item.kind, (map.get(item.kind) ?? 0) + 1);
    return map;
  }, [items]);

  const visible = useMemo(
    () => (filter === "todo" ? items : items.filter((item) => item.kind === filter)),
    [items, filter],
  );

  const current = openIndex === null ? null : visible[openIndex];
  const lightboxOpen = openIndex !== null;

  // El lightbox recorre la lista filtrada con las flechas del teclado, como el visor de Instagram.
  useEffect(() => {
    if (!lightboxOpen || visible.length < 2) return;
    const step = (delta: number) => setOpenIndex((i) => ((i as number) + delta + visible.length) % visible.length);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, visible.length]);

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar publicaciones por tipo">
          <FilterChip
            label="Todo"
            count={items.length}
            active={filter === "todo"}
            onClick={() => setFilter("todo")}
          />
          {INSTAGRAM_KIND_ORDER.filter((kind) => counts.has(kind)).map((kind) => (
            <FilterChip
              key={kind}
              label={KIND_LABEL[kind]}
              count={counts.get(kind) ?? 0}
              active={filter === kind}
              onClick={() => setFilter(kind)}
            />
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-full border border-border bg-white/70 p-1" role="group" aria-label="Disposición de la galería">
          <ViewButton view="carrusel" active={view} onClick={setView} />
          <ViewButton view="rejilla" active={view} onClick={setView} />
        </div>
      </div>

      {view === "carrusel" ? (
        <InstagramCarousel items={visible} handle={handle} onOpen={setOpenIndex} />
      ) : (
        <InstagramGrid items={visible} handle={handle} onOpen={setOpenIndex} />
      )}

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-[640px] overflow-hidden p-0">
          {current && (
            <>
              <DialogTitle className="sr-only">
                {KIND_LABEL[current.kind]} de @{handle}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {current.caption || `Publicación de @${handle}`}
              </DialogDescription>
              <div className="relative aspect-[4/5] max-h-[62vh] w-full bg-black">
                <ItemMedia
                  item={current}
                  alt={current.alt || current.caption || `Publicación de @${handle}`}
                  playable
                  contain
                  sizes="100vw"
                />
                {visible.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setOpenIndex((i) => ((i as number) - 1 + visible.length) % visible.length)}
                      aria-label="Publicación anterior"
                      className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-hueso/85 text-tinta shadow-lg backdrop-blur transition hover:bg-hueso"
                    >
                      <ArrowLeft className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenIndex((i) => ((i as number) + 1) % visible.length)}
                      aria-label="Publicación siguiente"
                      className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-hueso/85 text-tinta shadow-lg backdrop-blur transition hover:bg-hueso"
                    >
                      <ArrowRight className="size-4" />
                    </button>
                  </>
                )}
                <KindBadge item={current} className="absolute left-4 top-4" />
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm leading-relaxed text-tinta-600">
                  {current.caption || "Publicación del ropero"}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <ItemStats item={current} />
                  <a
                    href={current.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-tinta-600 transition-colors hover:border-tinta/40 hover:text-tinta"
                  >
                    <Instagram className="size-3.5" /> Ver en Instagram
                  </a>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Filtrar por ${label.toLowerCase()}`}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
        active
          ? "border-tinta bg-tinta text-hueso"
          : "border-border bg-white/70 text-tinta-600 hover:border-tinta/40 hover:text-tinta",
      )}
    >
      {label}
      <span className={cn("text-xs", active ? "text-hueso/60" : "text-tinta-400")}>{count}</span>
    </button>
  );
}

function ViewButton({
  view,
  active,
  onClick,
}: {
  view: View;
  active: View;
  onClick: (view: View) => void;
}) {
  const Icon = view === "carrusel" ? Clapperboard : LayoutGrid;
  return (
    <button
      type="button"
      onClick={() => onClick(view)}
      aria-pressed={active === view}
      aria-label={view === "carrusel" ? "Ver como carrusel" : "Ver en rejilla"}
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active === view ? "bg-tinta text-hueso" : "text-tinta-500 hover:text-tinta",
      )}
    >
      <Icon className="size-3.5" /> {view === "carrusel" ? "Carrusel" : "Rejilla"}
    </button>
  );
}
