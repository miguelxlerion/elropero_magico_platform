"use client";

import { useEffect, useRef, useState } from "react";
import type { Product, ProductStatus } from "@/types/product";

/**
 * Disponibilidad en vivo de una prenda única: consulta periódicamente su estado
 * para avisar si alguien la reservó o compró mientras la estás mirando.
 */
export function useProduct(product: Pick<Product, "id" | "status">, intervalMs = 20_000) {
  const [status, setStatus] = useState<ProductStatus>(product.status);
  const [changedAt, setChangedAt] = useState<number | null>(null);
  const statusRef = useRef<ProductStatus>(product.status);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(`/api/products/${product.id}/status`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { status?: ProductStatus };
        if (cancelled || !data.status || data.status === statusRef.current) return;
        statusRef.current = data.status;
        setStatus(data.status);
        setChangedAt(Date.now());
      } catch {
        // Silencioso: reintenta en el siguiente ciclo
      }
    };
    const timer = window.setInterval(check, intervalMs);
    document.addEventListener("visibilitychange", check);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [product.id, intervalMs]);

  return { status, isAvailable: status === "published", changedAt };
}
