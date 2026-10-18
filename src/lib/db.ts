/**
 * Acesso ao banco. Postgres (Neon/Vercel) quando DATABASE_URL existe;
 * senão, PGlite (Postgres embutido) em .data/ localmente ou em memória na Vercel.
 * As datas são guardadas como texto ISO (AAAA-MM-DD) para evitar fuso horário.
 */
export type Row = Record<string, any>;
export interface Db {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  kind: 'postgres' | 'pglite-file' | 'pglite-memory';
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  room_type TEXT NOT NULL,
  checkin TEXT NOT NULL,
  checkout TEXT NOT NULL,
  adults INT NOT NULL DEFAULT 2,
  kids6 INT NOT NULL DEFAULT 0,
  kids7 INT NOT NULL DEFAULT 0,
  guest_name TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  guest_email TEXT,
  total_cents INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_dates ON reservations (room_type, checkin, checkout);
CREATE TABLE IF NOT EXISTS blocks (
  id SERIAL PRIMARY KEY,
  room_type TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

let dbPromise: Promise<Db> | null = null;

async function connect(): Promise<Db> {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || import.meta.env.DATABASE_URL;
  let db: Db;
  if (url) {
    const { default: pg } = await import('pg');
    const pool = new pg.Pool({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
      max: 3,
    });
    db = { kind: 'postgres', query: async (sql, params = []) => (await pool.query(sql, params as any[])).rows };
  } else {
    const { PGlite } = await import('@electric-sql/pglite');
    const onVercel = !!process.env.VERCEL;
    const dir = process.env.PGLITE_DIR || '.data/pglite';
    if (!onVercel) (await import('node:fs')).mkdirSync(dir, { recursive: true });
    const pgl = onVercel ? new PGlite() : new PGlite(dir);
    if (onVercel) console.warn('[db] Sem DATABASE_URL: usando banco em memória. Reservas não persistem. Crie um Postgres (Neon) na Vercel.');
    db = {
      kind: onVercel ? 'pglite-memory' : 'pglite-file',
      query: async (sql, params = []) => (await pgl.query(sql, params as any[])).rows as any[],
    };
  }
  for (const stmt of SCHEMA.split(';').map((s) => s.trim()).filter(Boolean)) await db.query(stmt);
  return db;
}

export function getDb(): Promise<Db> {
  if (!dbPromise) dbPromise = connect().catch((e) => { dbPromise = null; throw e; });
  return dbPromise;
}
