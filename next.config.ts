import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // pg habla con Hyperdrive vía pg-cloudflare en Workers: se quedan como
  // requires en runtime en vez de empaquetarse (el copiado trazado los deja
  // incompletos y rompe el bundle).
  serverExternalPackages: ["pg", "pg-cloudflare"],
  images: {
    // Las imágenes se sirven directamente desde el CDN de origen (Pexels / Supabase Storage).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/models/:path*",
        headers: [
          { key: "Content-Type", value: "model/gltf-binary" },
          { key: "Cache-Control", value: "public, max-age=604800, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
