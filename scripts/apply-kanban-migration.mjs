import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not configured. Run this with --env-file=.env.local.");
}

const migrationPath = resolve("drizzle/0001_kanban.sql");
const migration = await readFile(migrationPath, "utf8");
const statements = migration
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

const sql = neon(connectionString);
for (const statement of statements) {
  await sql.query(statement);
}

console.log(`Applied ${statements.length} Kanban migration statements through Neon HTTP.`);
