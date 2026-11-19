"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  styleBlock: string;
  bodyHtml: string;
  cdnScripts: string[];
  inlineScripts: string[];
  fontLinks: string[];
};

export function ManualInlineClient({
  styleBlock,
  bodyHtml,
  cdnScripts,
  inlineScripts,
  fontLinks,
}: Props) {
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    // 1) Fonts
    for (const linkHtml of fontLinks) {
      const tmp = document.createElement("div");
      tmp.innerHTML = linkHtml;
      const link = tmp.firstElementChild;
      if (link) document.head.appendChild(link);
    }

    // 2) CSS propio del manual
    const styleEl = document.createElement("style");
    styleEl.textContent = styleBlock;
    document.head.appendChild(styleEl);

    // 2b) Override: el sidebar del manual no debe tapar el header del sitio
    const overrideEl = document.createElement("style");
    overrideEl.textContent = `
      nav.fixed.left-0.top-0.h-full {
        top: 4.5rem !important;
        height: calc(100vh - 4.5rem) !important;
        z-index: 30 !important;
      }
      .scroll-progress { top: 4.5rem !important; z-index: 30 !important; }
    `;
    document.head.appendChild(overrideEl);

    // 3) Cargar scripts CDN (Tailwind) y luego mostrar el contenido
    const loadScript = (src: string) =>
      new Promise<void>((resolve) => {
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => resolve(); // no bloquear si falla
        document.head.appendChild(s);
      });

    (async () => {
      try {
        for (const src of cdnScripts) {
          await loadScript(src);
        }
        setReady(true);

        // 4) Tras renderizar el body, ejecutar los scripts inline UNA sola vez
        await new Promise((r) => setTimeout(r, 80));
        for (const code of inlineScripts) {
          const s = document.createElement("script");
          s.textContent = code;
          document.body.appendChild(s);
        }
      } catch (err) {
        console.error("[AgenteInline] Error loading:", err);
        setReady(true); // Mostrar contenido aunque falle algún script
      }
    })();
  }, [fontLinks, styleBlock, cdnScripts, inlineScripts]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center py-24 text-sm text-tinta-400">
        Cargando manual…
      </div>
    );
  }

  return <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />;
}
