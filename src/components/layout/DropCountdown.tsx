"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDropRealtime, type RealtimeStatus } from "@/hooks/useDropRealtime";
import { cn, formatDateTime, getTimeLeft } from "@/lib/utils";
import type { DropSnapshot } from "@/types/drop";
import { NotifyForm } from "./NotifyForm";

/*
 * Sincronización en tiempo real: ver hooks/useDropRealtime (SSE compartido + fallback a polling).
 * Además de reflejar cambios hechos desde el admin (fecha, estado), corrige el desfase
 * entre el reloj del servidor y el del dispositivo para que el countdown sea exacto.
 */

function useNow(offset: number) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + offset);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [offset]);
  return now;
}

function Digit({ value }: { value: string }) {
  return (
    <span className="relative inline-block h-[1.05em] w-[0.6em] overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Unit({ value, label, size }: { value: number | null; label: string; size: "lg" | "md" }) {
  const text = value === null ? "--" : String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "flex font-display font-medium leading-none tabular-nums text-tinta",
          size === "lg" ? "text-5xl sm:text-6xl xl:text-7xl" : "text-4xl",
        )}
      >
        {text.split("").map((d, i) => (
          <Digit key={`${text.length}-${i}`} value={d} />
        ))}
      </div>
      <span
        className={cn(
          "mt-2 font-semibold uppercase tracking-[0.22em] text-tinta-400",
          size === "lg" ? "text-[0.62rem]" : "text-[0.56rem]",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function RealtimeDot({ status }: { status: RealtimeStatus }) {
  const color = status === "live" ? "bg-salvia-500" : status === "connecting" ? "bg-ambar" : "bg-tinta-400";
  return (
    <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-tinta-500">
      <span className="relative flex size-2">
        {status === "live" && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-salvia-400 opacity-70" />
        )}
        <span className={cn("relative inline-flex size-2 rounded-full", color)} />
      </span>
      {status === "live" ? "Sincronizado en vivo" : status === "connecting" ? "Conectando…" : "Reconectando…"}
    </span>
  );
}

type DropCountdownProps = {
  initialDrop: DropSnapshot | null;
  variant?: "hero" | "panel" | "inline";
  showNotify?: boolean;
  className?: string;
};

export function DropCountdown({ initialDrop, variant = "hero", showNotify = true, className }: DropCountdownProps) {
  const router = useRouter();
  const realtime = useDropRealtime();
  const { offset, status } = realtime;
  // Solo se aplican datos en vivo si corresponden al mismo drop que muestra este countdown.
  const drop =
    realtime.received && realtime.drop && (!initialDrop || realtime.drop.id === initialDrop.id)
      ? realtime.drop
      : initialDrop;
  const now = useNow(offset);
  const t = drop && now !== null ? getTimeLeft(drop.launch_date, now) : null;
  const isLive = drop ? drop.status !== "upcoming" || (t !== null && t.total <= 0) : false;
  const refreshed = useRef(false);

  useEffect(() => {
    if (drop?.status === "upcoming" && t && t.total <= 0 && !refreshed.current) {
      refreshed.current = true;
      router.refresh();
    }
  }, [t, drop, router]);

  if (!drop) return null;

  if (variant === "inline") {
    return (
      <span className={cn("tabular-nums", className)}>
        {isLive
          ? "¡Ya está en vivo!"
          : t
            ? `${t.days}d ${String(t.hours).padStart(2, "0")}h ${String(t.minutes).padStart(2, "0")}m ${String(t.seconds).padStart(2, "0")}s`
            : "··"}
      </span>
    );
  }

  const size = variant === "hero" ? "lg" : "md";

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <RealtimeDot status={status} />
        <span className="text-xs text-tinta-500">
          {isLive ? "Lanzado el " : "Lanzamiento: "}
          <span className="font-semibold capitalize text-tinta">{formatDateTime(drop.launch_date)}</span>
        </span>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {isLive ? (
          <motion.div
            key="live"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-wrap items-center gap-4 rounded-3xl bg-tinta p-5 text-hueso"
          >
            <span className="relative flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-salvia-300 opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-salvia-400" />
            </span>
            <div className="flex-1">
              <p className="font-display text-2xl">Drop {String(drop.number).padStart(2, "0")} en vivo</p>
              <p className="text-sm text-hueso/70">{drop.product_count} piezas únicas. Cuando se van, no vuelven.</p>
            </div>
            <Button asChild variant="light">
              <Link href={`/drops/${drop.id}`}>
                Comprar ahora <ArrowRight />
              </Link>
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="countdown"
            className={cn("flex items-start", size === "lg" ? "gap-3 sm:gap-6" : "gap-3")}
            aria-live="off"
            aria-label={
              t ? `Faltan ${t.days} días, ${t.hours} horas, ${t.minutes} minutos y ${t.seconds} segundos` : undefined
            }
          >
            <Unit value={t?.days ?? null} label="Días" size={size} />
            <span className={cn("font-display text-tinta-400/60", size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl")}>:</span>
            <Unit value={t?.hours ?? null} label="Horas" size={size} />
            <span className={cn("font-display text-tinta-400/60", size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl")}>:</span>
            <Unit value={t?.minutes ?? null} label="Min" size={size} />
            <span className={cn("font-display text-tinta-400/60", size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl")}>:</span>
            <Unit value={t?.seconds ?? null} label="Seg" size={size} />
          </motion.div>
        )}
      </AnimatePresence>

      {showNotify && !isLive && <NotifyForm dropId={drop.id} source="drop_countdown" className="max-w-md" />}
    </div>
  );
}
