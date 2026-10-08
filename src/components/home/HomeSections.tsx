import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Box, Hand, Lightbulb, Ruler, ScanLine, Sparkles, Truck, ZoomIn } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Button } from "@/components/ui/button";
import type { DropSnapshot } from "@/types/drop";
import type { Product } from "@/types/product";

const pad = (n: number) => String(n).padStart(2, "0");

export function ValueStrip() {
  const items = [
    { icon: Sparkles, title: "Curado a mano", text: "Solo 1 de cada 5 prendas pasa nuestro filtro" },
    { icon: Ruler, title: "Medidas reales", text: "Cada pieza medida en centímetros, en plano" },
    { icon: Box, title: "Probador 3D y AR", text: "Gira y prueba accesorios antes de comprar" },
    { icon: Truck, title: "Mismo día en Bogotá", text: "Nacional en 2 a 4 días hábiles" },
  ];
  return (
    <section className="border-y border-border bg-white/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border lg:grid-cols-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex items-start gap-3 bg-hueso px-4 py-6 sm:px-6">
            <Icon className="mt-0.5 size-5 shrink-0 text-salvia-600" />
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-tinta-500">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function FeaturedGrid({ products, liveDrop }: { products: Product[]; liveDrop: DropSnapshot | null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-salvia-600">
            {liveDrop ? `Drop ${pad(liveDrop.number)} · ${liveDrop.name}` : "Selección de la semana"}
          </p>
          <h2 className="mt-3 font-display text-4xl leading-[1.05] sm:text-5xl">Destacados del ropero</h2>
          <p className="mt-3 max-w-lg text-tinta-500">
            Seis piezas que nuestra curadora no dejaría ir. Revisadas, medidas y fotografiadas con sus detalles reales.
          </p>
        </div>
        <Link href="/catalogo" className="group inline-flex items-center gap-2 text-sm font-semibold">
          Ver todo el catálogo <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
      {products.length ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} priority={i < 3} />
          ))}
        </div>
      ) : (
        <p className="rounded-3xl bg-beige-50 p-10 text-center text-tinta-500">El próximo drop está en preparación.</p>
      )}
    </section>
  );
}

export function TryOnBanner({ product }: { product?: Product }) {
  const features = [
    { icon: Hand, label: "Rotación 360°" },
    { icon: ZoomIn, label: "Zoom al detalle" },
    { icon: Lightbulb, label: "4 iluminaciones" },
    { icon: ScanLine, label: "AR en tu espacio" },
  ];
  return (
    <section className="px-4 sm:px-6 lg:px-8">
      <div className="grain relative mx-auto grid max-w-7xl overflow-hidden rounded-[2.5rem] bg-tinta text-hueso lg:grid-cols-2">
        <div className="relative z-10 flex flex-col justify-center gap-6 p-8 sm:p-12 lg:p-16">
          <p className="eyebrow text-salvia-300">Probador virtual</p>
          <h2 className="font-display text-4xl leading-[1.05] sm:text-5xl">
            Pruébatelo <em className="italic text-salvia-200">antes</em> de que sea tuyo.
          </h2>
          <p className="max-w-md text-hueso/70">
            Gafas, bolsos y sombreros modelados en 3D a escala real. Gíralos, acércate a las costuras y colócalos sobre
            tu mesa con realidad aumentada, sin descargar ninguna app.
          </p>
          <ul className="grid max-w-md grid-cols-2 gap-3">
            {features.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2.5 text-sm">
                <Icon className="size-4 text-salvia-300" /> {label}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            {product && (
              <Button asChild variant="light" size="lg">
                <Link href={`/producto/${product.slug}`}>
                  Probar {product.name.toLowerCase()} <ArrowRight />
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="lg" className="text-hueso hover:bg-white/10">
              <Link href="/catalogo?categoria=accesorios&3d=1">Ver todos los accesorios 3D</Link>
            </Button>
          </div>
        </div>
        <div className="relative min-h-[320px] lg:min-h-[560px]">
          <Image src="/images/probador-3d.jpg" alt="Accesorios en el probador 3D" fill sizes="(min-width:1024px) 50vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-tinta via-tinta/20 to-transparent lg:via-transparent" />
        </div>
      </div>
    </section>
  );
}
