import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog/CatalogView";
import { CATEGORIES, CATEGORY_LABELS } from "@/lib/constants";
import { getCatalogProducts } from "@/lib/queries";
import type { ProductCategory } from "@/types/product";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catálogo",
  description: "Ropa y accesorios de segunda mano curados en Bogotá. Filtra por talla, marca, precio y condición.",
};

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const products = await getCatalogProducts();
  const rawCategory = typeof sp.categoria === "string" ? sp.categoria : undefined;
  const category = CATEGORIES.includes(rawCategory as ProductCategory) ? (rawCategory as ProductCategory) : undefined;
  const only3D = sp["3d"] === "1";
  const available = products.filter((p) => p.status === "published").length;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8 lg:pt-14">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <p className="eyebrow text-salvia-600">{category ? CATEGORY_LABELS[category] : "Todo el ropero"}</p>
          <h1 className="mt-3 font-display text-5xl leading-none sm:text-6xl">
            {only3D ? "Accesorios en 3D" : "Catálogo"}
          </h1>
          <p className="mt-4 max-w-xl text-tinta-500">
            {available} piezas únicas disponibles ahora. Todas con medidas reales en centímetros y estado documentado
            en fotos.
          </p>
        </div>
      </header>
      <CatalogView products={products} initialCategory={category} initialOnly3D={only3D} />
    </div>
  );
}
