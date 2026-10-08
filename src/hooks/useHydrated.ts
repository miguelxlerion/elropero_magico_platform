"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` durante SSR e hidratación, `true` después del montaje en el cliente. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
