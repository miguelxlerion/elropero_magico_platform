"use client";

import { useCallback, useRef, useState } from "react";
import { WOMPI_WIDGET_SCRIPT_URL, type WompiWidgetParams } from "@/lib/wompi/widget";
import type { WompiTransactionResult } from "@/types/wompi-widget";

let loading: Promise<void> | null = null;

function loadWidgetScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("solo-navegador"));
  if (window.WidgetCheckout) return Promise.resolve();
  if (!loading) {
    loading = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = WOMPI_WIDGET_SCRIPT_URL;
      script.async = true;
      script.onload = () => (window.WidgetCheckout ? resolve() : reject(new Error("widget-no-expuesto")));
      script.onerror = () => {
        loading = null;
        script.remove();
        reject(new Error("no-se-pudo-cargar"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/** Abre el widget de Wompi en la propia página. Rechaza si el script no está disponible. */
export function useWompiWidget() {
  const [available, setAvailable] = useState(true);
  const inFlight = useRef(false);

  const open = useCallback(async (params: WompiWidgetParams) => {
    if (inFlight.current) return null;
    inFlight.current = true;
    try {
      await loadWidgetScript();
      const Ctor = window.WidgetCheckout;
      if (!Ctor) throw new Error("widget-no-disponible");
      return await new Promise<WompiTransactionResult>((resolve, reject) => {
        const checkout = new Ctor(params);
        checkout.open((result) => resolve(result ?? {}));
      });
    } catch (error) {
      setAvailable(false);
      throw error;
    } finally {
      inFlight.current = false;
    }
  }, []);

  return { open, available };
}
