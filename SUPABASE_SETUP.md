# Pasar la fusión a Supabase real (10 minutos)

La app hoy corre contra Postgres local (Docker). Estos pasos la mudan a Supabase
manteniendo el mismo código. Lo que NO puedes delegar: crear el proyecto y copiar
las llaves (requieren tu cuenta).

## 1. Crear el proyecto

1. Entra a https://supabase.com/dashboard → New project.
2. Región: **South America (São Paulo)** (la más cercana a Colombia).
3. Guarda el **database password** en un lugar seguro.
4. Espera a que el proyecto quede en verde.

## 2. Crear las tablas (las que usa la app)

> ⚠️ Hay DOS esquemas en el repo y DIVERGEN a propósito:
> - `src/db/schema.ts` (Drizzle) = **el que usa la app** (auth propia con
>   `users`/`sessions`, precios en pesos, `ai_processing_logs` incluido).
> - `supabase/migrations/0001_prompt2_core.sql` = especificación del Prompt 2
>   (centavos, `auth.users`). Úsalo como **referencia**, NO apliques sus
>   `CREATE TABLE` o duplicarás/romperás tablas.
>
> Aplica las tablas con Drizzle contra Supabase:

```bash
# En Supabase: Project Settings → Database → Connection string (modo Direct, puerto 5432)
npx drizzle-kit push --dialect=postgresql --schema="./src/db/schema.ts" --url="postgresql://postgres:TU_PASSWORD@db.TU_REF.supabase.co:5432/postgres"
```

Verifica en Table Editor: `drops, products, orders, order_items, subscribers,
users, sessions, ai_processing_logs`.

## 3. RLS (opcional, recomendado)

La app escribe por API routes (rol `postgres`, bypasea RLS). El RLS solo protege
el acceso browser con anon key (lecturas de `lib/supabase/queries.ts`). Si vas a
exponer la anon key, ejecuta SOLO este bloque en SQL Editor:

```sql
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Productos publicados son públicos" ON products;
CREATE POLICY "Productos publicados son públicos" ON products
  FOR SELECT USING (status = 'published');
```

## 4. Variables de entorno (`.env.local`, no se commitea)

```bash
# Conexión app — usa el POOLER (Session mode, puerto 6543) para Vercel/dev
DATABASE_URL=postgresql://postgres.TU_REF:TU_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SITE_URL=http://localhost:3100

# Lecturas browser (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://TU_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Cuando las tengas (Wompi sandbox primero)
WOMPI_PUBLIC_KEY=pub_test_...
WOMPI_PRIVATE_KEY=prv_test_...
WOMPI_INTEGRITY_SECRET=test_...
WOMPI_EVENTS_SECRET=test_...

# Más adelante
RESEND_API_KEY=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
OPENAI_API_KEY=
```

Luego: `npm run dev` y entra a `/admin/dashboard` (crea el admin con el seed:
`admin@elroperomagco.co` / `MagcoAdmin2025`, cámbiala después).

## 5. Wompi sandbox

1. https://dashboard.wompi.co → ambiente **Sandbox** → copia llaves al `.env.local`.
2. Eventos → Notificaciones → agrega `https://TU_DOMINIO/api/wompi/webhook`
   y suscríbelo a `transaction.updated`.
3. Haz un pago de prueba de $1.000 y verifica `/pedido/[referencia]` y el admin.

## 6. Vercel

1. Importa el repo, root en `Templates/el_ropero_fusion` (o mueve la carpeta).
2. Environment Variables: las mismas de `.env.local` con `DATABASE_URL` del pooler
   y `NEXT_PUBLIC_SITE_URL=https://tu-dominio.com`.
3. Deploy. El `npm run build` ya no exige base de datos (conexión perezosa).

## Notas

- Rate limiting es en memoria: con varias instancias de Vercel usa Redis/Upstash.
- El seed (`ensureSeeded`) inserta drops/productos demo si las tablas están vacías;
  bórralos desde el admin antes de producción.
- Pendiente mayor (requiere decisión): esquema Prompt-2 exacto (centavos +
  Supabase Auth) implicaría migrar `lib/queries`, validaciones y seed.
