import type { CustomerInfo, ShippingInfo } from "@/types/order";
import { getWompiConfig, integritySignature } from "./checkout";

/** Script oficial del widget de Wompi (mismo endpoint para sandbox y producción). */
export const WOMPI_WIDGET_SCRIPT_URL = "https://checkout.wompi.co/widget.js";

export type WompiWidgetParams = {
  publicKey: string;
  currency: "COP";
  amountInCents: number;
  reference: string;
  signature: { integrity: string };
  redirectUrl: string;
  customerData: {
    email: string;
    fullName: string;
    phoneNumber: string;
    phoneNumberPrefix: "+57";
    legalId: string;
    legalIdType: string;
  };
  shippingAddress: {
    addressLine1: string;
    city: string;
    region: string;
    country: "CO";
    phoneNumber: string;
  };
};

/**
 * Parámetros que consume `new WidgetCheckout(...)`. La firma se calcula acá (server-side), nunca en el
 * navegador, porque lleva el secreto de integridad.
 */
export function buildWidgetParams(params: {
  reference: string;
  amountInCents: number;
  redirectUrl: string;
  customer: CustomerInfo;
  shipping: ShippingInfo;
}): WompiWidgetParams | null {
  const cfg = getWompiConfig();
  if (!cfg.enabled) return null;
  return {
    publicKey: cfg.publicKey,
    currency: "COP",
    amountInCents: params.amountInCents,
    reference: params.reference,
    signature: { integrity: integritySignature(params.reference, params.amountInCents) },
    redirectUrl: params.redirectUrl,
    customerData: {
      email: params.customer.email,
      fullName: params.customer.fullName,
      phoneNumber: params.customer.phone,
      phoneNumberPrefix: "+57",
      legalId: params.customer.documentNumber,
      legalIdType: params.customer.documentType,
    },
    shippingAddress: {
      addressLine1: params.shipping.address,
      city: params.shipping.city,
      region: params.shipping.department,
      country: "CO",
      phoneNumber: params.customer.phone,
    },
  };
}
