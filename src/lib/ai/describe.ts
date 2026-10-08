import { CATEGORY_LABELS, IMPACT } from "@/lib/constants";
import { CONDITION_META, conditionFromScore } from "@/lib/conditions";
import { normalizeText } from "@/lib/utils";
import type { ProductCategory, ProductMeasurements } from "@/types/product";

export type CopyInput = {
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  size?: string;
  color?: string;
  material?: string;
  condition_score: number;
  condition_notes?: string;
  original_price?: number;
  measurements?: ProductMeasurements | Record<string, number>;
  image_url?: string;
  has3d?: boolean;
};

export type CopyOutput = {
  description: string;
  tags: string[];
  suggested_price: number;
  price_rationale: string;
  engine: "openai" | "local";
  model?: string;
};

type Tier = "lujo" | "premium" | "artesanal" | "estandar";

const LUXURY = [
  "burberry", "prada", "gucci", "max mara", "johanna ortiz", "silvia tcherassi", "persol",
  "louis vuitton", "chanel", "dior", "celine", "loewe", "saint laurent", "hermes", "bottega",
];
const PREMIUM = [
  "levi", "massimo dutti", "cos", "timberland", "ray-ban", "ray ban", "diesel", "velez",
  "mario hernandez", "arturo calle", "bosi", "other stories", "tommy", "lacoste", "ralph lauren", "mango",
];
const ARTISAN = ["artesan", "wayuu", "zenu", "aguaden", "nobsa", "tuchin", "upcycled", "taller", "pieza unica"];
const COLOMBIAN = [
  "velez", "mario hernandez", "arturo calle", "bosi", "johanna ortiz", "silvia tcherassi",
  "wayuu", "zenu", "aguaden", "nobsa", "tuchin", "bogota",
];

function brandTier(brand: string): Tier {
  const b = normalizeText(brand);
  if (LUXURY.some((x) => b.includes(x))) return "lujo";
  if (ARTISAN.some((x) => b.includes(x))) return "artesanal";
  if (PREMIUM.some((x) => b.includes(x))) return "premium";
  return "estandar";
}

const BASE_PRICE: Record<ProductCategory, Record<Tier, number>> = {
  ropa_superior: { estandar: 85_000, premium: 160_000, artesanal: 140_000, lujo: 650_000 },
  ropa_inferior: { estandar: 70_000, premium: 130_000, artesanal: 110_000, lujo: 450_000 },
  vestidos: { estandar: 85_000, premium: 150_000, artesanal: 140_000, lujo: 900_000 },
  calzado: { estandar: 90_000, premium: 190_000, artesanal: 150_000, lujo: 600_000 },
  accesorios: { estandar: 60_000, premium: 220_000, artesanal: 170_000, lujo: 700_000 },
};

const CONDITION_RATIO: Record<number, number> = {
  10: 0.45, 9: 0.38, 8: 0.33, 7: 0.28, 6: 0.23, 5: 0.19, 4: 0.15, 3: 0.12, 2: 0.1, 1: 0.08,
};

const roundTo = (value: number, step = 5_000) => Math.max(step, Math.round(value / step) * step);

function suggestPrice(input: CopyInput, tier: Tier) {
  const score = Math.min(10, Math.max(1, Math.round(input.condition_score)));
  if (input.original_price && input.original_price > 0) {
    const ratio = CONDITION_RATIO[score] * (tier === "lujo" ? 0.45 : tier === "artesanal" ? 1.25 : 1);
    const price = roundTo(input.original_price * ratio);
    return {
      price,
      rationale: `${Math.round(ratio * 100)}% del precio original por estado ${score}/10 y marca ${tier}.`,
    };
  }
  const base = BASE_PRICE[input.category][tier];
  const price = roundTo(base * Math.pow(score / 9, 0.9));
  return {
    price,
    rationale: `Referencia de mercado para ${CATEGORY_LABELS[input.category].toLowerCase()} ${tier} ajustada por estado ${score}/10.`,
  };
}

const lower = (s?: string) => (s ?? "").trim().toLowerCase();

function openerFor(input: CopyInput) {
  const n = input.name.trim();
  const b = input.brand.trim();
  switch (input.category) {
    case "ropa_superior":
      return `${n} de ${b}: una pieza de capa versátil que funciona igual para la oficina que para un domingo de café en Chapinero.`;
    case "ropa_inferior":
      return `${n} de ${b}, una base atemporal que combina con todo tu ropero y mejora con cada uso.`;
    case "vestidos":
      return `${n} de ${b}: fresco, fácil de llevar y con ese aire de pieza especial que no encuentras en la moda rápida.`;
    case "calzado":
      return `${n} de ${b}, un par con carácter y horma ya amoldada, listo para seguir caminando la ciudad.`;
    case "accesorios":
      return input.has3d
        ? `${n} de ${b}: el detalle que termina cualquier look, y que puedes girar en 3D y ver en tu espacio con realidad aumentada antes de decidir.`
        : `${n} de ${b}: el detalle que termina cualquier look y le da personalidad a lo básico.`;
  }
}

function fitLine(input: CopyInput) {
  const m = (input.measurements ?? {}) as ProductMeasurements;
  const size = input.size ? `talla ${input.size}` : "talla única";
  switch (input.category) {
    case "ropa_superior":
    case "vestidos": {
      const parts: string[] = [];
      if (m.chest) parts.push(`${m.chest} cm de axila a axila (contorno aprox. ${m.chest * 2} cm)`);
      if (m.waist && input.category === "vestidos") parts.push(`${m.waist} cm de cintura en plano`);
      if (m.length) parts.push(`${m.length} cm de largo`);
      if (m.shoulder) parts.push(`${m.shoulder} cm de hombro a hombro`);
      if (!parts.length) return `Marcada ${size}.`;
      const contour = (m.chest ?? 0) * 2;
      const fit = contour >= 112 ? "calce amplio, tipo oversize" : contour >= 96 ? "calce regular" : contour ? "calce entallado" : "";
      return `Marcada ${size}, mide ${parts.join(", ")}${fit ? `: ${fit}` : ""}. Compárala con una prenda tuya que te quede bien.`;
    }
    case "ropa_inferior": {
      const parts: string[] = [];
      if (m.waist) parts.push(`cintura de ${m.waist} cm en plano (contorno aprox. ${m.waist * 2} cm)`);
      if (m.hip) parts.push(`cadera de ${m.hip} cm en plano`);
      if (m.inseam) parts.push(`entrepierna de ${m.inseam} cm`);
      if (m.rise) parts.push(`tiro de ${m.rise} cm`);
      if (m.length) parts.push(`largo total de ${m.length} cm`);
      return parts.length ? `Marcada ${size}, con ${parts.join(", ")}.` : `Marcada ${size}.`;
    }
    case "calzado":
      return m.insole
        ? `Talla ${input.size ?? ""} con plantilla interna de ${m.insole} cm: mide tu pie del talón al dedo más largo para confirmar.`
        : `Talla ${input.size ?? ""}.`;
    case "accesorios": {
      const parts: string[] = [];
      if (m.width) parts.push(`${m.width} cm de ancho`);
      if (m.height) parts.push(`${m.height} cm de alto`);
      if (m.depth) parts.push(`${m.depth} cm de fondo`);
      if (m.strap_drop) parts.push(`caída de asa de ${m.strap_drop} cm`);
      if (m.circumference) parts.push(`circunferencia interna de ${m.circumference} cm`);
      if (m.brim) parts.push(`ala de ${m.brim} cm`);
      if (m.lens_width) parts.push(`lente de ${m.lens_width} cm`);
      if (m.temple_length) parts.push(`varilla de ${m.temple_length} cm`);
      return parts.length ? `Medidas reales: ${parts.join(", ")}.` : "";
    }
  }
}

export function generateLocalCopy(input: CopyInput): CopyOutput {
  const tier = brandTier(input.brand);
  const condition = conditionFromScore(input.condition_score);
  const meta = CONDITION_META[condition];
  const impact = IMPACT[input.category];
  const notes = input.condition_notes?.trim();

  const materialLine = input.material
    ? `Material: ${lower(input.material)}${input.color ? `, en tono ${lower(input.color)}` : ""}.`
    : input.color
      ? `Color ${lower(input.color)}.`
      : "";

  const conditionLine = `Estado ${meta.label.toLowerCase()} (${input.condition_score}/10): ${
    notes ? notes.replace(/\.?$/, ".") : meta.summary
  }${input.condition_score <= 8 ? " Cada detalle está fotografiado de cerca para que compres con total claridad." : ""}`;

  const impactLine = `Al elegirla de segunda mano evitas cerca de ${impact.water.toLocaleString("es-CO")} litros de agua y ${impact.co2} kg de CO₂ frente a comprarla nueva.`;

  const description = [openerFor(input), materialLine, fitLine(input), conditionLine, impactLine]
    .filter(Boolean)
    .join(" ");

  const brandNorm = normalizeText(input.brand);
  const tags = Array.from(
    new Set(
      [
        lower(CATEGORY_LABELS[input.category]),
        lower(input.subcategory),
        lower(input.brand),
        lower(input.color),
        ...lower(input.material)
          .split(/[,%·\d/]+/)
          .map((s) => s.trim())
          .filter((s) => s.length > 3 && s.length < 24),
        meta.label.toLowerCase(),
        "segunda mano",
        tier === "lujo" ? "lujo" : "",
        tier === "artesanal" ? "artesanal" : "",
        COLOMBIAN.some((x) => brandNorm.includes(x)) ? "hecho en colombia" : "",
        input.has3d ? "probador 3d" : "",
      ].filter((t) => t && t.length > 1),
    ),
  ).slice(0, 10);

  const { price, rationale } = suggestPrice(input, tier);
  return { description, tags, suggested_price: price, price_rationale: rationale, engine: "local" };
}

type OpenAIResponse = { choices?: { message?: { content?: string } }[] };

async function generateWithOpenAI(input: CopyInput, local: CopyOutput): Promise<CopyOutput | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const content: Array<
    { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text: `Ficha técnica de la prenda (medidas en cm, en plano): ${JSON.stringify({ ...input, image_url: undefined })}.
Devuelve JSON con: "description" (90-140 palabras, español de Colombia; incluye calce según medidas, estado real con su puntaje y notas sin maquillarlas, y el beneficio de sostenibilidad), "tags" (6-10 etiquetas en minúsculas), "suggested_price" (número en COP redondeado a miles; referencia local: ${local.suggested_price}).`,
    },
  ];
  if (input.image_url) content.push({ type: "image_url", image_url: { url: input.image_url } });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres el copywriter de El Ropero Mag&co, tienda de moda de segunda mano curada en Bogotá. Tono cálido, premium y honesto. Nunca exageres el estado de una prenda: la transparencia es la marca. Responde solo JSON válido.",
        },
        { role: "user", content },
      ],
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as OpenAIResponse;
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { description?: unknown; tags?: unknown; suggested_price?: unknown };
  if (typeof parsed.description !== "string" || parsed.description.length < 40) return null;
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase()).slice(0, 10)
    : local.tags;
  const suggested =
    typeof parsed.suggested_price === "number" && parsed.suggested_price > 0
      ? roundTo(parsed.suggested_price, 1_000)
      : local.suggested_price;
  return {
    description: parsed.description.trim(),
    tags,
    suggested_price: suggested,
    price_rationale: `Sugerido por ${model} con base en marca, estado y mercado local.`,
    engine: "openai",
    model,
  };
}

export async function generateProductCopy(input: CopyInput): Promise<CopyOutput> {
  const local = generateLocalCopy(input);
  try {
    const ai = await generateWithOpenAI(input, local);
    if (ai) return ai;
  } catch (error) {
    console.warn("[ai] Fallback al motor local:", error);
  }
  return local;
}

export function aiEngineInfo() {
  return process.env.OPENAI_API_KEY
    ? { engine: "openai" as const, model: process.env.OPENAI_MODEL || "gpt-4o-mini" }
    : { engine: "local" as const, model: "motor de reglas Mag&co" };
}
