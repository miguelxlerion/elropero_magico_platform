# Deploy en Cloudflare (Workers + Neon + Hyperdrive)

La app usa Next.js 16 con el adapter oficial `@opennextjs/cloudflare`.
**No uses el producto "Pages"**: el camino soportado para Next.js con servidor
es **Workers** (el deploy te da `https://elropero-magico.<tu-subdominio>.workers.dev`;
luego puedes poner dominio propio o ruta `pages.dev` según tu setup).

## Lo que ya está en código

- `wrangler.jsonc` (worker `elropero-magico`, `nodejs_compat`, assets, binding `HYPERDRIVE`).
- `open-next.config.ts`, `next.config.ts` con `initOpenNextCloudflareForDev()`.
- `src/db/index.ts`: en Workers usa el binding Hyperdrive (driver `pg` con
  transacciones intactas); en local/build/scripts usa `DATABASE_URL`.
- Scripts: `preview`, `deploy`, `upload`, `cf-typegen`. Imágenes en `unoptimized`
  (sin Cloudflare Images; se puede activar después).

## 1. Base de datos Neon (gratis)

1. Crea cuenta en https://neon.tech → New project (región US East, Postgres 16+).
2. Copia el **connection string** (con password) del dashboard.
3. Crea las tablas desde tu PC:
   ```bash
   npx drizzle-kit push --dialect=postgresql --schema="./src/db/schema.ts" --url="postgresql://USER:PASS@HOST/dbname?sslmode=require"
   ```
4. (Opcional demo) Sembrar: apunta `DATABASE_URL` local a Neon y corre el seed.
   En producción real bórralo y crea tu admin/productos desde `/admin`.

## 2. Hyperdrive (pooling TCP para Workers, incluido en todos los planes)

```bash
npx wrangler login
npx wrangler hyperdrive create elropero-db --connection-string="postgresql://USER:PASS@HOST/dbname?sslmode=require"
```

Pega el `id` devuelto en `wrangler.jsonc` → `hyperdrive[0].id`.

## 3. Secretos de producción

```bash
npx wrangler secret put NEXT_PUBLIC_SITE_URL        # https://elropero-magico.<tu-subdominio>.workers.dev
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
2. Root directory: `Templates/el_ropero_fusion` (o la carpeta donde quede el proyecto).
3. Build command: `npx @opennextjs/cloudflare build`
4. Deploy command: `npx @opennextjs/cloudflare deploy`
5. Variables/secrets del paso 3 en el dashboard.

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
