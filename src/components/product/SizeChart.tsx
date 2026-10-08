"use client";

import { useState } from "react";
import { Ruler } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductCategory, ProductMeasurements } from "@/types/product";

type MKey = keyof ProductMeasurements;
type Row = { key: MKey; label: string; how: string; contour?: boolean };
type Diagram = "top" | "bottom" | "dress" | "shoes" | "accessory";

const ROWS: Record<Diagram, Row[]> = {
  top: [
    { key: "chest", label: "Pecho", how: "De axila a axila, con la prenda extendida", contour: true },
    { key: "shoulder", label: "Hombros", how: "De costura a costura de hombro" },
    { key: "length", label: "Largo total", how: "Desde el punto más alto del hombro hasta el borde" },
    { key: "sleeve", label: "Manga", how: "Desde la costura del hombro hasta el puño" },
  ],
  dress: [
    { key: "chest", label: "Busto", how: "De axila a axila, en plano", contour: true },
    { key: "waist", label: "Cintura", how: "Parte más angosta, en plano", contour: true },
    { key: "hip", label: "Cadera", how: "Parte más ancha, en plano", contour: true },
    { key: "length", label: "Largo total", how: "Desde el hombro hasta el ruedo" },
  ],
  bottom: [
    { key: "waist", label: "Cintura", how: "Pretina de lado a lado, en plano", contour: true },
    { key: "hip", label: "Cadera", how: "Parte más ancha, en plano", contour: true },
    { key: "rise", label: "Tiro", how: "Desde la entrepierna hasta la pretina" },
    { key: "inseam", label: "Entrepierna", how: "Desde la entrepierna hasta el ruedo" },
    { key: "length", label: "Largo total", how: "Desde la pretina hasta el ruedo" },
  ],
  shoes: [
    { key: "insole", label: "Plantilla interna", how: "Del talón a la punta, por dentro" },
    { key: "height", label: "Altura de caña", how: "Desde la suela hasta el borde superior" },
  ],
  accessory: [
    { key: "width", label: "Ancho", how: "Lado a lado en la parte más ancha" },
    { key: "height", label: "Alto", how: "Base a borde superior (sin asa)" },
    { key: "depth", label: "Fondo", how: "Profundidad de la base" },
    { key: "strap_drop", label: "Caída de asa / correa", how: "Desde el borde del bolso hasta el punto más alto del asa" },
    { key: "circumference", label: "Circunferencia interna", how: "Contorno interno de la copa (talla de sombrero)" },
    { key: "brim", label: "Ala", how: "Desde la copa hasta el borde del ala" },
    { key: "lens_width", label: "Ancho de lente", how: "Horizontal, de aro a aro" },
    { key: "temple_length", label: "Largo de varilla", how: "Desde la bisagra hasta la punta" },
  ],
};

const DIAGRAM_FOR: Record<ProductCategory, Diagram> = {
  ropa_superior: "top",
  vestidos: "dress",
  ropa_inferior: "bottom",
  calzado: "shoes",
  accesorios: "accessory",
};

type Line = { x1: number; y1: number; x2: number; y2: number };

const DIAGRAMS: Record<Diagram, { path: string; lines: Partial<Record<MKey, Line>> }> = {
  top: {
    path: "M62 22 L86 12 Q100 24 114 12 L138 22 L178 58 L160 80 L144 68 L144 204 L56 204 L56 68 L40 80 L22 58 Z",
    lines: {
      chest: { x1: 58, y1: 84, x2: 142, y2: 84 },
      shoulder: { x1: 64, y1: 28, x2: 136, y2: 28 },
      length: { x1: 100, y1: 20, x2: 100, y2: 202 },
      sleeve: { x1: 140, y1: 24, x2: 170, y2: 66 },
    },
  },
  dress: {
    path: "M76 16 L90 10 Q100 20 110 10 L124 16 L128 62 L118 92 L160 210 L40 210 L82 92 L72 62 Z",
    lines: {
      chest: { x1: 74, y1: 50, x2: 126, y2: 50 },
      waist: { x1: 82, y1: 92, x2: 118, y2: 92 },
      hip: { x1: 70, y1: 126, x2: 130, y2: 126 },
      length: { x1: 100, y1: 14, x2: 100, y2: 208 },
    },
  },
  bottom: {
    path: "M58 14 L142 14 L152 206 L110 206 L100 92 L90 206 L48 206 Z",
    lines: {
      waist: { x1: 58, y1: 20, x2: 142, y2: 20 },
      hip: { x1: 54, y1: 58, x2: 146, y2: 58 },
      rise: { x1: 100, y1: 16, x2: 100, y2: 90 },
      inseam: { x1: 102, y1: 96, x2: 109, y2: 204 },
      length: { x1: 160, y1: 14, x2: 160, y2: 206 },
    },
  },
  shoes: {
    path: "M30 150 Q30 120 60 112 L92 104 Q104 70 110 40 L150 40 Q154 100 170 132 Q180 150 172 162 L36 162 Q30 160 30 150 Z",
    lines: {
      insole: { x1: 36, y1: 172, x2: 172, y2: 172 },
      height: { x1: 182, y1: 40, x2: 182, y2: 162 },
    },
  },
  accessory: {
    path: "M50 80 L130 80 L160 60 L160 150 L130 170 L50 170 Z M50 80 L80 60 L160 60 M130 80 L130 170",
    lines: {
      width: { x1: 50, y1: 186, x2: 130, y2: 186 },
      height: { x1: 36, y1: 80, x2: 36, y2: 170 },
      depth: { x1: 136, y1: 182, x2: 166, y2: 162 },
      strap_drop: { x1: 90, y1: 30, x2: 90, y2: 78 },
      circumference: { x1: 50, y1: 125, x2: 130, y2: 125 },
      brim: { x1: 130, y1: 125, x2: 160, y2: 105 },
      lens_width: { x1: 50, y1: 125, x2: 90, y2: 125 },
      temple_length: { x1: 130, y1: 80, x2: 160, y2: 60 },
    },
  },
};

export function SizeChart({
  category,
  size,
  measurements,
}: {
  category: ProductCategory;
  size: string;
  measurements: ProductMeasurements;
}) {
  const diagram = DIAGRAM_FOR[category];
  const rows = ROWS[diagram].filter((r) => typeof measurements[r.key] === "number");
  const [active, setActive] = useState<MKey | null>(rows[0]?.key ?? null);
  const { path, lines } = DIAGRAMS[diagram];

  if (!rows.length) {
    return <p className="text-sm text-tinta-500">Talla {size}. Escríbenos por WhatsApp y medimos la prenda por ti.</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr] md:items-start">
      <div className="mx-auto w-44 md:w-full">
        <svg viewBox="0 0 200 220" className="w-full" role="img" aria-label="Diagrama de medidas">
          <path d={path} fill="#f7f2ea" stroke="#bca483" strokeWidth={1.4} strokeLinejoin="round" />
          {rows.map((r) => {
            const l = lines[r.key];
            if (!l) return null;
            const on = active === r.key;
            return (
              <g key={r.key} className="transition-opacity" opacity={on ? 1 : 0.45}>
                <line
                  {...l}
                  stroke={on ? "#5c6f4e" : "#9e8665"}
                  strokeWidth={on ? 2.6 : 1.4}
                  strokeDasharray={on ? undefined : "4 3"}
                  strokeLinecap="round"
                />
                <circle cx={l.x1} cy={l.y1} r={on ? 3.2 : 2} fill={on ? "#5c6f4e" : "#9e8665"} />
                <circle cx={l.x2} cy={l.y2} r={on ? 3.2 : 2} fill={on ? "#5c6f4e" : "#9e8665"} />
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-beige-50 text-left text-[0.68rem] uppercase tracking-[0.14em] text-tinta-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Medida</th>
                <th className="px-4 py-3 font-semibold">Centímetros</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Cómo la medimos</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const value = measurements[r.key] as number;
                return (
                  <tr
                    key={r.key}
                    onMouseEnter={() => setActive(r.key)}
                    onFocus={() => setActive(r.key)}
                    onClick={() => setActive(r.key)}
                    tabIndex={0}
                    className={cn(
                      "cursor-pointer border-t border-border transition-colors outline-none",
                      active === r.key ? "bg-salvia-50" : "hover:bg-beige-50/60",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-tinta">{r.label}</td>
                    <td className="px-4 py-3">
                      <span className="font-display text-xl font-semibold text-tinta">{value}</span>
                      <span className="ml-1 text-xs text-tinta-400">cm</span>
                      {r.contour && (
                        <span className="block text-[0.7rem] text-tinta-400">contorno ≈ {Math.round(value * 2)} cm</span>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-tinta-500 sm:table-cell">{r.how}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-tinta-500">
          <Ruler className="mt-0.5 size-3.5 shrink-0 text-salvia-500" />
          Talla de etiqueta: <strong className="font-semibold text-tinta">{size}</strong>. Medidas tomadas a mano por
          nuestro equipo con la prenda en plano (margen ±1 cm). Compáralas con una prenda tuya que te quede bien: es
          más confiable que la talla de etiqueta.
        </p>
      </div>
    </div>
  );
}
