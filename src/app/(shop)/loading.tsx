import { Sparkle } from "lucide-react";
import { ProductCardSkeleton } from "@/components/product/ProductCard";

/** Cargador entre secciones: esqueletos con el shimmer de la marca + destello mágico. */
export default function ShopLoading() {
  return (
    <div aria-busy="true" aria-label="Cargando contenido de la tienda" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 py-10 text-tinta-400">
        <Sparkle className="size-4 animate-spin-slow text-salvia-400" fill="currentColor" aria-hidden />
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em]">Abriendo el ropero…</p>
        <Sparkle className="size-4 animate-spin-slow text-rosa-400" fill="currentColor" aria-hidden />
      </div>

      <section aria-hidden className="grid items-center gap-10 pb-16 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="space-y-5">
          <div className="skeleton-shimmer h-3 w-44 rounded-full" />
          <div className="skeleton-shimmer h-16 w-4/5 rounded-2xl" />
          <div className="skeleton-shimmer h-16 w-3/5 rounded-2xl" />
          <div className="skeleton-shimmer h-4 w-full max-w-md rounded-full" />
          <div className="skeleton-shimmer h-4 w-2/3 max-w-md rounded-full" />
          <div className="skeleton-shimmer h-32 w-full max-w-xl rounded-[2rem]" />
        </div>
        <div className="skeleton-shimmer mx-auto aspect-[4/5] w-full max-w-md rounded-b-[2rem] rounded-t-[14rem]" />
      </section>

      <section aria-hidden className="grid grid-cols-2 gap-4 py-10 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </section>

      <section aria-hidden className="grid gap-10 py-16 lg:grid-cols-2">
        <div className="skeleton-shimmer aspect-[4/5] rounded-[2rem]" />
        <div className="space-y-4 self-center">
          <div className="skeleton-shimmer h-3 w-40 rounded-full" />
          <div className="skeleton-shimmer h-12 w-4/5 rounded-2xl" />
          <div className="skeleton-shimmer h-4 w-full rounded-full" />
          <div className="skeleton-shimmer h-4 w-full rounded-full" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded-full" />
        </div>
      </section>
    </div>
  );
}
