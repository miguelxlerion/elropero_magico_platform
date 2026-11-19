import fs from "node:fs";
import path from "node:path";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const LOCAL_PATH = path.join(process.cwd(), "public", "manual", "manual-de-marca.html");
const ASSET_PATH = "/manual/manual-de-marca.html";

/**
 * Devuelve el HTML crudo del manual de marca.
 *
 * - En local (`next dev` / `next start`) el archivo está en disco: se lee con `fs`.
 * - En Cloudflare Workers `fs` no ve `public/` (el bundle no lo incluye), pero el
 *   archivo sí se sube como asset estático: se lee desde el binding `ASSETS`.
 *
 * Se memoiza por isolate para no repetir la lectura en cada request.
 */
let cached: string | null = null;

export async function readManualHtml(): Promise<string> {
  if (cached) return cached;

  // 1) Local: lectura directa del disco.
  try {
    cached = fs.readFileSync(LOCAL_PATH, "utf8");
    return cached;
  } catch {
    // Workers: no hay sistema de archivos para public/
  }

  // 2) Cloudflare Workers: el manual es un asset servido por el binding ASSETS.
  const { env } = await getCloudflareContext({ async: true });
  const assets = env.ASSETS;
  if (!assets) throw new Error("El binding ASSETS no está disponible");

  // El binding puede redirigir `archivo.html` -> `archivo` (html_handling), así que
  // se prueban ambas rutas.
  const candidates = [ASSET_PATH, ASSET_PATH.replace(/\.html$/, "")];
  for (const p of candidates) {
    const res = await assets.fetch(new Request(`https://assets.local${p}`), {
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      cached = html;
      return html;
    }
  }

  throw new Error("No se pudo cargar el manual de marca");
}
