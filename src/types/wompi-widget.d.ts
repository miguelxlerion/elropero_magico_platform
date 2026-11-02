import type { WompiWidgetParams } from "@/lib/wompi/widget";

type WompiTransactionResult = {
  transaction?: {
    id?: string;
    reference?: string;
    status?: string;
  };
};

type WompiWidgetInstance = {
  open(callback: (result?: WompiTransactionResult) => void): void;
};

declare global {
  interface WidgetCheckoutOptions extends Omit<WompiWidgetParams, "publicKey"> {
    publicKey: string;
  }

  var WidgetCheckout: (new (options: WidgetCheckoutOptions) => WompiWidgetInstance) | undefined;
}

export type { WompiTransactionResult, WompiWidgetInstance };
