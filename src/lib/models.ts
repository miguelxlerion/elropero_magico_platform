/** Versión de los assets 3D (`public/models/*.glb`).
 *  Súbela cuando se regeneren los modelos para invalidar copias viejas en
 *  cachés de navegadores/CDN (los .glb corruptos de v1 quedaron cacheados). */
export const MODEL_ASSET_VERSION = "2";

export function versionedModelUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  return url.includes("?") ? url : `${url}?v=${MODEL_ASSET_VERSION}`;
}
