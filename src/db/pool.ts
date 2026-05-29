import postgres, { type Sql } from 'postgres';

const globalForDb = globalThis as unknown as { _sql?: Sql };

/**
 * Creates a single shared connection pool for the database.
 */
export const sql: Sql =
  globalForDb._sql ??
  postgres(process.env.DATABASE_URL ?? '', {
    max: process.env.NODE_ENV === 'production' ? 10 : 4,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') globalForDb._sql = sql;
