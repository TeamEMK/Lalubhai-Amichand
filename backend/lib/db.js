/* =====================================================================
   App-facing database facade — Postgres only.
   ---------------------------------------------------------------------
   The low-level pg Pool, schema bootstrap and seed live in db-postgres.js.
   Here we wrap that pool so that:
     - writes bust the in-memory store cache (see store.js),
     - routes get node-postgres' native result shape ({ rows, rowCount }).
   Routes use native Postgres SQL ($1 placeholders, "quoted" idents,
   ON CONFLICT, CURRENT_DATE, ...) and read `.rows` / use q().
   ===================================================================== */
import {
  pool as pgPool,
  ensureSchema as pgEnsureSchema,
  toIso,
  toDateStr,
} from './db-postgres.js';

const globalForPool = globalThis;

/* =====================================================================
   Store cache invalidation
   readStore() in store.js caches the full store in memory. Any write must
   bust that cache; we bump a global version counter whenever a write runs
   through the pool, so every current/future writer is covered.
   ===================================================================== */
if (globalForPool.__store_version == null) globalForPool.__store_version = 0;

export function getStoreVersion() {
  return globalForPool.__store_version;
}
export function bumpStoreVersion() {
  globalForPool.__store_version++;
}

const WRITE_RE = /^\s*(INSERT|UPDATE|DELETE|TRUNCATE)\b/i;
function isWriteSql(text) {
  return typeof text === 'string' && WRITE_RE.test(text);
}

// Wrap the native pg pool so writes invalidate the store cache. The result
// keeps node-postgres' native shape: { rows, rowCount, fields }.
function wrapPool(raw) {
  if (!raw) {
    return {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: async () => { throw new Error('Postgres not configured (set POSTGRES_URL).'); },
      end: async () => {},
    };
  }
  return {
    query(text, params) {
      if (isWriteSql(text)) bumpStoreVersion();
      return raw.query(text, params);
    },
    connect: (...a) => raw.connect(...a),
    end: () => raw.end(),
  };
}

export const pool = wrapPool(pgPool);

// Run a query and get the rows array directly. Goes through the wrapped
// pool, so writes via q() also bust the cache.
export async function q(text, params) {
  const { rows } = await pool.query(text, params);
  return rows;
}

export async function ensureSchema() {
  return pgEnsureSchema();
}

export { toIso, toDateStr };
