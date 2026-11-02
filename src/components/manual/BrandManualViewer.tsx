"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, Expand, Minimize } from "lucide-react";
import { cn } from "@/lib/utils";

const DOC_HREF = "/manual/manual-de-marca.html";

const SECTIONS = [
  { id: "inicio", num: "01", label: "Inicio" },
  { id: "diagnostico", num: "02", label: "Diagnóstico" },
  { id: "identidad", num: "03", label: "Identidad Visual" },
  { id: "paleta", num: "04", label: "Paleta de Colores" },
  { id: "tipografia", num: "05", label: "Tipografía" },
  { id: "fotografia", num: "06", label: "Fotografía" },
  { id: "voz", num: "07", label: "Voz y Narrativa" },
  { id: "plataformas", num: "08", label: "Plataformas" },
  { id: "contenido", num: "09", label: "Contenido Dual" },
  { id: "kpis", num: "10", label: "KPIs" },
  { id: "plan", num: "11", label: "Plan de Acción" },
  { id: "checklist", num: "12", label: "Checklist" },
];

export function BrandManualViewer() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [active, setActive] = useState("inicio");
  const [completa, setCompleta] = useState(false);

  const goTo = (id: string) => {
    setActive(id);
    const frame = frameRef.current;
    const win = frame?.contentWindow;
    if (!frame || !win) return;
    try {
      const target = frame.contentDocument?.getElementById(id);
      if (target) {
        // scrollTo del marco, no scrollIntoView: este ultimo tambien desplazaria la pagina padre.
        // Y debe ser "instant": un scroll suave dentro del iframe encadena su animacion al scroll
        // del documento padre y la pagina salta ~530px abajo del encabezado.
        win.scrollTo({ top: target.getBoundingClientRect().top + win.scrollY, behavior: "instant" });
        return;
      }
    } catch {
      // El documento se sirvió desde otro origen: cae a la navegación por ancla.
    }
    frame.src = `${DOC_HREF}#${id}`;
  };

  return (
    <div className="mt-10">
      <div className="sticky top-[5.25rem] z-30 -mx-4 border-b border-border bg-hueso/92 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <p className="eyebrow mr-2 shrink-0 text-tinta-400">12 secciones</p>
          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => goTo(section.id)}
                aria-current={active === section.id ? "true" : undefined}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors",
                  active === section.id
                    ? "border-tinta bg-tinta text-hueso"
                    : "border-border bg-white/70 text-tinta-500 hover:border-tinta/40 hover:text-tinta",
                )}
              >
                <span className="mr-1.5 text-[0.65rem] opacity-60">{section.num}</span>
                {section.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setCompleta((v) => !v)}
              aria-pressed={completa}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-tinta-500 transition-colors hover:border-tinta/40 hover:text-tinta"
            >
              {completa ? <Minimize className="size-3.5" /> : <Expand className="size-3.5" />}
              {completa ? "Vista normal" : "Vista completa"}
            </button>
            <a
              href={DOC_HREF}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-tinta-500 transition-colors hover:border-tinta/40 hover:text-tinta"
            >
              <ExternalLink className="size-3.5" /> Abrir en pestaña nueva
            </a>
            <a
              href={DOC_HREF}
              download="manual-de-marca-el-ropero.html"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/70 px-3 py-1.5 text-xs font-semibold text-tinta-500 transition-colors hover:border-tinta/40 hover:text-tinta"
            >
              <Download className="size-3.5" /> Descargar
            </a>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_40px_80px_-60px_rgba(21,20,18,0.5)]",
          completa && "rounded-[1.25rem]",
        )}
        style={completa ? { position: "sticky", top: 156, zIndex: 20 } : undefined}
      >
        <iframe
          ref={frameRef}
          src={DOC_HREF}
          title="Manual de marca de El Ropero Mag&co"
          // Altura en style, no con utilidades de Tailwind: el watcher de Tailwind se congela en este
          // disco y las clases arbitrarias (h-[75vh]) quedan sin generar, dejando el marco en 150px.
          style={{
            width: "100%",
            height: completa ? "calc(100vh - 11rem)" : "calc(100vh - 13rem)",
            minHeight: completa ? 720 : 680,
            border: 0,
            display: "block",
          }}
        />
      </div>
    </div>
  );
}
