// Runs every SQL file in supabase/migrations (all idempotent) against the Supabase database,
// then promotes ADMIN_EMAILS to admin. Skips quietly when no database is connected yet.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!url) {
  console.log("[migrate] No database connected yet; skipping migrations.");
  process.exit(0);
}
const dir = path.join(process.cwd(), "supabase", "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url.replace(/[?&]sslmode=[^&]*/, ""), ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const f of files) {
    const sql = await readFile(path.join(dir, f), "utf8");
    await client.query(sql);
    console.log(`[migrate] applied ${f}`);
  }
  const admins = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (admins.length) {
    const r = await client.query("update public.profiles set role = 'admin' where lower(email) = any($1) and role <> 'admin'", [admins]);
    console.log(`[migrate] admin accounts updated: ${r.rowCount}`);
  }
} finally {
  await client.end();
}
