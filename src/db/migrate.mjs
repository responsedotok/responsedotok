import { readdir } from  'node:fs/promises';
import { join } from 'node:path';
import postgres from 'postgres';

/**
 * For every `.sql` file in the migrations directory,
 * execute it against the database to update the schema.
 * Record the migration in the _migrations table, to
 * avoid duplicate execution.
 */
const here = import.meta.dirname;
const MIGRATIONS_DIR = process.env.MIGRATIONS_DIR ?? join(here, 'migrations');

/**
 * Migrates schema information to the database from the migrations directory.
 */
async function migrate() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('Error: DATABASE_URL is not set.');
    process.exit(1);
  }

  const sql = postgres(dbUrl, { max: 1 });
  try {
    await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
        id            SERIAL         PRIMARY KEY,
        filename      TEXT           NOT NULL,
        created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    )`;

    const rows = await sql`
      SELECT filename FROM _migrations
    `;
    const applied = new Set(rows.map((r) => r.filename));

    const f = await readdir(MIGRATIONS_DIR)
    const files = f.filter((i) => i.endsWith('.sql')).sort();
    if (files.length === 0) {
      console.info('No migration files found.');
      return;
    }

    for (const fi of files) {
      if (applied.has(fi)) {
        console.info(`${fi} was already applied. Skipping.`)
        continue;
      }
      console.info(`→  Applying migration: ${fi}`);
      await sql.begin(async (tx) => {
        await tx.file(join(MIGRATIONS_DIR, fi)).simple();
        await tx`
          INSERT INTO _migrations (filename)
          VALUES (${fi})
        `;
      })
    }
    console.info('All migrations complete.');

    } finally {
      await sql.end();
      
    }  
  }
  
  migrate().catch((err) => {
    console.error('Migration error:  ', err);
    process.exit(1);
  });
