"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Expand, Hand, Pause, Play, RotateCcw, Shrink, TriangleAlert } from "lucide-react";
import { use3DViewer } from "@/hooks/use3DViewer";
import { versionedModelUrl } from "@/lib/models";
import { cn } from "@/lib/utils";
import { ARButton } from "./ARButton";
import { LIGHTING, LIGHTING_LIST } from "./lighting";
import { Viewer3DSkeleton } from "./Viewer3DSkeleton";

const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => <Viewer3DSkeleton />,
});

type AccessoryViewerProps = {
  modelUrl: string;
  productName: string;
  poster?: string;
  arSupported?: boolean;
  autoOpenAR?: boolean;
  className?: string;
  onShowPhotos?: () => void;
};

function ControlButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "grid size-9 place-items-center rounded-full bg-white/80 text-tinta shadow-sm backdrop-blur transition hover:bg-white",
        active && "bg-tinta text-hueso hover:bg-tinta-700",
      )}
    >
      {children}
    </button>
  );
}

export function AccessoryViewer({
  modelUrl,
  productName,
  poster,
  arSupported = true,
  autoOpenAR = false,
  className,
  onShowPhotos,
}: AccessoryViewerProps) {
  const viewer = use3DViewer();
  const cfg = LIGHTING[viewer.preset];
  const modelSrc = versionedModelUrl(modelUrl) ?? modelUrl;
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await el.requestFullscreen();
    } catch {
      // Algunos navegadores móviles no permiten fullscreen en elementos
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative isolate overflow-hidden rounded-[1.75rem] bg-beige-50 select-none", className)}
    >
      <AnimatePresence initial={false}>
        <motion.div
          key={viewer.preset}
          className="absolute inset-0 -z-10"
          style={{ background: cfg.background }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>

      <div className="absolute inset-0">
        <Scene3D
          modelUrl={modelSrc}
          preset={viewer.preset}
          autoRotate={viewer.autoRotate}
          resetKey={viewer.resetKey}
          onLoaded={() => viewer.setLoaded(true)}
          onInteract={viewer.markInteracted}
          onError={viewer.setError}
        />
      </div>

      {/* Barra superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
        <span
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[0.66rem] font-semibold uppercase tracking-[0.18em] backdrop-blur",
            cfg.dark ? "bg-white/10 text-hueso" : "bg-white/80 text-tinta",
          )}
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-salvia-400 opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-salvia-500" />
          </span>
          Probador 3D
        </span>
        <div className="pointer-events-auto flex gap-2">
          <ControlButton
            label={viewer.autoRotate ? "Pausar rotación" : "Rotación automática"}
            onClick={viewer.toggleAutoRotate}
            active={viewer.autoRotate}
          >
            {viewer.autoRotate ? <Pause className="size-4" /> : <Play className="size-4" />}
          </ControlButton>
          <ControlButton label="Restablecer vista" onClick={viewer.reset}>
            <RotateCcw className="size-4" />
          </ControlButton>
          <ControlButton label={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"} onClick={toggleFullscreen}>
            {isFullscreen ? <Shrink className="size-4" /> : <Expand className="size-4" />}
          </ControlButton>
        </div>
      </div>

      {/* Indicación de interacción */}
      <AnimatePresence>
        {viewer.loaded && !viewer.hasInteracted && !viewer.error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ delay: 0.6 }}
            className="pointer-events-none absolute inset-x-0 top-16 flex justify-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full bg-tinta/80 px-4 py-2 text-xs font-medium text-hueso backdrop-blur">
              <motion.span animate={{ x: [-4, 4, -4] }} transition={{ repeat: Infinity, duration: 1.6 }}>
                <Hand className="size-4" />
              </motion.span>
              Arrastra para girar 360° · Scroll o pellizca para zoom
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra inferior: iluminación + AR */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4">
        <div
          role="radiogroup"
          aria-label="Iluminación"
          className={cn(
            "flex items-center gap-1 rounded-full p-1 backdrop-blur",
            cfg.dark ? "bg-white/10" : "bg-white/80",
          )}
        >
          {LIGHTING_LIST.map((l) => {
            const active = viewer.preset === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="radio"
                aria-checked={active}
                title={l.hint}
                onClick={() => viewer.setPreset(l.id)}
                className={cn(
                  "relative isolate flex items-center gap-2 rounded-full px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  active ? "text-hueso" : cfg.dark ? "text-hueso/70 hover:text-hueso" : "text-tinta-500 hover:text-tinta",
                )}
              >
                {active && (
                  <motion.span
                    layoutId={`light-pill-${modelUrl}`}
                    className="absolute inset-0 -z-10 rounded-full bg-tinta"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: l.swatch }} />
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            );
          })}
        </div>
        {arSupported && (
          <ARButton modelUrl={modelSrc} productName={productName} poster={poster} variant="overlay" autoOpen={autoOpenAR} />
        )}
      </div>

      {viewer.error && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-beige-50/95 p-6 text-center">
          <div className="max-w-xs space-y-3">
            <TriangleAlert className="mx-auto size-6 text-terracota" />
            <p className="font-display text-xl">No pudimos cargar el modelo 3D</p>
            <p className="text-sm text-tinta-500">Revisa tu conexión o mira las fotos reales de la prenda.</p>
            {onShowPhotos && (
              <button type="button" onClick={onShowPhotos} className="text-sm font-semibold underline underline-offset-4">
                Ver fotos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
