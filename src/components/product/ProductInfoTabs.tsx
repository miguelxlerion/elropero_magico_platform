"use client";

import { useEffect, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/controls";
import { CATEGORY_LABELS } from "@/lib/constants";
import { PAYMENT_METHODS } from "@/lib/payments";
import { SHIPPING_RULES } from "@/lib/shipping";
import { formatCOP } from "@/lib/utils";
import type { Product } from "@/types/product";
import { ConditionExplainer } from "./ConditionBadge";
import { SizeChart } from "./SizeChart";

const TABS = ["descripcion", "medidas", "condicion", "envios"] as const;
type Tab = (typeof TABS)[number];

export function ProductInfoTabs({ product }: { product: Product }) {
  const [tab, setTab] = useState<Tab>("descripcion");

  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.replace("#", "") as Tab;
      if (TABS.includes(hash)) {
        setTab(hash);
        document.getElementById("detalles")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  return (
    <section id="detalles" className="mt-20 scroll-mt-32">
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="descripcion">Descripción</TabsTrigger>
          <TabsTrigger value="medidas">Medidas (cm)</TabsTrigger>
          <TabsTrigger value="condicion">Condición</TabsTrigger>
          <TabsTrigger value="envios">Envíos y pagos</TabsTrigger>
        </TabsList>

        <TabsContent value="descripcion">
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-salvia-50 px-3 py-1.5 text-xs font-semibold text-salvia-700">
                <Sparkles className="size-3.5" /> Descripción generada con IA · verificada por nuestra curadora
              </div>
              <p className="text-lg leading-relaxed text-tinta-700">{product.ai_generated_description}</p>
              <p className="mt-4 flex items-start gap-2 text-xs text-tinta-400">
                <Bot className="mt-0.5 size-3.5 shrink-0" />
                Transparencia: este texto se genera a partir de la ficha técnica (medidas, materiales y notas de estado)
                y nunca oculta detalles de uso. Si algo no coincide con las fotos, prevalecen las fotos.
              </p>
              {product.tags.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                  {product.tags.map((t) => (
                    <span key={t} className="rounded-full border border-border px-3 py-1 text-xs text-tinta-500">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <dl className="divide-y divide-border rounded-2xl border border-border text-sm">
              {[
                ["Marca", product.brand],
                ["Categoría", `${CATEGORY_LABELS[product.category]} · ${product.subcategory}`],
                ["Talla", product.size],
                ["Color", product.color || "—"],
                ["Material", product.material || "—"],
                ["Estado", `${product.condition_score}/10`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-3">
                  <dt className="text-tinta-400">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </TabsContent>

        <TabsContent value="medidas">
          <SizeChart category={product.category} size={product.size} measurements={product.measurements} />
        </TabsContent>

        <TabsContent value="condicion">
          <div className="max-w-3xl">
            <ConditionExplainer condition={product.condition} score={product.condition_score} notes={product.condition_notes} />
          </div>
        </TabsContent>

        <TabsContent value="envios">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-5">
              <p className="font-semibold">Envíos</p>
              <ul className="mt-3 space-y-3 text-sm text-tinta-600">
                <li className="flex justify-between gap-4">
                  <span>{SHIPPING_RULES.bogota.label}</span>
                  <span className="font-semibold">{formatCOP(SHIPPING_RULES.bogota.cost)}</span>
                </li>
                <li className="text-xs text-tinta-400">
                  {SHIPPING_RULES.bogota.eta}. Gratis desde {formatCOP(SHIPPING_RULES.freeBogotaFrom)}.
                </li>
                <li className="flex justify-between gap-4 border-t border-border pt-3">
                  <span>{SHIPPING_RULES.nacional.label}</span>
                  <span className="font-semibold">{formatCOP(SHIPPING_RULES.nacional.cost)}</span>
                </li>
                <li className="text-xs text-tinta-400">{SHIPPING_RULES.nacional.eta} a cualquier ciudad de Colombia.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border p-5">
              <p className="font-semibold">Métodos de pago</p>
              <ul className="mt-3 space-y-2.5 text-sm">
                {PAYMENT_METHODS.map((m) => (
                  <li key={m.id} className="flex items-center gap-3">
                    <span className={`grid h-6 min-w-9 place-items-center rounded-md px-1 text-[0.6rem] font-bold ${m.markClass}`}>
                      {m.mark}
                    </span>
                    <span className="flex-1">{m.label}</span>
                    {m.id === "cod" && (
                      <span className="text-xs text-tinta-400">+{formatCOP(SHIPPING_RULES.codFee)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}
