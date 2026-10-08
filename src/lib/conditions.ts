import type { ProductCondition } from "@/types/product";

export type ConditionMeta = {
  key: ProductCondition;
  label: string;
  range: [number, number];
  summary: string;
  details: string[];
  tone: {
    badge: string;
    bar: string;
    soft: string;
    text: string;
  };
};

export const CONDITION_ORDER: ProductCondition[] = [
  "nuevo_con_etiqueta",
  "como_nuevo",
  "muy_bueno",
  "bueno",
  "aceptable",
];

export const CONDITION_META: Record<ProductCondition, ConditionMeta> = {
  nuevo_con_etiqueta: {
    key: "nuevo_con_etiqueta",
    label: "Nuevo con etiqueta",
    range: [10, 10],
    summary: "Nunca usado. Conserva sus etiquetas originales.",
    details: [
      "Sin señales de uso ni lavado",
      "Etiquetas originales intactas",
      "Revisado costura por costura",
    ],
    tone: {
      badge: "bg-salvia-600 text-white ring-salvia-700/30",
      bar: "bg-salvia-600",
      soft: "bg-salvia-100",
      text: "text-salvia-700",
    },
  },
  como_nuevo: {
    key: "como_nuevo",
    label: "Como nuevo",
    range: [9, 9],
    summary: "Usado muy pocas veces, sin señales visibles de uso.",
    details: [
      "Sin manchas, motas ni decoloración",
      "Cierres y herrajes perfectos",
      "Lavado y vaporizado profesional",
    ],
    tone: {
      badge: "bg-salvia-100 text-salvia-700 ring-salvia-300",
      bar: "bg-salvia-500",
      soft: "bg-salvia-50",
      text: "text-salvia-700",
    },
  },
  muy_bueno: {
    key: "muy_bueno",
    label: "Muy bueno",
    range: [7, 8],
    summary: "Uso ligero con detalles mínimos que no afectan la apariencia.",
    details: [
      "Desgaste leve en zonas de roce",
      "Cada detalle está fotografiado",
      "Funcionalidad al 100%",
    ],
    tone: {
      badge: "bg-beige-100 text-tinta-700 ring-beige-300",
      bar: "bg-salvia-400",
      soft: "bg-beige-50",
      text: "text-tinta-700",
    },
  },
  bueno: {
    key: "bueno",
    label: "Bueno",
    range: [5, 6],
    summary: "Uso evidente pero bien cuidado. Todo está documentado.",
    details: [
      "Desgaste visible (motas o decoloración leve)",
      "Precio ajustado a su estado real",
      "Fotos de cerca de cada detalle",
    ],
    tone: {
      badge: "bg-amber-50 text-amber-900 ring-amber-200",
      bar: "bg-ambar",
      soft: "bg-amber-50",
      text: "text-amber-900",
    },
  },
  aceptable: {
    key: "aceptable",
    label: "Aceptable",
    range: [1, 4],
    summary: "Desgaste notable o arreglos pendientes. Ideal para intervenir.",
    details: [
      "Puede requerir un arreglo menor",
      "Perfecto para upcycling",
      "Precio muy reducido",
    ],
    tone: {
      badge: "bg-orange-50 text-terracota ring-orange-200",
      bar: "bg-terracota",
      soft: "bg-orange-50",
      text: "text-terracota",
    },
  },
};

export function conditionFromScore(score: number): ProductCondition {
  if (score >= 10) return "nuevo_con_etiqueta";
  if (score >= 9) return "como_nuevo";
  if (score >= 7) return "muy_bueno";
  if (score >= 5) return "bueno";
  return "aceptable";
}
