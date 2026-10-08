# El Ropero Mag&co — Fusión (classic + classic2) · Prompt 1 + 2

Proyecto fusionado en `Templates/el_ropero_fusion`.

- **Base funcional:** `el_ropero_magico_classic2` (Next.js 16 App Router, Tailwind v4 + shadcn/Radix, Framer Motion, R3F + drei + model-viewer, Zustand, RHF + Zod, Drizzle, Wompi, IA describe, realtime drops, admin completo, 7 modelos `.glb` en `public/models/`).
- **Diseño editorial:** `el_ropero_magico_classic` (paper `#f8f7f2`, serif display, eyebrow con línea, hero-stamp girado, marquee, tarjeta editorial con quick-add bar, category tiles, story-stats).

## Nuevo diseño aplicado

- `src/app/globals.css`: token `hueso` unificado a paper classic + capa editorial (`.eyebrow-line`, `.hero-stamp`, `.editorial-marquee`, `.editorial-card`, `.editorial-badge`, `.quick-add-bar`, `.category-tile`, `.story-stats`).
- `HeroSection.tsx`: titular classic “Historias que siguen.” + subcopy Bogotá + stamp “Una vida más…” + caption + marquee classic, conservando `DropCountdown` realtime, badges 3D/AR y parallax Framer Motion.
- `ProductCard.tsx`: formato editorial 4/5 sin radius, badge “Pieza única”, quick-add bar “Agregar al ropero” (visible en hover/desktop, siempre en móvil), conservando 2ª imagen hover, badge 3D·AR, `ConditionBadge`, descuento, `formatCOP` y skeleton.
- `StorySection.tsx`: titular classic “El ropero no se acaba en ti.” + historia Magdalena + contadores + fila classic (15 días / 1 de 1 / 100%).
- `package.json`: renombrado a `el-ropero-fusion`, dependencias unidas (`@supabase/ssr`, `@supabase/supabase-js` + todo classic2), scripts `db:*`.
- `src/lib/supabase/`: cliente browser + server portados de classic (SSR con cookies).
- `src/db/schema.ts`: + `aiMetadata` en products y tabla `ai_processing_logs` (Prompt 2 auditoría/costos).
- `supabase/migrations/0001_prompt2_core.sql`: SQL Prompt 2 listo (tablas, índices, RLS).

## Prompt 1 — Frontend (estado)

- Estructura `app/(shop)`, `(auth)`, `admin`, `components/ui|product|3d|checkout|layout`, `lib/supabase|wompi`, `hooks`, `stores`, `types`: ✅.
- Landing: hero + countdown + 6 destacados + historia + newsletter/WhatsApp: ✅ (`(shop)/page.tsx`, `HeroSection`, `FeaturedGrid`, `StorySection`, `NewsletterCTA`).
- Catálogo con filtros (categoría, talla, marca, precio, condición) + orden “recién llegados”: ✅ (`CatalogView`, `FilterPanel`, `filterStore`).
- PDP: galería con zoom + medidas cm + `ConditionBadge` con tooltip + 3D/AR solo accesorios + descripción IA + relacionados: ✅ (`producto/[slug]`, `ProductGallery`, `SizeChart`, `AccessoryViewer`, `ARButton`, `Scene3D`, `Viewer3DSkeleton`).
- Checkout Wompi (PSE/Nequi/Daviplata/tarjeta) + contra entrega con recargo + envío Bogotá mismo día / nacional 2-4 días: ✅ (`CheckoutView`, `PaymentSelector`, `ShippingForm`, `lib/payments`, `lib/shipping`, `lib/wompi/checkout`).
- `AccessoryViewer` (rotación 360, zoom, iluminación, AR móvil, skeleton), `DropCountdown` (Framer Motion + realtime + notifícame), `ConditionBadge` (score + tooltip): ✅.
- Auth Supabase (email + Google), middleware, rate limiting, `next/image` AVIF/WebP, lazy 3D, PWA/SEO: parcial — ver `src/lib/auth.ts`, `src/app/api/*`, `layout.tsx` metadata/OG; pendientes: `middleware.ts`, `manifest.ts`, claves reales.

## Prompt 2 — Backend (estado)

- SQL + migraciones + RLS: ✅ (`supabase/migrations/0001_prompt2_core.sql`, `src/db/*`).
- Catalogación IA: ✅ parcial (`src/lib/ai/describe.ts` + `app/api/ai/describe`, `ProductForm` con trigger; prompt 3 párrafos ES-CO + JSON `description_html/seo_title/seo_description/tags`). Falta microservicio FastAPI separado (hoy es ruta Next); ver `ai-service/` pendiente si se quiere Python/LangChain/LangSmith.
- Wompi: ✅ parcial (`lib/wompi/checkout.ts`, `api/orders`, `api/wompi/webhook` con validación HMAC + idempotencia por `transaction_id`). Falta: llaves sandbox/prod + URL webhook pública + pruebas extremo a extremo.
- Logística (Servientrega/Enviame) + tracking: ⚠️ cálculo local en `lib/shipping.ts`; falta integración guía automática + Edge Function trigger.
- Notificaciones (Resend + WhatsApp Cloud): ⚠️ `NewsletterCTA`/`NotifyForm` + `subscribers`; falta proveedor real + templates React Email + eventos orden pagada/enviada.
- Observabilidad (Sentry/PostHog/LangSmith): parcial (PostHog + Vercel Analytics presentes; falta Sentry DSN + LangSmith trace en describe).

## Selector de paleta: Clásico / Mágico

- `src/hooks/useTheme.ts` + `src/components/layout/ThemeSwitcher.tsx`: control segmentado en el navbar (desktop y menú móvil). Persiste en `localStorage` (`ropero-theme`) y `src/app/layout.tsx` aplica la guardada antes del primer pintado (sin parpadeo).
- **Clásico** (defecto): tokens actuales — fondo hueso `#f8f7f2`, tinta `#151412`, acento salvia `#748a63`.
- **Mágico** (`html[data-theme="magico"]` en `src/app/globals.css`): jerarquía real del logo (`Logo/LogoRoperoMag.svg`, `.eps` revisado: mismo arte, sin Pantones) — fondo crema `#f5f5e1`, tinta verde profundo `#024e38`, acento funcional aqua `#8cc8c1` (escala salvia), detalles cálidos rosa polvo `#cb877c` (escala `rosa-*`, sello + titulares `h1 em`).
- Detalle técnico: los derivados de `@theme` pasaron de `inline` a normal para que las utilities usen `var()` y el override en runtime aplique; el fondo del navbar usa `color-mix(... var(--color-hueso))` en vez de `rgba` fijo.

## Logo real en el sitio

- `Logo/LogoRoperoMag.svg` (294 KB, 93% metadata Adobe PGF) → `public/logo-ropero-mag.svg` + `public/logo-mark.svg` (recorte `viewBox="520 100 330 360"` del ropero) de ~20 KB, y `src/app/icon.svg` (favicon).
- `Logo.tsx`: isologo + wordmark (navbar, auth, admin, 404). `Footer.tsx`: logo completo sobre verde oscuro. `(auth)/layout.tsx`: imagen apuntada a `/images/historia.jpg` (no existía `ropero.jpg`).

## Cargadores mágicos

- `components/layout/BrandSplash.tsx`: splash inicial con isologo flotante, destellos aqua/rosa, barra shimmer y “Abriendo el ropero…”. Solo primera vista por sesión (`sessionStorage`), mínimo 1.5 s, bloquea scroll, respeta la paleta activa (tokens).
- `components/layout/RouteProgress.tsx`: barra superior aqua→rosa durante navegación entre páginas.
- `app/(shop)/loading.tsx`: esqueletos por sección (hero + 6 `ProductCardSkeleton` + historia) con `skeleton-shimmer` y destellos.
- Tokens `rosa-*` añadidos al tema base para gradientes en ambas paletas.

## Endurecimiento aplicado (2026-10-08)
- `Scene3D.tsx`: el `<Html>` de drei desmontaba su root en el mismo commit del
  Suspense (error de consola). El % de carga ahora vive en overlay DOM
  (`LoadOverlay` con `useProgress` fuera del Canvas) + `console.error` en el boundary.
- `scripts/generate-models.mjs`: instancia nueva de `GLTFExporter` por modelo
  (reutilizarla corruptía cabeceras). Los 7 `.glb` de `public/models` estaban
  corruptos (6/7 con header/JSON basura) y se regeneraron; validados
  (`hdrLen==filesize`, JSON ok, buffers exactos).
- `src/lib/models.ts` (`MODEL_ASSET_VERSION`, `versionedModelUrl`): los .glb se
  sirven con `?v=2` para invalidar cachés con los corruptos. Subir la versión
  al regenerar modelos.
- `src/proxy.ts` (convención Next 16): rechaza sin sesión `/admin/*`, `/api/admin/*`, `/api/ai/*` (401 JSON o redirect a login) + headers `nosniff`, `Referrer-Policy`, `X-Frame-Options DENY`, `Permissions-Policy`. El rol lo sigue verificando `requireAdmin()` por ruta.
- `src/lib/rateLimit.ts` (ventana deslizante en memoria): login/register/subscribe 10/min, orders 20/min, webhook Wompi 120/min. Verificado: 10×401 y luego 429.
- `src/db/index.ts` perezoso: `npm run build` funciona sin `DATABASE_URL`.
- SEO/PWA: `sitemap.ts` (drops+productos), `robots.ts`, `manifest.ts`, iconos PNG 180/192/512 + `icon.svg`, metas Apple. Verificado en vivo (`/sitemap.xml` con 23 URLs).
- Guía de migración: `SUPABASE_SETUP.md`.

## Correr

```bash
cd Templates/el_ropero_fusion
npm install
npm run dev
npm run typecheck
npm run build
```

Variables: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `WOMPI_*`, `RESEND_*`, `WHATSAPP_*`, `OPENAI_*` según `src/lib/*`.
