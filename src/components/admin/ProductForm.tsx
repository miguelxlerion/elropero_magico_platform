"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Check, ImagePlus, Loader2, Plus, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import { AccessoryViewer } from "@/components/3d/AccessoryViewer";
import { ConditionBadge } from "@/components/product/ConditionBadge";
import { Button } from "@/components/ui/button";
import { Checkbox, Slider } from "@/components/ui/controls";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { CATEGORIES, CATEGORY_LABELS, MODEL_LIBRARY } from "@/lib/constants";
import { CONDITION_META, conditionFromScore } from "@/lib/conditions";
import { cn, formatCOP } from "@/lib/utils";
import { productInputSchema, type ProductInput } from "@/lib/validation";
import type { DropStatus } from "@/types/drop";
import type { ProductCategory } from "@/types/product";

type MeasureKey = keyof ProductInput["measurements"];

const MEASURE_FIELDS: Record<ProductCategory, { key: MeasureKey; label: string }[]> = {
  ropa_superior: [
    { key: "chest", label: "Pecho (axila a axila)" },
    { key: "shoulder", label: "Hombros" },
    { key: "length", label: "Largo total" },
    { key: "sleeve", label: "Manga" },
  ],
  vestidos: [
    { key: "chest", label: "Busto (en plano)" },
    { key: "waist", label: "Cintura (en plano)" },
    { key: "hip", label: "Cadera (en plano)" },
    { key: "length", label: "Largo total" },
  ],
  ropa_inferior: [
    { key: "waist", label: "Cintura (en plano)" },
    { key: "hip", label: "Cadera (en plano)" },
    { key: "inseam", label: "Entrepierna" },
    { key: "length", label: "Largo total" },
  ],
  calzado: [
    { key: "insole", label: "Plantilla interna" },
    { key: "height", label: "Altura de caña" },
  ],
  accesorios: [
    { key: "width", label: "Ancho" },
    { key: "height", label: "Alto" },
    { key: "depth", label: "Fondo" },
    { key: "strap_drop", label: "Caída de asa" },
    { key: "circumference", label: "Circunferencia" },
  ],
};

const SAMPLE_IMAGES = [16390585, 35210034, 33074925, 21336434].map(
  (id) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=900`,
);

type DropOption = { id: string; name: string; number: number; status: DropStatus };
type AiMeta = { suggested_price: number; price_rationale: string; engine: "openai" | "local"; model?: string };

const optionalNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

function Field({ label, error, children, className }: { label: string; error?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

export function ProductForm({ drops, engine }: { drops: DropOption[]; engine: { engine: "openai" | "local"; model: string } }) {
  const router = useRouter();
  const defaultDrop = drops.find((d) => d.status === "upcoming")?.id ?? drops[0]?.id ?? "";
  const form = useForm<ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "ropa_superior",
      subcategory: "",
      size: "",
      color: "",
      material: "",
      measurements: {},
      condition_score: 8,
      condition_notes: "",
      price: 0,
      original_price: undefined,
      images: [],
      model_3d_url: "",
      drop_id: defaultDrop,
      status: "published",
      featured: false,
      tags: [],
      ai_generated_description: "",
    },
  });
  const { register, setValue, getValues, formState } = form;
  const { errors, isSubmitting } = formState;
  const values = form.watch();
  const [imageInput, setImageInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [ai, setAi] = useState<AiMeta | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saved, setSaved] = useState<{ slug: string; name: string; visible: boolean } | null>(null);
  const typingRef = useRef<number | null>(null);
  const condition = conditionFromScore(values.condition_score);

  useEffect(
    () => () => {
      if (typingRef.current) window.clearInterval(typingRef.current);
    },
    [],
  );

  const addImage = (url: string) => {
    const clean = url.trim();
    if (!/^https?:\/\//.test(clean)) {
      toast.error("Pega una URL válida (https://…)");
      return;
    }
    if (getValues("images").includes(clean)) return;
    setValue("images", [...getValues("images"), clean], { shouldValidate: true });
    setImageInput("");
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (!t || getValues("tags").includes(t)) return;
    setValue("tags", [...getValues("tags"), t]);
    setTagInput("");
  };

  const typewriter = (text: string) => {
    if (typingRef.current) window.clearInterval(typingRef.current);
    const words = text.split(" ");
    let i = 0;
    setValue("ai_generated_description", "");
    typingRef.current = window.setInterval(() => {
      i += 3;
      setValue("ai_generated_description", words.slice(0, i).join(" "), { shouldValidate: i >= words.length });
      if (i >= words.length && typingRef.current) {
        window.clearInterval(typingRef.current);
        typingRef.current = null;
      }
    }, 40);
  };

  const generate = async () => {
    const v = getValues();
    if (!v.name.trim() || !v.brand.trim()) {
      toast.error("Escribe al menos el nombre y la marca");
      void form.trigger(["name", "brand"]);
      return;
    }
    setGenerating(true);
    try {
      const measurements = Object.fromEntries(
        Object.entries(v.measurements).filter(([, n]) => typeof n === "number" && !Number.isNaN(n)),
      );
      const res = await fetch("/api/ai/describe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: v.name,
          brand: v.brand,
          category: v.category,
          subcategory: v.subcategory,
          size: v.size,
          color: v.color,
          material: v.material,
          condition_score: v.condition_score,
          condition_notes: v.condition_notes,
          original_price: v.original_price,
          measurements,
          image_url: v.images[0],
          has3d: Boolean(v.model_3d_url),
        }),
      });
      const data = (await res.json()) as AiMeta & { description?: string; tags?: string[]; error?: string };
      if (!res.ok || !data.description) throw new Error(data.error ?? "No se pudo generar");
      typewriter(data.description);
      setValue("tags", data.tags ?? []);
      setAi({ suggested_price: data.suggested_price, price_rationale: data.price_rationale, engine: data.engine, model: data.model });
      if (!v.price) setValue("price", data.suggested_price, { shouldValidate: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error generando la descripción");
    } finally {
      setGenerating(false);
    }
  };

  const onSubmit = form.handleSubmit(async (v) => {
    const payload: ProductInput = {
      ...v,
      model_3d_url: v.category === "accesorios" ? v.model_3d_url : "",
      measurements: Object.fromEntries(
        Object.entries(v.measurements).filter(([, n]) => typeof n === "number" && !Number.isNaN(n)),
      ),
    };
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; product?: { slug: string; name: string } };
    if (!res.ok || !data.product) {
      toast.error(data.error ?? "No se pudo guardar la prenda");
      return;
    }
    const drop = drops.find((d) => d.id === v.drop_id);
    setSaved({
      slug: data.product.slug,
      name: data.product.name,
      visible: v.status === "published" && (!drop || drop.status !== "upcoming"),
    });
    toast.success("Prenda catalogada");
    router.refresh();
  });

  if (saved) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-border bg-white p-10 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-salvia-600 text-white">
          <Check className="size-8" />
        </span>
        <h2 className="mt-5 font-display text-4xl">{saved.name} ya está en el ropero</h2>
        <p className="mt-2 text-tinta-500">
          {saved.visible ? "Ya es visible en la tienda." : "Se mostrará cuando su drop se lance (o al publicarla)."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {saved.visible && (
            <Button asChild variant="outline">
              <Link href={`/producto/${saved.slug}`}>Ver ficha en la tienda</Link>
            </Button>
          )}
          <Button
            onClick={() => {
              setSaved(null);
              setAi(null);
              form.reset();
            }}
          >
            <Plus /> Catalogar otra prenda
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-8 xl:grid-cols-[1fr_340px]">
      <div className="space-y-8">
        <section className="space-y-5 rounded-[2rem] border border-border bg-white p-6">
          <h2 className="font-display text-2xl">1 · Ficha técnica</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre de la prenda" error={errors.name?.message} className="sm:col-span-2">
              <Input {...register("name")} placeholder="Chaqueta de jean oversize 90s" aria-invalid={Boolean(errors.name)} />
            </Field>
            <Field label="Marca" error={errors.brand?.message}>
              <Input {...register("brand")} placeholder="Levi's" aria-invalid={Boolean(errors.brand)} />
            </Field>
            <Field label="Categoría" error={errors.category?.message}>
              <NativeSelect {...register("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Subcategoría" error={errors.subcategory?.message}>
              <Input {...register("subcategory")} placeholder="Chaquetas" aria-invalid={Boolean(errors.subcategory)} />
            </Field>
            <Field label="Talla de etiqueta" error={errors.size?.message}>
              <Input {...register("size")} placeholder="M · 28 · 38 · Única" aria-invalid={Boolean(errors.size)} />
            </Field>
            <Field label="Color" error={errors.color?.message}>
              <Input {...register("color")} placeholder="Azul medio" />
            </Field>
            <Field label="Material" error={errors.material?.message}>
              <Input {...register("material")} placeholder="Denim 100% algodón" />
            </Field>
          </div>
          <div>
            <Label>Medidas reales en cm (prenda en plano)</Label>
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {MEASURE_FIELDS[values.category].map((m) => (
                <div key={`${values.category}-${m.key}`} className="relative">
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder={m.label}
                    aria-label={m.label}
                    {...register(`measurements.${m.key}`, { setValueAs: optionalNumber })}
                    className="pr-10"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-tinta-400">cm</span>
                  <p className="mt-1 truncate text-[0.68rem] text-tinta-400">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-[2rem] border border-border bg-white p-6">
          <h2 className="font-display text-2xl">2 · Estado y fotos</h2>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label>Condición ({values.condition_score}/10)</Label>
              <ConditionBadge condition={condition} score={values.condition_score} />
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[values.condition_score]}
              onValueChange={([v]) => setValue("condition_score", v, { shouldDirty: true })}
              aria-label="Puntaje de condición"
            />
            <p className="text-xs text-tinta-500">{CONDITION_META[condition].summary}</p>
          </div>
          <Field label="Notas de estado (se publican tal cual)" error={errors.condition_notes?.message}>
            <Textarea {...register("condition_notes")} placeholder="Leve desgaste en puños; botón inferior con punto de óxido…" rows={2} />
          </Field>
          <div className="space-y-3">
            <Label>Fotos (URL de Supabase Storage o CDN)</Label>
            <div className="flex gap-2">
              <Input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage(imageInput);
                  }
                }}
                placeholder="https://…/foto-frontal.jpg"
              />
              <Button type="button" variant="outline" onClick={() => addImage(imageInput)}>
                <ImagePlus /> Agregar
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-tinta-400">
              Ejemplos:
              {SAMPLE_IMAGES.map((src, i) => (
                <button key={src} type="button" onClick={() => addImage(src)} className="rounded-full bg-beige-100 px-2.5 py-1 font-semibold text-tinta-600 hover:bg-beige-200">
                  Foto {i + 1}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {values.images.map((src) => (
                <div key={src} className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-beige-100">
                  <Image src={src} alt="" fill sizes="100px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setValue("images", values.images.filter((s) => s !== src), { shouldValidate: true })}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-white/90 opacity-0 transition group-hover:opacity-100"
                    aria-label="Quitar foto"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <FieldError message={errors.images?.message} />
          </div>
          {values.category === "accesorios" && (
            <Field label="Modelo 3D (probador virtual + AR)">
              <NativeSelect {...register("model_3d_url")}>
                <option value="">Sin modelo 3D</option>
                {MODEL_LIBRARY.map((m) => (
                  <option key={m.url} value={m.url}>{m.label}</option>
                ))}
              </NativeSelect>
            </Field>
          )}
        </section>

        <section className="space-y-5 rounded-[2rem] border border-border bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">3 · Descripción con IA</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-beige-100 px-3 py-1 text-xs font-semibold text-tinta-600">
              <Bot className="size-3.5" /> {engine.engine === "openai" ? `OpenAI · ${engine.model}` : "Motor local (configura OPENAI_API_KEY)"}
            </span>
          </div>
          <Button type="button" variant="sage" size="lg" onClick={generate} disabled={generating} className="w-full sm:w-auto">
            {generating ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {generating ? "Analizando ficha y fotos…" : "Generar descripción, etiquetas y precio"}
          </Button>
          <Field label="Descripción (transparente sobre el estado real)" error={errors.ai_generated_description?.message}>
            <Textarea {...register("ai_generated_description")} rows={6} placeholder="La IA redactará aquí una descripción honesta…" />
          </Field>
          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {values.tags.map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setValue("tags", values.tags.filter((x) => x !== t))}
                    className="inline-flex items-center gap-1 rounded-full bg-salvia-50 px-3 py-1 text-xs font-semibold text-salvia-700"
                  >
                    #{t} <X className="size-3" />
                  </motion.button>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Agregar etiqueta"
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus />
              </Button>
            </div>
          </div>
        </section>

        <section className="space-y-5 rounded-[2rem] border border-border bg-white p-6">
          <h2 className="font-display text-2xl">4 · Precio y publicación</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Precio de venta (COP)" error={errors.price?.message}>
              <Input type="number" step="1000" {...register("price", { valueAsNumber: true })} aria-invalid={Boolean(errors.price)} />
            </Field>
            <Field label="Precio original (opcional)" error={errors.original_price?.message}>
              <Input type="number" step="1000" {...register("original_price", { setValueAs: optionalNumber })} />
            </Field>
          </div>
          <AnimatePresence>
            {ai && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-4 rounded-2xl bg-salvia-50 p-4 text-sm text-salvia-700"
              >
                <Sparkles className="size-5" />
                <div className="flex-1">
                  <p className="font-semibold">Precio sugerido: {formatCOP(ai.suggested_price)}</p>
                  <p className="text-xs opacity-80">{ai.price_rationale}</p>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => setValue("price", ai.suggested_price, { shouldValidate: true })}>
                  Aplicar
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Drop">
              <NativeSelect {...register("drop_id")}>
                <option value="">Sin drop</option>
                {drops.map((d) => (
                  <option key={d.id} value={d.id}>
                    Drop {String(d.number).padStart(2, "0")} · {d.name} ({d.status === "upcoming" ? "próximo" : d.status === "live" ? "en vivo" : "finalizado"})
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Estado">
              <NativeSelect {...register("status")}>
                <option value="published">Publicada</option>
                <option value="draft">Borrador</option>
              </NativeSelect>
            </Field>
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <Checkbox checked={values.featured} onCheckedChange={(v) => setValue("featured", v === true)} />
            Destacar en la página de inicio
          </label>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-8 xl:self-start">
        <div className="rounded-[2rem] border border-border bg-white p-5">
          <p className="eyebrow text-tinta-400">Vista previa</p>
          <div className="relative mt-3 aspect-[3/4] overflow-hidden rounded-2xl bg-beige-100">
            {values.images[0] ? (
              <Image src={values.images[0]} alt="" fill sizes="300px" className="object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-xs text-tinta-400">Agrega una foto</div>
            )}
            <div className="absolute bottom-3 left-3">
              <ConditionBadge condition={condition} score={values.condition_score} showTooltip={false} className="bg-white/90 text-tinta" />
            </div>
          </div>
          <p className="eyebrow mt-4 text-tinta-400">{values.brand || "Marca"}</p>
          <p className="font-display text-xl">{values.name || "Nombre de la prenda"}</p>
          <p className="mt-1 text-sm font-semibold">
            {values.price ? formatCOP(values.price) : "$ —"}
            {values.original_price ? <span className="ml-2 text-xs font-normal text-tinta-400 line-through">{formatCOP(values.original_price)}</span> : null}
          </p>
        </div>
        {values.category === "accesorios" && values.model_3d_url && (
          <AccessoryViewer key={values.model_3d_url} modelUrl={values.model_3d_url} productName={values.name || "Vista previa"} arSupported={false} className="aspect-square w-full" />
        )}
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Check />} Guardar prenda
        </Button>
      </aside>
    </form>
  );
}
