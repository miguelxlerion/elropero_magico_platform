import { getCloudflareContext } from "@opennextjs/cloudflare";
import { neonConfig, Pool as NeonPool } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { cache } from "react";
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
 * Instancia Drizzle aislada POR REQUEST (React cache()).
 *
 * Por qué: Workers prohíbe usar objetos de I/O (sockets, sesiones WS) creados
 * en el handler de un request desde otro request
 * ("Cannot perform I/O on behalf of a different request"). Un pool singleton
 * funciona en Node pero en Workers falla de forma intermitente: el primer
 * request de cada isolate va bien y los siguientes reusan sockets ajenos.
 * Con cache(), cada request crea su propio NeonPool y nunca se comparte.
 */
const getRequestDb = cache((): DrizzleDb => {
  return drizzleNeon(new NeonPool({ connectionString: neonConnectionString() })) as unknown as DrizzleDb;
});

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const pool = new Pool({
    connectionString: databaseUrl,
    // Acota esperas: sin esto, un socket muerto cuelga el request.
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 10_000,
  });
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
    const value = (realPool() as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(realPool()) : value;
  },
});

/** Cliente Drizzle perezoso por el mismo motivo (drizzle() no toca la red al construirse,
 *  pero así ni siquiera se construye durante el build). */
export const db: DrizzleDb = new Proxy({} as DrizzleDb, {
  get: (_target, prop) => {
    const value = (realDb() as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function" ? (value as (...a: never[]) => unknown).bind(realDb()) : value;
  },
});
