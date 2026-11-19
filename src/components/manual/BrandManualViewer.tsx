"use client";

import { useRef, useState } from "react";
import { Download, ExternalLink, Expand, Minimize } from "lucide-react";

const DOC_HREF = "/manual/manual-de-marca.html";

export function BrandManualViewer() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [completa, setCompleta] = useState(false);

  return (
    <div className="mt-6">
      {/* Barra de herramientas minimal */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
        <p className="text-xs text-tinta-400">
          Manual completo · 13 secciones · navegación integrada
        </p>
        <div className="flex gap-2">
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
            <ExternalLink className="size-3.5" /> Abrir en pestaña
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

      {/* Iframe del manual */}
      <div
        className={
          completa
            ? "fixed inset-0 z-50 bg-white"
            : "overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_40px_80px_-60px_rgba(21,20,18,0.5)]"
        }
      >
        <iframe
          ref={frameRef}
          src={DOC_HREF}
          title="Manual de marca de El Ropero Mag&co"
          style={{
            width: "100%",
            height: completa ? "100vh" : "calc(100vh - 14rem)",
            minHeight: completa ? undefined : 600,
            border: 0,
            display: "block",
          }}
        />
      </div>

      {completa && (
        <button
          type="button"
          onClick={() => setCompleta(false)}
          className="fixed top-4 right-4 z-50 rounded-full border border-border bg-white/90 px-4 py-2 text-xs font-semibold text-tinta-500 shadow-lg backdrop-blur transition-colors hover:text-tinta"
        >
          ✕ Cerrar vista completa
        </button>
      )}
    </div>
  );
}
