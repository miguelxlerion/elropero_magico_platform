"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Box, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { AccessoryViewer } from "@/components/3d/AccessoryViewer";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
  images: string[];
  name: string;
  modelUrl?: string;
  arSupported?: boolean;
  autoOpenAR?: boolean;
  unavailable?: boolean;
};

const hiRes = (src: string) => src.replace("h=1200&w=900", "h=2400&w=1800");

export function ProductGallery({ images, name, modelUrl, arSupported, autoOpenAR, unavailable }: ProductGalleryProps) {
  const has3D = Boolean(modelUrl);
  const [mode, setMode] = useState<"3d" | "photo">(has3D ? "3d" : "photo");
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState<{ x: number; y: number } | null>(null);
  const current = images[index] ?? images[0] ?? "";

  const go = (delta: number) => {
    setMode("photo");
    setIndex((i) => (i + delta + images.length) % images.length);
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="flex flex-col-reverse gap-4 lg:flex-row">
      <div className="no-scrollbar flex gap-3 overflow-x-auto lg:w-20 lg:flex-col lg:overflow-visible">
        {has3D && (
          <button
            type="button"
            onClick={() => setMode("3d")}
            className={cn(
              "relative grid aspect-[3/4] w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-salvia-100 to-beige-100 text-tinta ring-offset-2 ring-offset-hueso transition lg:w-full",
              mode === "3d" ? "ring-2 ring-tinta" : "opacity-70 hover:opacity-100",
            )}
            aria-label="Ver modelo 3D"
          >
            <span className="flex flex-col items-center gap-1 text-[0.62rem] font-bold uppercase tracking-widest">
              <Box className="size-5" />
              3D
            </span>
          </button>
        )}
        {images.map((src, i) => (
          <button
            key={`${src}-${i}`}
            type="button"
            onClick={() => {
              setMode("photo");
              setIndex(i);
            }}
            className={cn(
              "relative aspect-[3/4] w-16 shrink-0 overflow-hidden rounded-xl ring-offset-2 ring-offset-hueso transition lg:w-full",
              mode === "photo" && index === i ? "ring-2 ring-tinta" : "opacity-60 hover:opacity-100",
            )}
            aria-label={`Ver foto ${i + 1}`}
          >
            <Image src={src} alt="" fill sizes="80px" className="object-cover" />
          </button>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {mode === "3d" && modelUrl ? (
            <motion.div
              key="viewer"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.35 }}
            >
              <AccessoryViewer
                modelUrl={modelUrl}
                productName={name}
                poster={images[0]}
                arSupported={arSupported}
                autoOpenAR={autoOpenAR}
                onShowPhotos={() => setMode("photo")}
                className="aspect-[4/5] w-full"
              />
            </motion.div>
          ) : (
            <motion.div
              key={`photo-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="group relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[1.75rem] bg-beige-100"
              onMouseMove={onMove}
              onMouseLeave={() => setZoom(null)}
              onClick={() => setLightbox(true)}
            >
              {current && (
                <Image
                  src={current}
                  alt={`${name} — foto ${index + 1} de ${images.length}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={cn("object-cover", unavailable && "grayscale-[40%]")}
                />
              )}
              {zoom && current && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 hidden bg-no-repeat md:block"
                  style={{
                    backgroundImage: `url(${hiRes(current)})`,
                    backgroundSize: "230%",
                    backgroundPosition: `${zoom.x}% ${zoom.y}%`,
                  }}
                />
              )}
              <span className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1.5 text-xs font-medium text-tinta backdrop-blur transition-opacity group-hover:opacity-0">
                <ZoomIn className="size-3.5" /> Pasa el cursor para zoom · clic para ampliar
              </span>
              {images.length > 1 && (
                <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between md:hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(-1);
                    }}
                    className="grid size-9 place-items-center rounded-full bg-white/85"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      go(1);
                    }}
                    className="grid size-9 place-items-center rounded-full bg-white/85"
                    aria-label="Foto siguiente"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Dialog
        open={lightbox}
        onOpenChange={(open) => {
          setLightbox(open);
          setLightboxZoom(null);
        }}
      >
        <DialogContent className="max-w-4xl bg-hueso p-3">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          <div
            className={cn(
              "relative h-[78dvh] overflow-hidden rounded-2xl bg-beige-50",
              lightboxZoom ? "cursor-zoom-out" : "cursor-zoom-in",
            )}
            onClick={(e) => {
              if (lightboxZoom) return setLightboxZoom(null);
              const rect = e.currentTarget.getBoundingClientRect();
              setLightboxZoom({
                x: ((e.clientX - rect.left) / rect.width) * 100,
                y: ((e.clientY - rect.top) / rect.height) * 100,
              });
            }}
          >
            {current && (
              <Image
                src={hiRes(current)}
                alt={name}
                fill
                sizes="90vw"
                className="object-contain transition-transform duration-500"
                style={{
                  transform: lightboxZoom ? "scale(2.4)" : "scale(1)",
                  transformOrigin: lightboxZoom ? `${lightboxZoom.x}% ${lightboxZoom.y}%` : "center",
                }}
              />
            )}
            {images.length > 1 && (
              <div className="absolute inset-x-3 top-1/2 flex -translate-y-1/2 justify-between">
                {[-1, 1].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxZoom(null);
                      go(d);
                    }}
                    className="grid size-11 place-items-center rounded-full bg-white/90 shadow"
                    aria-label={d < 0 ? "Foto anterior" : "Foto siguiente"}
                  >
                    {d < 0 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="pt-2 text-center text-xs text-tinta-400">
            Foto {index + 1} de {images.length} · Clic para acercar hasta 2.4×
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
