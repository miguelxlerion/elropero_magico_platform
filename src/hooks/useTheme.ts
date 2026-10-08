"use client";

import { useCallback, useEffect, useState } from "react";

export type SiteTheme = "clasico" | "magico";

export const THEME_STORAGE_KEY = "ropero-theme";

export function getStoredTheme(): SiteTheme {
  if (typeof window === "undefined") return "clasico";
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "magico" ? "magico" : "clasico";
  } catch {
    return "clasico";
  }
}

export function applyTheme(theme: SiteTheme) {
  const root = document.documentElement;
  if (theme === "magico") {
    root.dataset.theme = "magico";
  } else {
    delete root.dataset.theme;
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // almacenamiento no disponible: el tema igual aplica en memoria
  }
}

/** Paleta Clásico (beige/salvia actual) vs Mágico (colores del logo). Persiste en localStorage. */
export function useTheme() {
  const [theme, setThemeState] = useState<SiteTheme>("clasico");

  useEffect(() => {
    setThemeState(getStoredTheme());
  }, []);

  const setTheme = useCallback((next: SiteTheme) => {
    setThemeState(next);
    applyTheme(next);
  }, []);

  return { theme, setTheme };
}
