import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/ProductForm";
import { aiEngineInfo } from "@/lib/ai/describe";
import { getAllDrops } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Catalogar prenda con IA" };

export default async function NuevoProductoPage() {
  const drops = await getAllDrops();
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-salvia-600">Catalogación asistida</p>
        <h1 className="mt-2 font-display text-5xl">Nueva prenda</h1>
        <p className="mt-2 max-w-2xl text-tinta-500">
          Completa la ficha técnica y deja que la IA redacte una descripción honesta, sugiera etiquetas y un precio de
          reventa. Tú revisas y publicas.
        </p>
      </header>
      <ProductForm
        drops={drops.map((d) => ({ id: d.id, name: d.name, number: d.number, status: d.status }))}
        engine={aiEngineInfo()}
      />
    </div>
  );
}
