import type { DropStatus } from "./drop";

export type ProductCondition =
  | "nuevo_con_etiqueta"
  | "como_nuevo"
  | "muy_bueno"
  | "bueno"
  | "aceptable";

export type ProductCategory =
  | "ropa_superior"
  | "ropa_inferior"
  | "vestidos"
  | "calzado"
  | "accesorios";

export type ProductStatus = "draft" | "published" | "reserved" | "sold";

/** Todas las medidas en centímetros, tomadas con la prenda extendida en plano. */
export type ProductMeasurements = {
  chest?: number; // axila a axila
  waist?: number; // cintura en plano
  length?: number; // largo total
  shoulder?: number; // hombro a hombro
  hip?: number;
  sleeve?: number;
  inseam?: number; // tiro interno / entrepierna
  rise?: number; // tiro
  width?: number; // accesorios: ancho
  height?: number; // accesorios: alto
  depth?: number; // accesorios: fondo
  strap_drop?: number; // caída del asa / correa
  circumference?: number; // sombreros
  brim?: number; // ala del sombrero
  insole?: number; // largo de plantilla (calzado)
  lens_width?: number; // ancho de lente (gafas)
  temple_length?: number; // largo de varilla (gafas)
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory: string;
  size: string;
  measurements: ProductMeasurements;
  condition: ProductCondition;
  condition_score: number; // 1-10
  condition_notes: string;
  price: number;
  original_price?: number;
  images: string[];
  model_3d_url?: string; // Solo accesorios
  ar_supported: boolean;
  drop_id: string;
  status: ProductStatus;
  tags: string[];
  ai_generated_description: string;
  created_at: string;
  color?: string;
  material?: string;
  featured?: boolean;
};

export type ProductDropInfo = {
  id: string;
  name: string;
  number: number;
  status: DropStatus;
};

export type ProductWithDrop = Product & { drop: ProductDropInfo | null };
