"use client";

import { useEffect, useState } from "react";
import type { DropSnapshot } from "@/types/drop";

export type RealtimeStatus = "connecting" | "live" | "offline";

export type DropRealtimeState = {
  drop: DropSnapshot | null;
  /** Diferencia (ms) entre el reloj del servidor y el del dispositivo. */
  offset: number;
  status: RealtimeStatus;
  received: boolean;
};

type Listener = (state: DropRealtimeState) => void;

// Estado inicial SSR-seguro: coincide con lo que renderiza el servidor.
const INITIAL_STATE: DropRealtimeState = { drop: null, offset: 0, status: "connecting", received: false };

// Conexión compartida: todos los countdowns de la página usan un único EventSource.
const listeners = new Set<Listener>();
let current: DropRealtimeState = { ...INITIAL_STATE };
let source: EventSource | null = null;
let pollTimer: number | undefined;
let watchdog: number | undefined;

function emit(patch: Partial<DropRealtimeState>) {
  current = { ...current, ...patch };
  listeners.forEach((listener) => listener(current));
}

function apply(payload: { drop: DropSnapshot | null; serverTime: number }) {
  emit({ drop: payload.drop, offset: payload.serverTime - Date.now(), status: "live", received: true });
}

async function poll() {
  try {
    const res = await fetch("/api/drops/next", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    apply((await res.json()) as { drop: DropSnapshot | null; serverTime: number });
  } catch {
    emit({ status: "offline" });
  }
}

function startPolling() {
  if (pollTimer) return;
  void poll();
  pollTimer = window.setInterval(poll, 30_000);
}

function connect() {
  if (typeof EventSource === "undefined") {
    startPolling();
    return;
  }
  source = new EventSource("/api/drops/stream");
  source.addEventListener("drop", (event) => {
    if (watchdog) {
      window.clearTimeout(watchdog);
      watchdog = undefined;
    }
    try {
      apply(JSON.parse((event as MessageEvent<string>).data));
    } catch {
      // payload inválido: se ignora
    }
  });
  source.onerror = () => {
    if (current.received) emit({ status: "offline" });
  };
  // Si algún proxy bufferiza SSE y no llega nada, caemos a polling.
  watchdog = window.setTimeout(() => {
    if (!current.received) {
      source?.close();
      source = null;
      startPolling();
    }
  }, 8_000);
}

function disconnect() {
  source?.close();
  source = null;
  if (pollTimer) window.clearInterval(pollTimer);
  if (watchdog) window.clearTimeout(watchdog);
  pollTimer = undefined;
  watchdog = undefined;
  current = { ...current, status: "connecting" };
}

export function useDropRealtime() {
  // El primer render debe ser idéntico al SSR ("connecting", sin datos vivos),
  // aunque el singleton ya esté en "live" por una página anterior (navegación
  // por cliente). El estado vivo se sincroniza en el efecto, tras hidratar.
  const [state, setState] = useState<DropRealtimeState>(INITIAL_STATE);
  useEffect(() => {
    listeners.add(setState);
    setState(current);
    if (listeners.size === 1) connect();
    return () => {
      listeners.delete(setState);
      if (listeners.size === 0) disconnect();
    };
  }, []);
  return state;
}
