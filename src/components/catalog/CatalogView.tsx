"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORY_LABELS, SORT_OPTIONS, compareSizes, type SortOption } from "@/lib/constants";
import { CONDITION_META } from "@/lib/conditions";
import { formatCOP, normalizeText } from "@/lib/utils";
import { countActiveFilters, useFilterStore } from "@/stores/filterStore";
import type { Product, ProductCategory, ProductCondition } from "@/types/product";
import { FilterPanel, type Facets } from "./FilterPanel";

type CatalogViewProps = {
  products: Product[];
  initialCategory?: ProductCategory;
  initialOnly3D?: boolean;
};

const statusRank = (p: Product) => (p.status === "published" ? 0 : p.status === "reserved" ? 1 : 2);

export function CatalogView({ products, initialCategory, initialOnly3D = false }: CatalogViewProps) {
  const filters = useFilterStore();
  const { hydrate } = filters;
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    hydrate({ categories: initialCategory ? [initialCategory] : [], only3D: initialOnly3D });
  }, [hydrate, initialCategory, initialOnly3D]);

  const facets: Facets = useMemo(() => {
    const brandMap = new Map<string, number>();
    const categoryCounts = {} as Record<ProductCategory, number>;
    const conditionCounts = {} as Record<ProductCondition, number>;
    for (const p of products) {
      brandMap.set(p.brand, (brandMap.get(p.brand) ?? 0) + 1);
      categoryCounts[p.category] = (categoryCounts[p.category] ?? 0) + 1;
      conditionCounts[p.condition] = (conditionCounts[p.condition] ?? 0) + 1;
    }
    const prices = products.map((p) => p.price);
    const step = 5000;
    return {
      sizes: Array.from(new Set(products.map((p) => p.size))).sort(compareSizes),
      brands: Array.from(brandMap, ([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "es")),
      categoryCounts,
      conditionCounts,
      priceMin: prices.length ? Math.floor(Math.min(...prices) / step) * step : 0,
      priceMax: prices.length ? Math.ceil(Math.max(...prices) / step) * step : 1_000_000,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = normalizeText(filters.query);
    const list = products.filter((p) => {
      if (filters.categories.length && !filters.categories.includes(p.category)) return false;
      if (filters.sizes.length && !filters.sizes.includes(p.size)) return false;
      if (filters.brands.length && !filters.brands.includes(p.brand)) return false;
      if (filters.conditions.length && !filters.conditions.includes(p.condition)) return false;
      if (filters.priceRange && (p.price < filters.priceRange[0] || p.price > filters.priceRange[1])) return false;
      if (filters.onlyAvailable && p.status !== "published") return false;
      if (filters.only3D && !p.model_3d_url) return false;
      if (q) {
        const haystack = normalizeText([p.name, p.brand, p.subcategory, p.color ?? "", ...p.tags].join(" "));
        if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
      }
      return true;
    });
    const sorters: Record<SortOption, (a: Product, b: Product) => number> = {
      recientes: (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
      precio_asc: (a, b) => a.price - b.price,
      precio_desc: (a, b) => b.price - a.price,
      condicion: (a, b) => b.condition_score - a.condition_score,
    };
    return list.sort((a, b) => statusRank(a) - statusRank(b) || sorters[filters.sort](a, b));
  }, [products, filters]);

  const active = countActiveFilters(filters);
  const chips: { key: string; label: string; onRemove: () => void }[] = [
    ...filters.categories.map((c) => ({ key: `c-${c}`, label: CATEGORY_LABELS[c], onRemove: () => filters.toggleCategory(c) })),
    ...filters.sizes.map((s) => ({ key: `s-${s}`, label: `Talla ${s}`, onRemove: () => filters.toggleSize(s) })),
    ...filters.brands.map((b) => ({ key: `b-${b}`, label: b, onRemove: () => filters.toggleBrand(b) })),
    ...filters.conditions.map((c) => ({ key: `k-${c}`, label: CONDITION_META[c].label, onRemove: () => filters.toggleCondition(c) })),
    ...(filters.priceRange
      ? [{ key: "price", label: `${formatCOP(filters.priceRange[0])} – ${formatCOP(filters.priceRange[1])}`, onRemove: () => filters.setPriceRange(null) }]
      : []),
    ...(filters.onlyAvailable ? [{ key: "avail", label: "Disponibles", onRemove: () => filters.setOnlyAvailable(false) }] : []),
    ...(filters.only3D ? [{ key: "3d", label: "Probador 3D", onRemove: () => filters.setOnly3D(false) }] : []),
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow text-tinta-400">Filtros</p>
            {active > 0 && (
              <button type="button" onClick={filters.reset} className="text-xs font-semibold underline underline-offset-4">
                Limpiar ({active})
              </button>
            )}
          </div>
          <FilterPanel facets={facets} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="sticky top-[6.6rem] z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 bg-hueso/90 px-4 py-3 backdrop-blur-lg sm:mx-0 sm:rounded-2xl sm:px-0 lg:static lg:bg-transparent lg:backdrop-blur-none">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-tinta-400" />
            <Input
              value={filters.query}
              onChange={(e) => filters.setQuery(e.target.value)}
              placeholder="Buscar marca, prenda, color…"
              className="pl-10"
              aria-label="Buscar en el catálogo"
            />
          </div>
          <Button type="button" variant="outline" className="lg:hidden" onClick={() => setMobileOpen(true)}>
            <SlidersHorizontal /> Filtros {active > 0 && `(${active})`}
          </Button>
          <div className="w-full sm:w-56">
            <NativeSelect
              value={filters.sort}
              onChange={(e) => filters.setSort(e.target.value as SortOption)}
              aria-label="Ordenar por"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <p className="mr-2 text-sm text-tinta-500">
            <strong className="text-tinta">{filtered.length}</strong> {filtered.length === 1 ? "pieza" : "piezas"}
          </p>
          <AnimatePresence initial={false}>
            {chips.map((chip) => (
              <motion.button
                key={chip.key}
                type="button"
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={chip.onRemove}
                className="inline-flex items-center gap-1.5 rounded-full bg-beige-100 px-3 py-1.5 text-xs font-semibold text-tinta-700 transition hover:bg-beige-200"
              >
                {chip.label} <X className="size-3" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {filtered.length ? (
          <motion.div layout className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <ProductCard product={p} index={i} priority={i < 3} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-beige-300 p-14 text-center">
            <p className="font-display text-3xl">Nada por aquí… todavía</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-tinta-500">
              No encontramos piezas con esos filtros. Prueba con otra talla o activa la alerta del próximo drop.
            </p>
            <Button type="button" variant="outline" className="mt-6" onClick={filters.reset}>
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="bottom" className="h-[85dvh]">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <FilterPanel facets={facets} />
          </div>
          <div className="grid grid-cols-2 gap-2 border-t border-border p-4">
            <Button variant="outline" onClick={filters.reset}>
              Limpiar
            </Button>
            <Button onClick={() => setMobileOpen(false)}>Ver {filtered.length} piezas</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
