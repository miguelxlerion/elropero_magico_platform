import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "El Ropero Mag&co — Segunda mano curada en Bogotá",
    short_name: "Mag&co",
    description:
      "Ropa y accesorios de segunda mano curados en Bogotá. Drops cada 15 días, medidas reales y probador 3D.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f8f7f2",
    theme_color: "#151412",
    lang: "es-CO",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
