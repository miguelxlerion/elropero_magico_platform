const FALLBACK = "http://localhost:3000";

/** URL pública del sitio. Nunca revienta: si NEXT_PUBLIC_SITE_URL viene vacía
 *  o inválida (p. ej. un placeholder con <...>), cae al fallback en vez de
 *  romper `next build` con ERR_INVALID_URL. */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim() || FALLBACK;
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return FALLBACK;
    return url.toString().replace(/\/$/, "");
  } catch {
    return FALLBACK;
  }
}
