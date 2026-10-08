import { createHash } from "node:crypto";
import type { CustomerInfo, PaymentMethod, ShippingInfo } from "@/types/order";

export const WOMPI_CHECKOUT_URL = "https://checkout.wompi.co/p/";

export type WompiTransactionStatus = "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";

export type WompiTransaction = {
  id: string;
  reference: string;
  status: WompiTransactionStatus;
  amount_in_cents: number;
  payment_method_type?: string;
  status_message?: string | null;
};

export type WompiEvent = {
  event: string;
  data: { transaction?: WompiTransaction } & Record<string, unknown>;
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

/** Tipos de método de pago que maneja Wompi para cada opción del checkout. */
export const WOMPI_METHOD_TYPE: Record<Exclude<PaymentMethod, "cod">, string> = {
  pse: "PSE",
  nequi: "NEQUI",
  daviplata: "DAVIPLATA",
  card: "CARD",
};

export function getWompiConfig() {
  const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY ?? process.env.WOMPI_PUBLIC_KEY ?? "";
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET ?? "";
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET ?? "";
  const isSandbox = publicKey.startsWith("pub_test_");
  return {
    publicKey,
    integritySecret,
    eventsSecret,
    isSandbox,
    apiBase: isSandbox ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1",
    enabled: Boolean(publicKey && integritySecret),
  };
}

export function isWompiConfigured() {
  return getWompiConfig().enabled;
}

/**
 * Firma de integridad: SHA256("<Referencia><MontoEnCentavos><Moneda>[<FechaExpiración>]<SecretoIntegridad>")
 */
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency = "COP",
  expirationTime?: string,
) {
  const { integritySecret } = getWompiConfig();
  return createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${expirationTime ?? ""}${integritySecret}`)
    .digest("hex");
}

export function buildCheckoutUrl(params: {
  reference: string;
  amountInCents: number;
  redirectUrl: string;
  customer: CustomerInfo;
  shipping: ShippingInfo;
}) {
  const cfg = getWompiConfig();
  const qs = new URLSearchParams();
  qs.set("public-key", cfg.publicKey);
  qs.set("currency", "COP");
  qs.set("amount-in-cents", String(params.amountInCents));
  qs.set("reference", params.reference);
  qs.set("signature:integrity", integritySignature(params.reference, params.amountInCents));
  qs.set("redirect-url", params.redirectUrl);
  qs.set("customer-data:email", params.customer.email);
  qs.set("customer-data:full-name", params.customer.fullName);
  qs.set("customer-data:phone-number", params.customer.phone);
  qs.set("customer-data:phone-number-prefix", "+57");
  qs.set("customer-data:legal-id", params.customer.documentNumber);
  qs.set("customer-data:legal-id-type", params.customer.documentType);
  qs.set("shipping-address:address-line-1", params.shipping.address);
  qs.set("shipping-address:city", params.shipping.city);
  qs.set("shipping-address:region", params.shipping.department);
  qs.set("shipping-address:country", "CO");
  qs.set("shipping-address:phone-number", params.customer.phone);
  return `${WOMPI_CHECKOUT_URL}?${qs.toString()}`;
}

export async function getTransaction(id: string): Promise<WompiTransaction | null> {
  const { apiBase } = getWompiConfig();
  try {
    const res = await fetch(`${apiBase}/transactions/${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: WompiTransaction };
    return json.data ?? null;
  } catch {
    return null;
  }
}

function readPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, source);
}

/** Verifica el checksum de eventos (webhook) enviado por Wompi. */
export function verifyEventChecksum(event: WompiEvent) {
  const { eventsSecret } = getWompiConfig();
  if (!eventsSecret || !event?.signature?.properties) return false;
  const values = event.signature.properties.map((p) => String(readPath(event.data, p) ?? "")).join("");
  const checksum = createHash("sha256").update(`${values}${event.timestamp}${eventsSecret}`).digest("hex");
  return checksum.toUpperCase() === String(event.signature.checksum).toUpperCase();
}
