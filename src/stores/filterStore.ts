import { create } from "zustand";
import type { SortOption } from "@/lib/constants";
import type { ProductCategory, ProductCondition } from "@/types/product";

export type FilterState = {
  categories: ProductCategory[];
  sizes: string[];
  brands: string[];
  conditions: ProductCondition[];
  priceRange: [number, number] | null;
  sort: SortOption;
  onlyAvailable: boolean;
  only3D: boolean;
  query: string;
  toggleCategory: (value: ProductCategory) => void;
  toggleSize: (value: string) => void;
  toggleBrand: (value: string) => void;
  toggleCondition: (value: ProductCondition) => void;
  setPriceRange: (range: [number, number] | null) => void;
  setSort: (sort: SortOption) => void;
  setOnlyAvailable: (value: boolean) => void;
  setOnly3D: (value: boolean) => void;
  setQuery: (value: string) => void;
  hydrate: (partial: Partial<Pick<FilterState, "categories" | "only3D" | "sort">>) => void;
  reset: () => void;
};

const toggle = <T,>(list: T[], value: T) =>
  list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

const initial = {
  categories: [] as ProductCategory[],
  sizes: [] as string[],
  brands: [] as string[],
  conditions: [] as ProductCondition[],
  priceRange: null as [number, number] | null,
  sort: "recientes" as SortOption,
  onlyAvailable: false,
  only3D: false,
  query: "",
};

export const useFilterStore = create<FilterState>()((set) => ({
  ...initial,
  toggleCategory: (value) => set((s) => ({ categories: toggle(s.categories, value) })),
  toggleSize: (value) => set((s) => ({ sizes: toggle(s.sizes, value) })),
  toggleBrand: (value) => set((s) => ({ brands: toggle(s.brands, value) })),
  toggleCondition: (value) => set((s) => ({ conditions: toggle(s.conditions, value) })),
  setPriceRange: (priceRange) => set({ priceRange }),
  setSort: (sort) => set({ sort }),
  setOnlyAvailable: (onlyAvailable) => set({ onlyAvailable }),
  setOnly3D: (only3D) => set({ only3D }),
  setQuery: (query) => set({ query }),
  hydrate: (partial) => set({ ...initial, ...partial }),
  reset: () => set({ ...initial }),
}));

export function countActiveFilters(s: FilterState) {
  return (
    s.categories.length +
    s.sizes.length +
    s.brands.length +
    s.conditions.length +
    (s.priceRange ? 1 : 0) +
    (s.onlyAvailable ? 1 : 0) +
    (s.only3D ? 1 : 0)
  );
}
