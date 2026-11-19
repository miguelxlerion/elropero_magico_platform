import fs from "node:fs";
import path from "node:path";
import { headers } from "next/headers";

const LOCAL_PATH = path.join(process.cwd(), "public", "manual", "manual-de-marca.html");
const PUBLIC_URL = "/manual/manual-de-marca.html";

/**
 * Devuelve el HTML crudo del manual de marca.
 *
 * - En local (`next dev` / `next start`) lee de disco con `fs`.
 * - En Cloudflare Workers `fs` no ve `public/` (el bundle no lo incluye), así que
 *   se hace fallback a un fetch al mismo origen, donde el archivo sí está subido
 *   como asset estático.
 *
 * Se memoiza por isolate para no repetir el fetch en cada request.
 */
let cached: string | null = null;

export async function readManualHtml(): Promise<string> {
  if (cached) return cached;

  try {
    cached = fs.readFileSync(LOCAL_PATH, "utf8");
    return cached;
  } catch {
    // Workers: no hay sistema de archivos para public/
  }

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host");
  if (!host) throw new Error("No se pudo resolver el host para cargar el manual");

  const res = await fetch(`${proto}://${host}${PUBLIC_URL}`, { cache: "force-cache" });
  if (!res.ok) throw new Error(`No se pudo cargar el manual (HTTP ${res.status})`);

  cached = await res.text();
  return cached;
}
