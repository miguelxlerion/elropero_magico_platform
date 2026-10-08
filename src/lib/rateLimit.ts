/** Rate limiting en memoria (ventana deslizante por IP + ruta).
 *  Suficiente para una instancia; con múltiples instancias usar Redis/Upstash. */

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export type RateLimit = { ok: boolean; retryAfterSec: number };

export function checkRateLimit(req: Request, route: string, limit: number, windowMs: number): RateLimit {
  const key = `${route}:${clientIp(req)}`;
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);
  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    buckets.set(key, bucket);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)) };
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
  // Poda oportunista para no crecer sin cota.
  if (buckets.size > 5_000) {
    const [oldestKey] = buckets.keys();
    if (oldestKey) buckets.delete(oldestKey);
  }
  return { ok: true, retryAfterSec: 0 };
}

export function rateLimitedResponse(retryAfterSec: number) {
  return Response.json(
    { error: "Demasiados intentos, espera un momento e inténtalo de nuevo" },
    { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
  );
}
