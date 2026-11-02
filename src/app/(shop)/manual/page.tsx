import type { Metadata } from "next";
import { BrandManualViewer } from "@/components/manual/BrandManualViewer";

export const metadata: Metadata = {
  title: "Manual de imagen",
  description:
    "Guía de marca de El Ropero Mag&co para community managers y diseñadores: identidad, paleta, tipografía, fotografía, voz, plataformas, KPIs y checklist.",
  robots: { index: false, follow: false },
};

export default function ManualPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <header className="max-w-3xl">
        <p className="eyebrow eyebrow-line text-salvia-600">Equipo · Community &amp; Diseño</p>
        <h1 className="mt-4 font-display text-5xl sm:text-6xl">
          Manual de imagen <em className="italic">del ropero</em>
        </h1>
        <p className="mt-5 text-tinta-500">
          La referencia única de marca: cómo se ve y cómo se dice El Ropero Mag&amp;co. Está escrita para quien
          publica y para quien diseña, así que cada pieza que salga a Instagram, TikTok, Pinterest, Depop o Poshmark
          debería pasar por acá antes de publicarse.
        </p>
        <p className="mt-4 text-sm text-tinta-400">
          Diagnóstico, identidad visual, paleta, tipografía, fotografía, voz y narrativa, formatos por plataforma,
          contenido dual, KPIs, plan de acción y el checklist de revisión.
        </p>
      </header>

      <BrandManualViewer />
    </div>
  );
}
