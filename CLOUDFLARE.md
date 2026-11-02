# Deploy en Cloudflare (Workers + Supabase + Hyperdrive)

La app usa Next.js 16 con el adapter oficial `@opennextjs/cloudflare`.
**No uses el producto "Pages"**: el camino soportado para Next.js con servidor
es **Workers** (el deploy te da `https://elropero-magico-platform.<tu-subdominio>.workers.dev`;
luego puedes poner dominio propio o ruta `pages.dev` según tu setup).

## Lo que ya está en código

- `wrangler.jsonc` (worker `elropero-magico-platform`, `nodejs_compat`, assets y binding
  `HYPERDRIVE` — hoy comentado hasta existir el Hyperdrive real).
- `open-next.config.ts`, `next.config.ts` con `initOpenNextCloudflareForDev()`.
- `src/db/index.ts`: en Workers usa el binding Hyperdrive (driver `pg` con
  transacciones intactas); en local/build/scripts usa `DATABASE_URL`.
- Scripts: `preview`, `deploy`, `upload`, `cf-typegen`. Imágenes en `unoptimized`
  (sin Cloudflare Images; se puede activar después).

## 1. Base de datos (Supabase)

La app habla con Postgres con el driver `pg` (no con el cliente JS de Supabase), así que
Supabase se usa solo como servidor Postgres administrado. Neon sirve igual si algún día
cambias: todo lo de abajo aplica cambiando la cadena.

1. Crea el proyecto y toma de **Settings → Database** la **Direct connection**
   (`db.<ref>.supabase.co:5432`, base `postgres`, usuario `postgres`). No uses las del
   pooler (`aws-0-...pooler.supabase.com`): el pooling lo hace Hyperdrive, y la doc de
   Cloudflare pide explícitamente la conexión directa.
2. Si el proyecto tiene **IP Restrictions** activas, autoriza las IPs de salida de Hyperdrive
   que muestra el dashboard al crearlo; y si el proyecto es de los que solo exponen IPv4 en el
   pooler, verifica que la conexión directa resolva desde Cloudflare.
3. Crea las tablas desde tu PC:
   ```bash
   npx drizzle-kit push --dialect=postgresql --schema="./src/db/schema.ts" --url="postgres://postgres:PASS@db.REF.supabase.co:5432/postgres?sslmode=require"
   ```
4. (Opcional demo) Sembrar: define `DATABASE_URL` (esa cadena) y `DEMO_ADMIN_EMAIL` /
   `DEMO_ADMIN_PASSWORD` en un entorno controlado y corre `npm run db:seed`.
   En producción real bórralo y crea tu admin/productos desde `/admin`.

## 2. Hyperdrive (pooling TCP para Workers, incluido en todos los planes)

```bash
npx wrangler login   # con la cuenta DUEÑA del worker, no con la del token de xleriondev
npx wrangler hyperdrive create elropero-db --connection-string="postgres://postgres:PASS@db.REF.supabase.co:5432/postgres?sslmode=require"
```

Pega el `id` (UUID) devuelto en `wrangler.jsonc` → `hyperdrive[0].id` y quita el comentario
que hoy mantiene el bloque inerte. O alternativamente adjunta el Hyperdrive en el dashboard
(Settings → Bindings → Add Hyperdrive) con **Variable name `HYPERDRIVE`** exacto — pero entonces
el bloque de `wrangler.jsonc` debe quedar activado igual, porque cada push desde GitHub
repliega la config del archivo y un binding que solo existe en el dashboard se pierde.

## 3. Secretos de producción

```bash
npx wrangler secret put NEXT_PUBLIC_SITE_URL        # https://elropero-magico-platform.<tu-subdominio>.workers.dev
npx wrangler secret put WOMPI_PUBLIC_KEY
npx wrangler secret put WOMPI_PRIVATE_KEY
npx wrangler secret put WOMPI_INTEGRITY_SECRET
npx wrangler secret put WOMPI_EVENTS_SECRET
npx wrangler secret put OPENAI_API_KEY              # opcional por ahora
```

`NEXT_PUBLIC_*` también deben existir como **Build variables** si usas Workers Builds.

## 4. Deploy

**Opción A — CLI (una vez):**
```bash
npm run deploy
```

**Opción B — Workers Builds (recomendado, auto-deploy con cada push):**
1. Cloudflare dashboard → Workers & Pages → Create → **Workers** → Connect GitHub → `miguelxlerion/elropero_magico_platform`.
2. Production branch: `main`. El repo tiene una sola rama y este proyecto vive en ella.
3. Root directory: `/` — este proyecto está en la raíz del repo.
4. Build command: `npx @opennextjs/cloudflare build`
5. Deploy command: `npx @opennextjs/cloudflare deploy`
6. Variables/secrets de la sección 3 en el dashboard.

## 5. Probar local como en Workers

```bash
cp .dev.vars.example .dev.vars   # ajusta valores
npm run preview                   # sirve en http://localhost:8719
```

## Notas y límites

- `wrangler types` genera `cloudflare-env.d.ts` (`npm run cf-typegen`).
- Rate limiting es en memoria **por isolate**: en Workers cada instancia lleva su
  contador. Para límites globales usa Rate Limiting de Cloudflare o Redis/Upstash.
- Tamaño del Worker: 3 MB (free) / 10 MB (paid) comprimido; `three.js` va en
  chunks de cliente, no en el Worker.
- R2 para caché incremental es opcional (ver `open-next.config.ts`).
- Wompi sandbox: configura el webhook a `https://TU-WORKER/api/wompi/webhook`.
