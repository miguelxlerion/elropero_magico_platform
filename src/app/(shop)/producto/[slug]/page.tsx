import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfoTabs } from "@/components/product/ProductInfoTabs";
import { ProductPurchasePanel } from "@/components/product/ProductPurchasePanel";
import { CATEGORY_LABELS } from "@/lib/constants";
import { getProductBySlug, getRelatedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Prenda no encontrada" };
  return {
    title: `${product.name} · ${product.brand}`,
    description: product.ai_generated_description.slice(0, 155),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = await getRelatedProducts(product, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand },
    image: product.images,
    description: product.ai_generated_description,
    itemCondition: product.condition === "nuevo_con_etiqueta" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.price,
      availability: product.status === "published" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <nav aria-label="Ruta de navegación" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-tinta-400">
        <Link href="/" className="hover:text-tinta">Inicio</Link>
        <ChevronRight className="size-3" />
        <Link href="/catalogo" className="hover:text-tinta">Catálogo</Link>
        <ChevronRight className="size-3" />
        <Link href={`/catalogo?categoria=${product.category}`} className="hover:text-tinta">
          {CATEGORY_LABELS[product.category]}
        </Link>
        <ChevronRight className="size-3" />
        <span className="text-tinta-500">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
        <ProductGallery
          images={product.images}
          name={product.name}
          modelUrl={product.model_3d_url}
          arSupported={product.ar_supported}
          autoOpenAR={sp.ar === "1"}
          unavailable={product.status !== "published"}
        />
        <ProductPurchasePanel product={product} />
      </div>

      <ProductInfoTabs product={product} />

      {related.length > 0 && (
        <section className="mt-24">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-salvia-600">
                {product.drop ? `Drop ${String(product.drop.number).padStart(2, "0")} · ${product.drop.name}` : "También te puede gustar"}
              </p>
              <h2 className="mt-2 font-display text-4xl">Del mismo drop</h2>
            </div>
            {product.drop && (
              <Link href={`/drops/${product.drop.id}`} className="text-sm font-semibold underline underline-offset-4">
                Ver colección completa
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
