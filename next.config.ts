import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  images: {
    // Las imágenes se sirven directamente desde el CDN de origen (Pexels / Supabase Storage).
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      // Miniaturas que entrega Behold para la sección /instagram: redistribuye el contenido de
      // Instagram desde sus propios hosts, no desde el CDN original.
      { protocol: "https", hostname: "behold.pictures" },
      { protocol: "https", hostname: "**.behold.so" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
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
