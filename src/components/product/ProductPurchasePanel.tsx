"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Droplets, MessageCircle, RotateCcw, ShieldCheck, ShoppingBag, Timer, Truck } from "lucide-react";
import { ARButton } from "@/components/3d/ARButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { productToCartItem, useCart } from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import { track } from "@/lib/analytics";
import { IMPACT, RESERVATION_MINUTES, SITE } from "@/lib/constants";
import { versionedModelUrl } from "@/lib/models";
import { discountPercent, formatCOP, whatsappLink } from "@/lib/utils";
import type { ProductMeasurements, ProductWithDrop } from "@/types/product";
import { ConditionBadge } from "./ConditionBadge";

const LABELS: Partial<Record<keyof ProductMeasurements, string>> = {
  chest: "Pecho",
  waist: "Cintura",
  length: "Largo",
  hip: "Cadera",
  insole: "Plantilla",
  width: "Ancho",
  height: "Alto",
  circumference: "Circunferencia",
  lens_width: "Lente",
};

const KEYS: Record<ProductWithDrop["category"], (keyof ProductMeasurements)[]> = {
  ropa_superior: ["chest", "length"],
  vestidos: ["chest", "waist", "length"],
  ropa_inferior: ["waist", "hip", "length"],
  calzado: ["insole"],
  accesorios: ["width", "height", "circumference", "lens_width"],
};

export function ProductPurchasePanel({ product }: { product: ProductWithDrop }) {
  const { add, has, setOpen } = useCart();
  const { status, isAvailable, changedAt } = useProduct(product);
  const inCart = has(product.id);
  const discount = discountPercent(product.price, product.original_price);
  const impact = IMPACT[product.category];
  const keyMeasures = KEYS[product.category]
    .filter((k) => typeof product.measurements[k] === "number")
    .slice(0, 3)
    .map((k) => `${LABELS[k]} ${product.measurements[k]} cm`);

  useEffect(() => {
    track("view_item", {
      product_id: product.id,
      price: product.price,
      category: product.category,
      has_3d: Boolean(product.model_3d_url),
    });
  }, [product.id, product.price, product.category, product.model_3d_url]);

  return (
    <div className="lg:sticky lg:top-32 lg:self-start">
      {product.drop && (
        <Link
          href={`/drops/${product.drop.id}`}
          className="inline-flex items-center gap-2 rounded-full bg-salvia-50 px-3 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-salvia-700 transition hover:bg-salvia-100"
        >
          Drop {String(product.drop.number).padStart(2, "0")} · {product.drop.name}
        </Link>
      )}
      <p className="eyebrow mt-5 text-tinta-400">{product.brand}</p>
      <h1 className="mt-2 text-balance font-display text-4xl font-medium leading-[1.04] sm:text-5xl">{product.name}</h1>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <span className="text-2xl font-semibold">{formatCOP(product.price)}</span>
        {product.original_price && (
          <span className="text-sm text-tinta-400 line-through">{formatCOP(product.original_price)}</span>
        )}
        {discount > 0 && product.original_price && (
          <Badge variant="soft">
            Ahorras {formatCOP(product.original_price - product.price)} · −{discount}%
          </Badge>
        )}
      </div>

      <div className="mt-6">
        <ConditionBadge variant="full" condition={product.condition} score={product.condition_score} />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-white/60 p-4">
        <div>
          <p className="text-sm font-semibold">Talla {product.size}</p>
          {keyMeasures.length > 0 && <p className="mt-0.5 text-xs text-tinta-500">{keyMeasures.join(" · ")}</p>}
        </div>
        <a href="#medidas" className="text-xs font-semibold underline underline-offset-4">
          Ver medidas en cm
        </a>
      </div>

      <AnimatePresence>
        {changedAt && !isAvailable && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden rounded-2xl bg-orange-50 px-4 py-3 text-sm text-terracota"
          >
            Alguien acaba de {status === "sold" ? "comprar" : "reservar"} esta pieza. Si su pago no se completa, volverá
            al catálogo en {RESERVATION_MINUTES} minutos.
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-6 space-y-3">
        {isAvailable ? (
          inCart ? (
            <Button size="lg" variant="sage" className="w-full" onClick={() => setOpen(true)}>
              <Check /> En tu carrito · Ver
            </Button>
          ) : (
            <Button size="lg" className="w-full" onClick={() => add(productToCartItem(product))}>
              <ShoppingBag /> Agregar al carrito
            </Button>
          )
        ) : (
          <Button size="lg" disabled className="w-full">
            {status === "sold" ? "Vendido — ya tiene nueva dueña" : "Reservado por otra persona"}
          </Button>
        )}
        {product.model_3d_url && product.ar_supported && (
          <ARButton modelUrl={versionedModelUrl(product.model_3d_url) ?? product.model_3d_url} productName={product.name} poster={product.images[0]} />
        )}
      </div>

      <p className="mt-4 flex items-center gap-2 text-xs text-tinta-500">
        <Timer className="size-3.5 text-salvia-600" />
        Pieza única: al iniciar el pago la reservamos {RESERVATION_MINUTES} minutos para ti.
      </p>

      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border text-sm">
        <li className="flex items-start gap-3 p-4">
          <Truck className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <span>
            <strong className="font-semibold">Bogotá: mismo día</strong> si pides antes de las 2:00 p. m. · Nacional: 2
            a 4 días hábiles
          </span>
        </li>
        <li className="flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <span>Pago seguro con Wompi: PSE, Nequi, Daviplata, tarjetas o contra entrega</span>
        </li>
        <li className="flex items-start gap-3 p-4">
          <RotateCcw className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <span>Cambios por talla durante 5 días si las medidas no coinciden con lo publicado</span>
        </li>
        <li className="flex items-start gap-3 p-4">
          <Droplets className="mt-0.5 size-4 shrink-0 text-salvia-600" />
          <span>
            Ahorras ~{impact.water.toLocaleString("es-CO")} litros de agua y {impact.co2} kg de CO₂ frente a comprarla
            nueva
          </span>
        </li>
      </ul>

      <a
        href={whatsappLink(SITE.whatsapp, `Hola Mag&co, tengo una pregunta sobre "${product.name}" (${product.slug})`)}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tinta-700 underline-offset-4 hover:underline"
      >
        <MessageCircle className="size-4 text-[#25a35a]" /> ¿Dudas con la talla? Te medimos lo que necesites
      </a>
    </div>
  );
}
