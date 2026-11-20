import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

type DrizzleDb = ReturnType<typeof drizzle>;

/** Handle de base de datos: un Pool + su cliente Drizzle, siempre juntos. */
type DbHandle = { pool: Pool; db: DrizzleDb };

const globalForDb = globalThis as typeof globalThis & {
  /** Fallback sin scope de request (build, scripts, dev sin bindings). */
  __arenaNextJsPostgresqlHandle?: DbHandle;
  __arenaNextJsPostgresqlConnStr?: string;
};

/** Cadena de conexión según entorno:
 *  - Local: DATABASE_URL (.env.local), para que el dev no dependa del placeholder de wrangler.jsonc.
 *  - Cloudflare Workers: binding Hyperdrive (pooling TCP; retiene pg + transacciones).
 *  - Build/scripts sin ninguna de las dos: falla al primer query, no al importar.
 */
function resolveConnectionString(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return databaseUrl;
  try {
    const env = getCloudflareContext().env as unknown as {
      HYPERDRIVE?: { connectionString?: string };
    };
    const hyperdrive = env?.HYPERDRIVE?.connectionString;
    if (hyperdrive) return hyperdrive;
  } catch {
    // Fuera de request scope (build, scripts, dev sin bindings).
  }
  throw new Error("DATABASE_URL is required");
}

/** Clave por request.
 *
 *  En Cloudflare Workers `getCloudflareContext()` devuelve el store del
 *  AsyncLocalStorage que OpenNext crea **una vez por request**, así que sirve
 *  como identificador de request. En `next dev` devuelve un objeto fijo
 *  (compartido), lo cual es deseable: un único Pool para todo el proceso.
 *
 *  Devuelve `null` cuando no hay scope de request (build, scripts): en ese
 *  caso se usa el handle global del proceso.
 */
function requestKey(): object | null {
  try {
    const store: unknown = getCloudflareContext();
    return store && typeof store === "object" ? (store as object) : null;
  } catch {
    return null;
  }
}

/** Timeouts para que una consulta colgada falle rápido en vez de dejar al
 *  Worker colgado ( Workers cancela la petición con un 500 si el código nunca
 *  responde ).
 *
 *  - `connectionTimeoutMillis`: acota el TCP+TLS handshake con Hyperdrive.
 *  - `query_timeout` (pg, client-side): acota la espera de la respuesta,
 *    incluida la cola de PgBouncer (query_wait_timeout = 120 s en Neon).
 *    Si salta, la conexión queda ocupada pero el Pool es por request y se
 *    descarta al terminar, así que no contamina a otras peticiones.
 *  - `idleTimeoutMillis`: cierra los sockets ociosos (por defecto 10 s).
 */
const POOL_OPTIONS = {
  max: 5,
  connectionTimeoutMillis: 8_000,
  idleTimeoutMillis: 10_000,
  query_timeout: 15_000,
} as const;

function createHandle(connectionString: string): DbHandle {
  const pool = new Pool({ connectionString, ...POOL_OPTIONS });
  // Un error en una conexión ociosa no debe tumbar el Worker entero
  // (sin este listener, `error` no manejado en un EventEmitter es throw).
  pool.on("error", (err) => {
    console.error("[db] error en conexión ociosa:", err);
  });
  return { pool, db: drizzle(pool) };
}

/** Handles por request. Débil para que el handle (y su Pool) se recolecten
 *  solos cuando el store del request deja de ser alcanzable. */
const requestHandles = new WeakMap<object, DbHandle>();

function globalHandle(): DbHandle {
  const want = (() => {
    try {
      return resolveConnectionString();
    } catch {
      return "";
    }
  })();
  if (!globalForDb.__arenaNextJsPostgresqlHandle || globalForDb.__arenaNextJsPostgresqlConnStr !== want) {
    const handle = createHandle(resolveConnectionString());
    globalForDb.__arenaNextJsPostgresqlHandle = handle;
    globalForDb.__arenaNextJsPostgresqlConnStr = want;
  }
  return globalForDb.__arenaNextJsPostgresqlHandle;
}

/** Devuelve el Pool + Drizzle de la request actual.
 *
 *  IMPORTANTE: en Workers cada request debe usar su propio Pool. Un socket
 *  creado durante la request A muere con la request A; si la request B lo
 *  reutiliza, la promesa nunca se resuelve y el runtime cancela la petición
 *  ("your Worker's code had hung"). Ver:
 *  https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/
 */
function handle(): DbHandle {
  const key = requestKey();
  if (key) {
    const existing = requestHandles.get(key);
    if (existing) return existing;
    const created = createHandle(resolveConnectionString());
    requestHandles.set(key, created);
    return created;
  }
  return globalHandle();
}

/** Pool perezoso: la conexión se crea al primer query, no al importar el módulo.
 *  Permite `next build` sin DATABASE_URL; fallar solo ocurre en runtime si falta. */
export const pool: Pool = new Proxy({} as Pool, {
  get: (_target, prop) => {
    const current = handle();
    const value = (current.pool as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(current.pool) : value;
  },
});

/** Cliente Drizzle perezoso por el mismo motivo (drizzle() no toca la red al construirse,
 *  pero así ni siquiera se construye durante el build). */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get: (_target, prop) => {
    const current = handle();
    const value = (current.db as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(current.db) : value;
  },
});
