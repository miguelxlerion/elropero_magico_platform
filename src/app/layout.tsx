import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { BrandSplash } from "@/components/layout/BrandSplash";
import { RouteProgress } from "@/components/layout/RouteProgress";
import { Providers } from "@/components/providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "El Ropero Mag&co — Moda de segunda mano curada en Bogotá",
    template: "%s · El Ropero Mag&co",
  },
  description:
    "Ropa y accesorios de segunda mano curados en Bogotá. Drops cada 15 días, medidas reales en cm, probador virtual 3D y pagos con PSE, Nequi y Daviplata.",
  keywords: ["ropa de segunda mano", "moda circular", "Bogotá", "vintage", "probador 3D", "drops"],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "El Ropero Mag&co",
    images: ["/images/hero.jpg"],
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Mag&co",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CO" className={`${cormorant.variable} ${manrope.variable}`} suppressHydrationWarning>
      <head>
        {/* Aplica la paleta guardada (Clásico/Mágico) antes del primer pintado para evitar parpadeo. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem("ropero-theme")==="magico"){document.documentElement.dataset.theme="magico";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>
          <BrandSplash />
          <RouteProgress />
          {children}
        </Providers>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border-border !bg-card !font-sans !shadow-xl",
              title: "!text-tinta !font-semibold",
              description: "!text-tinta-500",
            },
          }}
        />
        {/* Vercel Analytics solo existe en Vercel; en Cloudflare el script daría 404. */}
        {process.env.NEXT_PUBLIC_VERCEL_ENV ? <Analytics /> : null}
      </body>
    </html>
  );
}
