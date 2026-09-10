import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Vercel: DATABASE_URL must be set in Environment Variables
// Local: falls back to .env / .env.local
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn(
    "⚠️  DATABASE_URL is not set. Build will continue but database queries will fail at runtime. Set DATABASE_URL in Vercel Environment Variables."
  );
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createPool(): Pool {
  if (globalForDb.__arenaNextJsPostgresqlPool) {
    return globalForDb.__arenaNextJsPostgresqlPool;
  }

  // Allow `next build` to succeed without DATABASE_URL (Vercel build needs env, but we don't crash the build).
  // Runtime queries will throw a clear error if DATABASE_URL is still missing.
  if (!databaseUrl) {
    const dummyPool = new Proxy({} as unknown as Pool, {
      get(_target, prop) {
        if (prop === "then") return undefined; // not a Promise
        if (prop === "connect" || prop === "query" || prop === "end" || prop === "on") {
          return () => {
            throw new Error(
              "DATABASE_URL is not set. Add it in Vercel Dashboard → Settings → Environment Variables and redeploy."
            );
          };
        }
        return () => {
          throw new Error("DATABASE_URL is not set");
        };
      },
    }) as Pool;
    return dummyPool;
  }

  const isLocal =
    databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");

  const pool = new Pool({
    connectionString: databaseUrl,
    // Managed Postgres (Neon, Vercel Postgres, Supabase, etc.) requires SSL
    ssl: isLocal ? false : { rejectUnauthorized: false },
    // Serverless-friendly pool settings for Vercel Functions
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Reuse pool in dev to avoid exhausting connections during HMR
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  // Optional: surface pool errors in logs (helps debugging on Vercel)
  pool.on("error", (err) => {
    console.error("Unexpected PG pool error", err);
  });

  return pool;
}

export const pool = createPool();
export const db = drizzle(pool, { schema });
