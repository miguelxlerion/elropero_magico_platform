import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

const siteUrl = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/catalogo`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/drops`, changeFrequency: "weekly", priority: 0.7 },
  ];

  try {
    const { getAllDrops, getCatalogProducts } = await import("@/lib/queries");
    const [drops, products] = await Promise.all([
      getAllDrops().catch(() => []),
      getCatalogProducts().catch(() => []),
    ]);
    return [
      ...staticRoutes,
      ...drops.map((d) => ({
        url: `${siteUrl}/drops/${d.id}`,
        lastModified: d.launch_date ? new Date(d.launch_date) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
      ...products.map((p) => ({
        url: `${siteUrl}/producto/${p.slug}`,
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
