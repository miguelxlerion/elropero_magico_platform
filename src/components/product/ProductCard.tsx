"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Box, Check, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { productToCartItem, useCart } from "@/hooks/useCart";
import { cn, discountPercent, formatCOP } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ConditionBadge } from "./ConditionBadge";

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: Product;
  index?: number;
  priority?: boolean;
}) {
  const { add, has } = useCart();
  const inCart = has(product.id);
  const available = product.status === "published";
  const discount = discountPercent(product.price, product.original_price);
  const [primary, secondary] = product.images;
  const href = `/producto/${product.slug}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, delay: (index % 4) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="editorial-card group relative aspect-[4/5] overflow-hidden bg-beige-100">
        <Link href={href} className="absolute inset-0" aria-label={`${product.name} de ${product.brand}`}>
          {primary && (
            <Image
              src={primary}
              alt={`${product.name} de ${product.brand}`}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
              className={cn(
                "object-cover transition duration-[1200ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.045]",
                secondary && "group-hover:opacity-0",
                !available && "grayscale-[50%]",
              )}
            />
          )}
          {secondary && (
            <Image
              src={secondary}
              alt=""
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 33vw, 50vw"
              className="object-cover opacity-0 transition duration-700 group-hover:scale-[1.045] group-hover:opacity-100"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          <span className="editorial-badge">Pieza única</span>
          {product.model_3d_url && (
            <Badge variant="glass">
              <Box /> 3D · AR
            </Badge>
          )}
          {discount >= 50 && available && <Badge>-{discount}%</Badge>}
        </div>

        <div className="pointer-events-none absolute bottom-3 left-3">
          <ConditionBadge
            condition={product.condition}
            score={product.condition_score}
            showTooltip={false}
            className="bg-white/85 text-tinta ring-white/60 backdrop-blur"
          />
        </div>

        {!available && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-hueso/35">
            <span className="rounded-full bg-tinta px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-hueso">
              {product.status === "sold" ? "Vendido" : "Reservado"}
            </span>
          </div>
        )}

        {available && (
          <button
            type="button"
            onClick={() => add(productToCartItem(product))}
            aria-label={inCart ? "Ya está en tu ropero" : `Agregar ${product.name} al ropero`}
            className="quick-add-bar"
          >
            <span>{inCart ? "En tu ropero ✓" : "Agregar al ropero"}</span>
            {inCart ? <Check className="size-4" /> : <Plus className="size-4" />}
          </button>
        )}
      </div>

      <Link href={href} className="mt-3.5 block space-y-1 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <p className="eyebrow truncate text-tinta-400">{product.brand}</p>
          <p className="shrink-0 text-xs font-semibold text-salvia-600">{product.condition_score}/10 · revisado</p>
        </div>
        <h3 className="line-clamp-1 font-display text-xl leading-snug text-tinta transition-colors group-hover:text-salvia-700">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-2">
          <span className="text-[0.95rem] font-semibold">{formatCOP(product.price)}</span>
          {product.original_price && (
            <span className="text-xs text-tinta-400 line-through">{formatCOP(product.original_price)}</span>
          )}
          {discount > 0 && <span className="text-xs font-medium text-salvia-600">-{discount}%</span>}
        </div>
        <p className="text-xs text-tinta-500">Talla {product.size}</p>
      </Link>
    </motion.article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <div className="skeleton-shimmer aspect-[3/4] rounded-[1.25rem]" />
      <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
      <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
    </div>
  );
}
