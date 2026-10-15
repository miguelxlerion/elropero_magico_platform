import type { ProductCategory } from "@/types/product";

export const SITE = {
  name: "El Ropero Mag&co",
  shortName: "Mag&co",
  tagline: "Moda con historia, curada en Bogotá",
  whatsapp: "573133129691",
  whatsappDisplay: "+57 313 312 9691",
  instagram: "elroperomagco",
  email: "elroperomagicoweb@gmail.com",
  city: "Bogotá, Colombia",
  dropCadenceDays: 15,
} as const;

export const CATEGORIES: ProductCategory[] = [
  "ropa_superior",
  "ropa_inferior",
  "vestidos",
  "calzado",
  "accesorios",
];

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  ropa_superior: "Ropa superior",
  ropa_inferior: "Ropa inferior",
  vestidos: "Vestidos",
  calzado: "Calzado",
  accesorios: "Accesorios",
};

export type SortOption = "recientes" | "precio_asc" | "precio_desc" | "condicion";

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recientes", label: "Recién llegados" },
  { value: "precio_asc", label: "Precio: menor a mayor" },
  { value: "precio_desc", label: "Precio: mayor a menor" },
  { value: "condicion", label: "Mejor condición" },
];

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "Única"];

export function compareSizes(a: string, b: string) {
  const ia = SIZE_ORDER.indexOf(a);
  const ib = SIZE_ORDER.indexOf(b);
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  const na = parseFloat(a);
  const nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  return a.localeCompare(b, "es");
}

/**
 * Huella evitada aproximada al comprar de segunda mano vs. nuevo
 * (estimaciones divulgadas por ONU Medio Ambiente / WRAP).
 */
export const IMPACT: Record<ProductCategory, { water: number; co2: number }> = {
  ropa_superior: { water: 2700, co2: 8 },
  ropa_inferior: { water: 7500, co2: 33 },
  vestidos: { water: 3500, co2: 12 },
  calzado: { water: 8000, co2: 14 },
  accesorios: { water: 1200, co2: 5 },
};

export const RESERVATION_MINUTES = 30;

export const MODEL_LIBRARY: { url: string; label: string }[] = [
  { url: "/models/gafas-aviador.glb", label: "Gafas aviador · metal dorado" },
  { url: "/models/gafas-carey.glb", label: "Gafas acetato carey" },
  { url: "/models/bolso-cuero.glb", label: "Bolso estructurado de cuero" },
  { url: "/models/bolso-bandolera.glb", label: "Bolso bandolera media luna" },
  { url: "/models/mochila-wayuu.glb", label: "Mochila wayuu" },
  { url: "/models/sombrero-panama.glb", label: "Sombrero aguadeño / panamá" },
  { url: "/models/sombrero-vueltiao.glb", label: "Sombrero vueltiao" },
];
