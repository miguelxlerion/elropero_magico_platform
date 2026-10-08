"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, ExternalLink, Flag, Loader2, Plus, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/controls";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { cn, formatDateTime } from "@/lib/utils";
import { dropInputSchema, type DropInput } from "@/lib/validation";
import type { DropStatus } from "@/types/drop";

type DropRow = {
  id: string;
  number: number;
  name: string;
  theme: string;
  status: DropStatus;
  launch_date: string;
  launch_input: string;
  products: number;
};

type Unassigned = { id: string; name: string; brand: string; image: string; status: string };

const bogotaToIso = (local: string) => new Date(`${local}:00-05:00`).toISOString();

async function patchDrop(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/drops", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string; assigned?: number };
  if (!res.ok) throw new Error(data.error ?? "No se pudo actualizar");
  return data;
}

export function DropManager({
  drops,
  unassigned,
  suggestedLaunch,
}: {
  drops: DropRow[];
  unassigned: Unassigned[];
  suggestedLaunch: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [dates, setDates] = useState<Record<string, string>>(() => Object.fromEntries(drops.map((d) => [d.id, d.launch_input])));
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState(drops.find((d) => d.status === "upcoming")?.id ?? drops[0]?.id ?? "");

  const form = useForm<DropInput>({
    resolver: zodResolver(dropInputSchema),
    defaultValues: { name: "", theme: "", description: "", cover_image: "", launch_date: suggestedLaunch },
  });
  const { errors, isSubmitting } = form.formState;

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error");
    } finally {
      setBusy(null);
    }
  };

  const onCreate = form.handleSubmit(async (values) => {
    const res = await fetch("/api/admin/drops", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, launch_date: bogotaToIso(values.launch_date) }),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      toast.error(data.error ?? "No se pudo crear el drop");
      return;
    }
    toast.success("Drop programado · el countdown ya está en vivo");
    form.reset({ name: "", theme: "", description: "", cover_image: "", launch_date: suggestedLaunch });
    router.refresh();
  });

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {drops.map((d) => (
          <div key={d.id} className="rounded-[2rem] border border-border bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-wider",
                      d.status === "live" ? "bg-salvia-100 text-salvia-700" : d.status === "upcoming" ? "bg-tinta text-hueso" : "bg-beige-100 text-tinta-500",
                    )}
                  >
                    {d.status === "live" ? "En vivo" : d.status === "upcoming" ? "Próximo" : "Finalizado"}
                  </span>
                  <span className="text-xs text-tinta-400">{d.products} piezas</span>
                </div>
                <p className="mt-2 font-display text-3xl">
                  Drop {String(d.number).padStart(2, "0")} · {d.name}
                </p>
                <p className="text-sm text-tinta-500">{d.theme}</p>
                <p className="mt-1 text-xs capitalize text-tinta-400">{formatDateTime(d.launch_date)}</p>
              </div>
              <Link href={`/drops/${d.id}`} target="_blank" className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4">
                Ver en tienda <ExternalLink className="size-3" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap items-end gap-3 border-t border-border pt-5">
              <div className="space-y-1.5">
                <Label>Fecha de lanzamiento (hora Bogotá)</Label>
                <Input
                  type="datetime-local"
                  value={dates[d.id] ?? ""}
                  onChange={(e) => setDates((s) => ({ ...s, [d.id]: e.target.value }))}
                  className="w-auto"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => run(`date-${d.id}`, () => patchDrop({ id: d.id, launch_date: bogotaToIso(dates[d.id]) }), "Fecha actualizada y sincronizada")}
              >
                {busy === `date-${d.id}` ? <Loader2 className="animate-spin" /> : <CalendarClock />} Reprogramar
              </Button>
              {d.status !== "live" && (
                <Button
                  size="sm"
                  variant="sage"
                  disabled={busy !== null}
                  onClick={() => run(`live-${d.id}`, () => patchDrop({ id: d.id, status: "live" }), "¡Drop lanzado!")}
                >
                  {busy === `live-${d.id}` ? <Loader2 className="animate-spin" /> : <Rocket />} Lanzar ahora
                </Button>
              )}
              {d.status === "live" && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy !== null}
                  onClick={() => run(`end-${d.id}`, () => patchDrop({ id: d.id, status: "ended" }), "Drop finalizado")}
                >
                  <Flag /> Finalizar
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <form onSubmit={onCreate} noValidate className="space-y-4 rounded-[2rem] border border-border bg-white p-6">
          <h2 className="font-display text-2xl">Programar nuevo drop</h2>
          <div className="space-y-2">
            <Label>Nombre</Label>
            <Input {...form.register("name")} placeholder="Neblina" aria-invalid={Boolean(errors.name)} />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Input {...form.register("theme")} placeholder="Capas y lana para la temporada de lluvias" aria-invalid={Boolean(errors.theme)} />
            <FieldError message={errors.theme?.message} />
          </div>
          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea {...form.register("description")} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Imagen de portada (URL)</Label>
            <Input {...form.register("cover_image")} placeholder="https://…" aria-invalid={Boolean(errors.cover_image)} />
            <FieldError message={errors.cover_image?.message} />
          </div>
          <div className="space-y-2">
            <Label>Lanzamiento (hora Bogotá)</Label>
            <Input type="datetime-local" {...form.register("launch_date")} />
            <p className="text-[0.7rem] text-tinta-400">Sugerido: 15 días después del último drop, 7:00 p. m.</p>
            <FieldError message={errors.launch_date?.message} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Plus />} Crear drop
          </Button>
        </form>

        <div className="space-y-4 rounded-[2rem] border border-border bg-white p-6">
          <h2 className="font-display text-2xl">Asignar prendas</h2>
          {unassigned.length ? (
            <>
              <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {unassigned.map((p) => (
                  <li key={p.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl p-2 hover:bg-beige-50">
                      <Checkbox
                        checked={selected.includes(p.id)}
                        onCheckedChange={(v) => setSelected((s) => (v === true ? [...s, p.id] : s.filter((x) => x !== p.id)))}
                      />
                      <div className="relative aspect-[3/4] w-9 shrink-0 overflow-hidden rounded-md bg-beige-100">
                        {p.image && <Image src={p.image} alt="" fill sizes="36px" className="object-cover" />}
                      </div>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="text-xs text-tinta-400">{p.brand} · {p.status === "draft" ? "Borrador" : "Sin drop"}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <NativeSelect value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Drop destino">
                {drops.map((d) => (
                  <option key={d.id} value={d.id}>Drop {String(d.number).padStart(2, "0")} · {d.name}</option>
                ))}
              </NativeSelect>
              <Button
                className="w-full"
                variant="outline"
                disabled={!selected.length || busy !== null}
                onClick={() =>
                  run("assign", async () => {
                    await patchDrop({ id: target, assign: selected });
                    setSelected([]);
                  }, "Prendas asignadas y publicadas")
                }
              >
                {busy === "assign" && <Loader2 className="animate-spin" />} Asignar {selected.length || ""} y publicar
              </Button>
            </>
          ) : (
            <p className="text-sm text-tinta-500">Todas las prendas tienen drop asignado. Los borradores aparecerán aquí.</p>
          )}
        </div>
      </div>
    </div>
  );
}
