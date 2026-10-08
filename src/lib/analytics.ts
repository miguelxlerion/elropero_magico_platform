import posthog from "posthog-js";
import { track as vercelTrack } from "@vercel/analytics";

type Props = Record<string, string | number | boolean | null>;

/** Envía eventos a PostHog (si está configurado) y a Vercel Analytics. */
export function track(event: string, props: Props = {}) {
  if (typeof window === "undefined") return;
  try {
    if (posthog.__loaded) posthog.capture(event, props);
    vercelTrack(event, props);
  } catch {
    // La analítica nunca debe romper la experiencia de compra.
  }
}
