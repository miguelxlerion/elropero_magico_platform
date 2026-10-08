import type { PaymentMethod, ShippingZone } from "@/types/order";
import { normalizeText } from "./utils";

export const CITIES: { name: string; department: string }[] = [
  { name: "Bogotá D.C.", department: "Bogotá D.C." },
  { name: "Medellín", department: "Antioquia" },
  { name: "Cali", department: "Valle del Cauca" },
  { name: "Barranquilla", department: "Atlántico" },
  { name: "Cartagena", department: "Bolívar" },
  { name: "Bucaramanga", department: "Santander" },
  { name: "Pereira", department: "Risaralda" },
  { name: "Manizales", department: "Caldas" },
  { name: "Santa Marta", department: "Magdalena" },
  { name: "Cúcuta", department: "Norte de Santander" },
  { name: "Ibagué", department: "Tolima" },
  { name: "Villavicencio", department: "Meta" },
  { name: "Armenia", department: "Quindío" },
  { name: "Pasto", department: "Nariño" },
  { name: "Montería", department: "Córdoba" },
  { name: "Neiva", department: "Huila" },
  { name: "Popayán", department: "Cauca" },
  { name: "Tunja", department: "Boyacá" },
  { name: "Valledupar", department: "Cesar" },
  { name: "Chía", department: "Cundinamarca" },
  { name: "Zipaquirá", department: "Cundinamarca" },
  { name: "Soacha", department: "Cundinamarca" },
];

export const SHIPPING_RULES = {
  bogota: {
    cost: 9_900,
    eta: "Mismo día (pedidos antes de las 2:00 p. m.)",
    label: "Bogotá · Mensajería mismo día",
  },
  nacional: {
    cost: 16_900,
    eta: "2 a 4 días hábiles",
    label: "Nacional · Transportadora aliada",
  },
  freeBogotaFrom: 350_000,
  codFee: 7_900,
} as const;

export function getZone(city: string): ShippingZone {
  return normalizeText(city).startsWith("bogota") ? "bogota" : "nacional";
}

export type ShippingQuote = {
  zone: ShippingZone;
  cost: number;
  baseCost: number;
  eta: string;
  label: string;
  freeApplied: boolean;
};

export function getShippingQuote(city: string, subtotal: number): ShippingQuote {
  const zone = getZone(city);
  const rule = SHIPPING_RULES[zone];
  const freeApplied = zone === "bogota" && subtotal >= SHIPPING_RULES.freeBogotaFrom;
  return {
    zone,
    baseCost: rule.cost,
    cost: freeApplied ? 0 : rule.cost,
    eta: rule.eta,
    label: rule.label,
    freeApplied,
  };
}

export type OrderTotals = {
  subtotal: number;
  shipping: number;
  codFee: number;
  total: number;
  quote: ShippingQuote;
};

export function calculateTotals(
  subtotal: number,
  city: string,
  paymentMethod: PaymentMethod | undefined,
): OrderTotals {
  const quote = getShippingQuote(city || "Bogotá", subtotal);
  const codFee = paymentMethod === "cod" ? SHIPPING_RULES.codFee : 0;
  return {
    subtotal,
    shipping: subtotal > 0 ? quote.cost : 0,
    codFee: subtotal > 0 ? codFee : 0,
    total: subtotal > 0 ? subtotal + quote.cost + codFee : 0,
    quote,
  };
}
