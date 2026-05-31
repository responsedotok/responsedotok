import { resolve } from 'node:path';
import { config } from 'dotenv';

/**
 * Loads environment variables from .env.local for integration tests to
 * access Neon & Vercel Blob. Runs before test modules import @/lib/db.
 *
 */
config({ path: resolve(process.cwd(), '.env.local') });
