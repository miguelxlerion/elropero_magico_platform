"use client";

import { BadgeCheck, Info, Sparkles, Tag, ThumbsUp, Wrench, type LucideIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CONDITION_META, CONDITION_ORDER } from "@/lib/conditions";
import { cn } from "@/lib/utils";
import type { ProductCondition } from "@/types/product";

export const CONDITION_ICONS: Record<ProductCondition, LucideIcon> = {
  nuevo_con_etiqueta: Tag,
  como_nuevo: Sparkles,
  muy_bueno: BadgeCheck,
  bueno: ThumbsUp,
  aceptable: Wrench,
};

export function ScoreMeter({ score, barClass, className }: { score: number; barClass: string; className?: string }) {
  return (
    <div className={cn("flex gap-[3px]", className)} aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-2.5 rounded-full transition-colors", i < score ? barClass : "bg-current opacity-15")}
        />
      ))}
    </div>
  );
}

export function ConditionScaleList({ current, score }: { current: ProductCondition; score: number }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="eyebrow text-tinta-400">Escala de condición Mag&co</p>
        <p className="mt-1 text-xs text-tinta-500">Cada prenda se revisa en 23 puntos antes de publicarse.</p>
      </div>
      <ul className="space-y-1.5">
        {CONDITION_ORDER.map((key) => {
          const meta = CONDITION_META[key];
          const Icon = CONDITION_ICONS[key];
          const active = key === current;
          return (
            <li
              key={key}
              className={cn(
                "flex gap-3 rounded-xl p-2 transition-colors",
                active ? cn(meta.tone.soft, "ring-1 ring-tinta/10") : "opacity-60",
              )}
            >
              <Icon className={cn("mt-0.5 size-4 shrink-0", meta.tone.text)} />
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-xs font-semibold text-tinta">
                  {meta.label}
                  <span className="font-normal text-tinta-400">
                    {meta.range[0] === meta.range[1] ? `${meta.range[0]}/10` : `${meta.range[0]}–${meta.range[1]}/10`}
                  </span>
                  {active && (
                    <span className="rounded-full bg-tinta px-1.5 py-0.5 text-[0.6rem] uppercase tracking-wider text-hueso">
                      {score}/10
                    </span>
                  )}
                </p>
                <p className="text-xs leading-snug text-tinta-500">{meta.summary}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type ConditionBadgeProps = {
  condition: ProductCondition;
  score: number;
  variant?: "compact" | "full";
  showTooltip?: boolean;
  className?: string;
};

export function ConditionBadge({
  condition,
  score,
  variant = "compact",
  showTooltip = true,
  className,
}: ConditionBadgeProps) {
  const meta = CONDITION_META[condition];
  const Icon = CONDITION_ICONS[condition];

  const badge =
    variant === "full" ? (
      <span
        className={cn(
          "inline-flex items-center gap-3 rounded-2xl px-3.5 py-2.5 ring-1 transition hover:shadow-sm",
          meta.tone.badge,
          className,
        )}
      >
        <Icon className="size-5 shrink-0" />
        <span className="text-left">
          <span className="block text-sm font-semibold leading-none">{meta.label}</span>
          <ScoreMeter score={score} barClass={meta.tone.bar} className="mt-2" />
        </span>
        <span className="ml-1 font-display text-2xl font-semibold leading-none">
          {score}
          <span className="text-xs font-sans opacity-60">/10</span>
        </span>
        {showTooltip && <Info className="size-3.5 opacity-60" />}
      </span>
    ) : (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.1em] ring-1",
          meta.tone.badge,
          className,
        )}
      >
        <Icon className="size-3" />
        {meta.label}
        <span className="opacity-70">· {score}/10</span>
      </span>
    );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="cursor-help rounded-2xl text-left"
          aria-label={`Estado ${meta.label}, ${score} de 10. Ver escala de condición`}
        >
          {badge}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" align="start" className="w-[20rem]">
        <ConditionScaleList current={condition} score={score} />
      </TooltipContent>
    </Tooltip>
  );
}

/** Explicación visual completa del estado, para la ficha de producto. */
export function ConditionExplainer({
  condition,
  score,
  notes,
}: {
  condition: ProductCondition;
  score: number;
  notes: string;
}) {
  const meta = CONDITION_META[condition];
  const Icon = CONDITION_ICONS[condition];
  return (
    <div className="space-y-6">
      <div className="relative pt-7">
        <div className="h-2 rounded-full bg-gradient-to-r from-terracota via-ambar via-55% to-salvia-600" />
        <div
          className="absolute top-0 -translate-x-1/2 text-center"
          style={{ left: `${((score - 0.5) / 10) * 100}%` }}
        >
          <span className="rounded-full bg-tinta px-2 py-0.5 text-[0.65rem] font-bold text-hueso">{score}</span>
          <span className="mx-auto mt-1 block size-3 rotate-45 rounded-[2px] bg-tinta" />
        </div>
        <div className="mt-2 flex justify-between text-[0.65rem] font-semibold uppercase tracking-wider text-tinta-400">
          <span>Aceptable</span>
          <span>Bueno</span>
          <span>Muy bueno</span>
          <span>Nuevo</span>
        </div>
      </div>
      <div className={cn("flex gap-4 rounded-2xl p-5", meta.tone.soft)}>
        <Icon className={cn("size-6 shrink-0", meta.tone.text)} />
        <div className="space-y-2">
          <p className="font-semibold text-tinta">
            {meta.label} · {score}/10
          </p>
          <p className="text-sm text-tinta-700">{meta.summary}</p>
          <ul className="grid gap-1 text-sm text-tinta-500 sm:grid-cols-3">
            {meta.details.map((d) => (
              <li key={d} className="flex items-start gap-1.5">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-current" />
                {d}
              </li>
            ))}
          </ul>
        </div>
      </div>
      {notes && (
        <div className="rounded-2xl border border-dashed border-beige-300 p-5">
          <p className="eyebrow text-tinta-400">Notas de nuestra curadora</p>
          <p className="mt-2 text-sm leading-relaxed text-tinta-700">“{notes}”</p>
        </div>
      )}
    </div>
  );
}
