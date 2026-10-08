"use client";

import { useCallback, useState } from "react";
import type { LightingPreset } from "@/components/3d/lighting";

export function use3DViewer(initialPreset: LightingPreset = "estudio") {
  const [preset, setPreset] = useState<LightingPreset>(initialPreset);
  const [autoRotate, setAutoRotate] = useState(true);
  const [resetKey, setResetKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const reset = useCallback(() => {
    setResetKey((k) => k + 1);
    setAutoRotate(true);
  }, []);

  const toggleAutoRotate = useCallback(() => setAutoRotate((v) => !v), []);

  const markInteracted = useCallback(() => {
    setHasInteracted(true);
  }, []);

  return {
    preset,
    setPreset,
    autoRotate,
    setAutoRotate,
    toggleAutoRotate,
    resetKey,
    reset,
    loaded,
    setLoaded,
    progress,
    setProgress,
    error,
    setError,
    hasInteracted,
    markInteracted,
  };
}

export type Viewer3DState = ReturnType<typeof use3DViewer>;
