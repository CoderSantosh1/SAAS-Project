import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

// The parts of a Supabase project the migrations rely on, including its broad
// default grants, so the tests prove the migrations lock those grants down.
const SUPABASE_STUB = `
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;

  create schema auth;
  create schema storage;
  create schema extensions;

  grant usage on schema auth, storage, extensions to anon, authenticated, service_role;

  create function extensions.gen_random_bytes(n integer) returns bytea
    language sql as $$ select decode(repeat('ab', n), 'hex') $$;
  grant execute on function extensions.gen_random_bytes(integer) to anon, authenticated, service_role;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text,
    raw_user_meta_data jsonb default '{}'::jsonb
  );

  create function auth.uid() returns uuid language sql stable as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
  $$;
  grant execute on function auth.uid() to anon, authenticated, service_role;

  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );

  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets (id),
    name text not null
  );
  alter table storage.objects enable row level security;
  grant select, insert, update, delete on storage.objects to anon, authenticated, service_role;

  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  grant execute on function storage.foldername(text) to anon, authenticated, service_role;

  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`;

export async function createTestDb() {
  const db = new PGlite();
  await db.exec(SUPABASE_STUB);

  for (const file of readdirSync(MIGRATIONS_DIR).sort()) {
    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
  }

  return db;
}

export type TestDb = PGlite;

async function reset(db: TestDb) {
  await db.exec(`reset role; select set_config('request.jwt.claims', '', false);`);
}

// Runs a query the way PostgREST would for this caller, then restores superuser.
export async function queryAs<T = Record<string, unknown>>(
  db: TestDb,
  userId: string | null,
  sql: string,
  params: unknown[] = [],
) {
  const claims = userId ? JSON.stringify({ sub: userId }) : "";
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [claims]);
  await db.exec(`set role ${userId ? "authenticated" : "anon"}`);
  try {
    return await db.query<T>(sql, params);
  } finally {
    await reset(db);
  }
}

export async function createUser(db: TestDb, email: string) {
  const result = await db.query<{ id: string }>(
    `insert into auth.users (email) values ($1) returning id`,
    [email],
  );
  return result.rows[0]!.id;
}

export async function assignRole(db: TestDb, userId: string, roleSlug: string) {
  await db.query(
    `insert into public.admin_user_roles (user_id, role_id)
     select $1, id from public.admin_roles where slug = $2`,
    [userId, roleSlug],
  );
}
