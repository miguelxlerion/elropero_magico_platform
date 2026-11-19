import type { Metadata } from "next";
import { ManualInline } from "@/components/manual/ManualInline";

export const metadata: Metadata = {
  title: "Manual de imagen",
  description:
    "Guía de marca de El Ropero Mag&co para community managers y diseñadores: identidad, paleta, tipografía, fotografía, voz, plataformas, KPIs, checklist y estudio de contenido.",
  robots: { index: false, follow: false },
};

export default function ManualPage() {
  return <ManualInline />;
}
