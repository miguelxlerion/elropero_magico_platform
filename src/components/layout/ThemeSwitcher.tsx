"use client";

import { useTheme, type SiteTheme } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

const OPTIONS: { value: SiteTheme; label: string; dot: string; hint: string }[] = [
  { value: "clasico", label: "Clásico", dot: "linear-gradient(135deg, #748a63 50%, #e4d8c5 50%)", hint: "Beige y verde salvia" },
  { value: "magico", label: "Mágico", dot: "linear-gradient(135deg, #8cc8c1 50%, #cb877c 50%)", hint: "Aqua y rosa del logo" },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Paleta de colores de la tienda"
      title="Elige la paleta de la tienda"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5 shadow-sm",
        className,
      )}
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setTheme(option.value)}
            aria-pressed={active}
            title={`${option.label}: ${option.hint}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.68rem] font-semibold tracking-wide transition-colors",
              active ? "bg-tinta text-hueso shadow" : "text-tinta-500 hover:text-tinta",
            )}
          >
            <span
              aria-hidden
              className="size-2.5 rounded-full ring-1 ring-black/15"
              style={{ background: option.dot }}
            />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
