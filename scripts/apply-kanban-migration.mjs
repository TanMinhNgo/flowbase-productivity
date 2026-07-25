import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not configured. Run this with --env-file=.env.local.',
  );
}

const sql = neon(connectionString);
const migrations = [
  '0001_kanban.sql',
  '0002_kanban_in_review.sql',
  '0003_kanban_collaborators.sql',
  '0004_notes.sql',
  '0005_whiteboards.sql',
  '0006_spaces.sql',
  '0007_ai_templates.sql',
  '0008_settings.sql',
  '0009_ai_assistant.sql',
];
let appliedStatements = 0;

for (const migrationName of migrations) {
  const migration = await readFile(resolve('drizzle', migrationName), 'utf8');
  const statements = migration
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await sql.query(statement);
    appliedStatements += 1;
  }
}

console.log(
  `Applied ${appliedStatements} workspace migration statements through Neon HTTP.`,
);
