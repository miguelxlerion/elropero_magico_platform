"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Box, ScanLine, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type ModelViewerElementLike = HTMLElement & {
  canActivateAR?: boolean;
  activateAR?: () => Promise<void>;
};

type ARButtonProps = {
  modelUrl: string;
  productName: string;
  poster?: string;
  variant?: "default" | "overlay";
  autoOpen?: boolean;
  className?: string;
};

/**
 * Wrapper de <model-viewer>: AR nativo (WebXR en Android, Scene Viewer y Quick Look en iOS).
 * En escritorio muestra un QR para continuar la experiencia en el celular.
 */
export function ARButton({
  modelUrl,
  productName,
  poster,
  variant = "default",
  autoOpen = false,
  className,
}: ARButtonProps) {
  const [open, setOpen] = useState(autoOpen);
  const [ready, setReady] = useState(false);
  const [canAR, setCanAR] = useState<boolean | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const [viewer, setViewer] = useState<ModelViewerElementLike | null>(null);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(ua) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(ua)));
    const url = new URL(window.location.href);
    url.searchParams.set("ar", "1");
    setPageUrl(url.toString());
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    import("@google/model-viewer")
      .then(() => {
        if (!cancelled) setReady(true);
      })
      .catch(() => setCanAR(false));
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!ready || !viewer) return;
    const onLoad = () => setCanAR(Boolean(viewer.canActivateAR));
    const onStatus = (event: Event) => {
      const status = (event as CustomEvent<{ status?: string }>).detail?.status;
      if (status === "session-started") track("ar_session_started", { product: productName });
      if (status === "failed") setCanAR(false);
    };
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("ar-status", onStatus);
    return () => {
      viewer.removeEventListener("load", onLoad);
      viewer.removeEventListener("ar-status", onStatus);
    };
  }, [ready, viewer, productName]);

  const handleOpen = () => {
    setOpen(true);
    track("ar_open", { product: productName, mobile: isMobile });
  };

  return (
    <>
      {variant === "overlay" ? (
        <button
          type="button"
          onClick={handleOpen}
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-tinta px-4 py-2.5 text-xs font-semibold text-hueso shadow-lg transition hover:bg-tinta-700",
            className,
          )}
        >
          <ScanLine className="size-4" />
          Ver en tu espacio
        </button>
      ) : (
        <Button type="button" variant="outline" size="lg" onClick={handleOpen} className={cn("w-full", className)}>
          <ScanLine />
          Ver en tu espacio (AR)
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <div className="grid md:grid-cols-[1.3fr_1fr]">
            <div className="relative aspect-square bg-[radial-gradient(circle_at_50%_35%,#ffffff_0%,#f4eee4_60%,#e7dccb_100%)] md:aspect-auto md:min-h-[480px]">
              {ready ? (
                <model-viewer
                  ref={(el) => setViewer(el as ModelViewerElementLike | null)}
                  src={modelUrl}
                  poster={poster}
                  alt={`Modelo 3D de ${productName}`}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  ar-scale="fixed"
                  camera-controls
                  auto-rotate
                  touch-action="pan-y"
                  shadow-intensity="1"
                  shadow-softness="0.9"
                  exposure="1.05"
                  loading="eager"
                  interaction-prompt="none"
                  style={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}
                >
                  <button
                    slot="ar-button"
                    className="absolute bottom-5 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-tinta px-5 py-3 text-sm font-semibold text-hueso shadow-xl"
                  >
                    <ScanLine className="size-4" />
                    Colocar en mi espacio
                  </button>
                </model-viewer>
              ) : (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="size-16 animate-spin rounded-full border-2 border-beige-200 border-t-salvia-500" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-5 p-6 md:p-8">
              <DialogHeader className="mb-0">
                <p className="eyebrow text-salvia-600">Realidad aumentada</p>
                <DialogTitle>Pruébalo en tu espacio</DialogTitle>
                <DialogDescription>
                  {productName} en escala real (1:1). Gíralo, acércate y mira cómo se ve sobre tu mesa, tu cama o
                  tu repisa antes de comprar.
                </DialogDescription>
              </DialogHeader>

              {isMobile ? (
                <div className="space-y-3 rounded-2xl bg-salvia-50 p-4 text-sm text-salvia-700">
                  <p className="flex items-center gap-2 font-semibold">
                    <Smartphone className="size-4" />
                    {canAR === false ? "Tu dispositivo no soporta AR" : "Toca “Colocar en mi espacio”"}
                  </p>
                  <p className="text-salvia-700/80">
                    {canAR === false
                      ? "Puedes seguir girando el modelo 3D. Prueba desde Chrome (Android) o Safari (iPhone)."
                      : "Apunta la cámara a una superficie plana y mueve el celular despacio hasta que aparezca."}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4">
                  <div className="rounded-xl bg-white p-1.5 ring-1 ring-border">
                    {pageUrl ? (
                      <QRCodeSVG value={pageUrl} size={112} fgColor="#151412" bgColor="#ffffff" level="M" />
                    ) : (
                      <div className="size-28" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="font-semibold text-tinta">Escanéalo con tu celular</p>
                    <p className="text-tinta-500">
                      Se abrirá esta prenda directamente en modo AR (Android con ARCore o iPhone con iOS 12+).
                    </p>
                  </div>
                </div>
              )}

              <ul className="mt-auto space-y-2 text-xs text-tinta-500">
                <li className="flex items-center gap-2">
                  <Box className="size-3.5 text-salvia-500" /> Modelo a escala real, medido por nuestro equipo
                </li>
                <li className="flex items-center gap-2">
                  <ScanLine className="size-3.5 text-salvia-500" /> Sin descargar apps: funciona en el navegador
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
