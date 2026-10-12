import { getCloudflareContext } from "@opennextjs/cloudflare";
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import ws from "ws";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsPostgresqlConnStr?: string;
  __arenaIsolatedDb?: boolean;
};

if (typeof WebSocket === "undefined") {
  // Solo Node (dev/build/scripts): el driver Neon necesita un WebSocket.
  // En Workers existe nativo y no se toca.
  neonConfig.webSocketConstructor = ws;
}

// Errores de CONEXIÓN (no de SQL): la query nunca llegó o la respuesta se
// perdió (sockets ociosos muertos, wake de Neon suspendido, etc.). Reintentar
// UNA vez es seguro aquí porque solo se aplica al adquirir/ejecutar contra el
// pool; dentro de transacciones Drizzle usa el cliente ya obtenido, sin pasar
// por este wrapper (sin riesgo de doble-ejecutar un bloque transaccional).
const RETRYABLE = [
  /ECONNREFUSED/,
  /ETIMEDOUT/,
  /ENOTFOUND/,
  /EHOSTUNREACH/,
  /EPIPE/,
  /ECONNRESET/,
  /terminat/i,
  /timeout/i,
  /connection closed/i,
  /connection ended/i,
  /too many clients/i,
  /Connection closed/,
];

function isRetryable(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return RETRYABLE.some((re) => re.test(message));
}

type QueryFn = (...args: never[]) => Promise<unknown>;

/** Envuelve pool.query/pool.connect con un reintento ante fallos de conexión. */
function withConnectionRetry<T extends { query: QueryFn; connect: QueryFn }>(pool: T): T {
  const originalQuery = pool.query.bind(pool) as QueryFn;
  const originalConnect = pool.connect.bind(pool) as QueryFn;
  (pool as { query: QueryFn }).query = (async (...args: never[]) => {
    try {
      return await originalQuery(...args);
    } catch (error) {
      if (!isRetryable(error)) throw error;
      return await originalQuery(...args);
    }
  }) as QueryFn;
  (pool as { connect: QueryFn }).connect = (async (...args: never[]) => {
    try {
      return await originalConnect(...args);
    } catch (error) {
      if (!isRetryable(error)) throw error;
      return await originalConnect(...args);
    }
  }) as QueryFn;
  return pool;
}

/**
 * ¿Estamos en el runtime de Workers en producción (o preview)?
 * Solo ahí se aíslan las conexiones por request; en Node (dev, build,
 * scripts, `next start`) se comparte el pool clásico sin problema.
 */
function useIsolatedDb(): boolean {
  if (globalForDb.__arenaIsolatedDb !== undefined) return globalForDb.__arenaIsolatedDb;
  let isolated = false;
  if (process.env.NODE_ENV === "production") {
    try {
      getCloudflareContext();
      isolated = true;
    } catch {
      isolated = false;
    }
  }
  globalForDb.__arenaIsolatedDb = isolated;
  return isolated;
}

/** URL de Neon para el driver serverless (WebSocket). */
function neonConnectionString(): string {
  const url = process.env.NEON_DATABASE_URL;
  if (!url) throw new Error("NEON_DATABASE_URL is required");
  return url;
}

/**
 * Instancia Drizzle aislada: se crea UNA NUEVA por cada acceso raíz (`db.select`,
 * `db.transaction`, …). Como el encadenado de builders es síncrono, toda la
 * expresión usa la misma instancia, y las transacciones corren en una sola sesión.
 *
 * Por qué no se comparte: Workers prohíbe usar objetos de I/O (sockets, sesiones
 * WS) creados en el handler de un request desde otro request. Ni el singleton ni
 * React `cache()` sirven aquí (`cache()` no aísla los route handlers: verificado
 * con /api/health en 500 determinista mientras las páginas iban bien). Cada
 * instancia abre su sesión WS dentro del request que la usa y nunca se reutiliza
 * en otro. Las sesiones ociosas las recoge Neon en minutos.
 */
const getRequestDb = (): DrizzleDb => {
  return drizzleNeon(withConnectionRetry(new NeonPool({ connectionString: neonConnectionString() }))) as unknown as DrizzleDb;
};

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const pool = withConnectionRetry(
    new Pool({
      connectionString: databaseUrl,
      // Acota esperas: sin esto, un socket muerto cuelga el request.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
    }),
  );
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
    globalForDb.__arenaNextJsPostgresqlConnStr = databaseUrl;
  }
  return pool;
}

function realPool(): Pool {
  const want = process.env.DATABASE_URL ?? "";
  if (!globalForDb.__arenaNextJsPostgresqlPool || globalForDb.__arenaNextJsPostgresqlConnStr !== want) {
    globalForDb.__arenaNextJsPostgresqlPool = createPool();
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

type DrizzleDb = ReturnType<typeof drizzle>;

let memoDb: DrizzleDb | null = null;

function realDb(): DrizzleDb {
  if (useIsolatedDb()) return getRequestDb();
  if (!memoDb) memoDb = drizzle(realPool());
  return memoDb;
}

/** Pool perezoso: la conexión se crea al primer query, no al importar el módulo.
 *  Permite `next build` sin DATABASE_URL; fallar solo ocurre en runtime si falta. */
export const pool: Pool = new Proxy({} as Pool, {
  get: (_target, prop) => {
    const instance = realPool();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(instance) : value;
  },
});

/** Cliente Drizzle perezoso por el mismo motivo (drizzle() no toca la red al construirse,
 *  pero así ni siquiera se construye durante el build). */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get: (_target, prop) => {
    const instance = realDb();
    const value = (instance as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(instance) : value;
  },
});
