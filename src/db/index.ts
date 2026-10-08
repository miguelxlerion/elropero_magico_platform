import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }
  const pool = new Pool({ connectionString: databaseUrl });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return pool;
}

function realPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = createPool();
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

type DrizzleDb = ReturnType<typeof drizzle>;

let memoDb: DrizzleDb | null = null;

function realDb(): DrizzleDb {
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
