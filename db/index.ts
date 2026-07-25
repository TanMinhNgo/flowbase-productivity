import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '@/db/schema';

const fallbackDatabaseUrl =
  'postgresql://user:password@example.com/flowbase?sslmode=require';
const rawDatabaseUrl = process.env.DATABASE_URL?.trim().replace(
  /^['"]|['"]$/g,
  '',
);

function isPostgresUrl(value: string | undefined) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'postgresql:' || url.protocol === 'postgres:';
  } catch {
    return false;
  }
}

// Keep route-module evaluation safe during builds. Runtime deployments still
// need a real Neon/Postgres DATABASE_URL for database-backed API requests.
const databaseUrl = isPostgresUrl(rawDatabaseUrl)
  ? rawDatabaseUrl!
  : fallbackDatabaseUrl;

const sql = neon(databaseUrl);
export const db = drizzle({ client: sql, schema });
export * from '@/db/schema';
