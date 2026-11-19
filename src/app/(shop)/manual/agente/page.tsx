import type { Metadata } from "next";
import Link from "next/link";
import { AgenteInline } from "@/components/manual/AgenteInline";

export const metadata: Metadata = {
  title: "Agente de Contenido",
  description:
    "Prompt maestro y estudio de contenido para agentes de IA de El Ropero Mag&co. Genera publicaciones de marca listas para publicar.",
  robots: { index: false, follow: false },
};

export default function AgentePage() {
  return (
    <div className="min-h-screen">
      {/* Barra superior con navegación de vuelta al manual */}
      <div className="sticky top-0 z-40 border-b border-border bg-hueso/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/manual"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-tinta-500 transition-colors hover:text-tinta"
          >
            ← Volver al manual
          </Link>
          <p className="text-xs text-tinta-400">
            Sección 13 · Agente de Contenido
          </p>
        </div>
      </div>

      {/* Contenido del agente */}
      <AgenteInline />
    </div>
  );
}
