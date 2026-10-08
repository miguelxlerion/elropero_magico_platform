"use client";

import { Box, PackageCheck } from "lucide-react";
import { CONDITION_ICONS } from "@/components/product/ConditionBadge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Checkbox, Slider } from "@/components/ui/controls";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { CONDITION_META, CONDITION_ORDER } from "@/lib/conditions";
import { cn, formatCOP } from "@/lib/utils";
import { useFilterStore } from "@/stores/filterStore";
import type { ProductCategory, ProductCondition } from "@/types/product";

export type Facets = {
  sizes: string[];
  brands: { name: string; count: number }[];
  categoryCounts: Record<ProductCategory, number>;
  conditionCounts: Record<ProductCondition, number>;
  priceMin: number;
  priceMax: number;
};

function CheckRow({
  checked,
  onChange,
  label,
  count,
  icon,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm text-tinta-700 transition hover:text-tinta">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {icon}
      <span className="flex-1">{label}</span>
      {typeof count === "number" && <span className="text-xs text-tinta-400">{count}</span>}
    </label>
  );
}

export function FilterPanel({ facets }: { facets: Facets }) {
  const f = useFilterStore();
  const range: [number, number] = f.priceRange ?? [facets.priceMin, facets.priceMax];

  return (
    <div>
      <div className="space-y-1 border-b border-border pb-4">
        <CheckRow
          checked={f.onlyAvailable}
          onChange={() => f.setOnlyAvailable(!f.onlyAvailable)}
          label="Solo disponibles"
          icon={<PackageCheck className="size-4 text-salvia-600" />}
        />
        <CheckRow
          checked={f.only3D}
          onChange={() => f.setOnly3D(!f.only3D)}
          label="Con probador 3D / AR"
          icon={<Box className="size-4 text-salvia-600" />}
        />
      </div>

      <Accordion type="multiple" defaultValue={["categoria", "talla", "precio", "condicion", "marca"]}>
        <AccordionItem value="categoria">
          <AccordionTrigger>Categoría</AccordionTrigger>
          <AccordionContent className="space-y-0.5">
            {CATEGORIES.map((c) => (
              <CheckRow
                key={c}
                checked={f.categories.includes(c)}
                onChange={() => f.toggleCategory(c)}
                label={CATEGORY_LABELS[c]}
                count={facets.categoryCounts[c] ?? 0}
              />
            ))}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="talla">
          <AccordionTrigger>Talla</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-wrap gap-2">
              {facets.sizes.map((s) => {
                const active = f.sizes.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => f.toggleSize(s)}
                    aria-pressed={active}
                    className={cn(
                      "min-w-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                      active ? "border-tinta bg-tinta text-hueso" : "border-tinta/15 hover:border-tinta/40",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-tinta-400">Tip: revisa las medidas en cm de cada prenda, son más confiables que la talla.</p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="precio">
          <AccordionTrigger>Precio</AccordionTrigger>
          <AccordionContent>
            <Slider
              min={facets.priceMin}
              max={facets.priceMax}
              step={5000}
              value={range}
              minStepsBetweenThumbs={1}
              onValueChange={(v) => {
                const next: [number, number] = [v[0], v[1]];
                f.setPriceRange(next[0] <= facets.priceMin && next[1] >= facets.priceMax ? null : next);
              }}
              aria-label="Rango de precio"
            />
            <div className="mt-2 flex justify-between text-xs font-semibold text-tinta-500">
              <span>{formatCOP(range[0])}</span>
              <span>{formatCOP(range[1])}</span>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="condicion">
          <AccordionTrigger>Condición</AccordionTrigger>
          <AccordionContent className="space-y-0.5">
            {CONDITION_ORDER.map((c) => {
              const Icon = CONDITION_ICONS[c];
              return (
                <CheckRow
                  key={c}
                  checked={f.conditions.includes(c)}
                  onChange={() => f.toggleCondition(c)}
                  label={CONDITION_META[c].label}
                  count={facets.conditionCounts[c] ?? 0}
                  icon={<Icon className={cn("size-4", CONDITION_META[c].tone.text)} />}
                />
              );
            })}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="marca" className="border-b-0">
          <AccordionTrigger>Marca</AccordionTrigger>
          <AccordionContent className="max-h-64 space-y-0.5 overflow-y-auto pr-1">
            {facets.brands.map((b) => (
              <CheckRow
                key={b.name}
                checked={f.brands.includes(b.name)}
                onChange={() => f.toggleBrand(b.name)}
                label={b.name}
                count={b.count}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
