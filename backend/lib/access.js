import { pool } from './db.js';

export async function isAccessEnabled() {
  if (!(process.env.POSTGRES_URL || process.env.DATABASE_URL)) return true;
  try {
    const { rows } = await pool.query(
      `SELECT "value" FROM app_config WHERE "key" = 'access_enabled'`
    );
    if (!rows.length) return true;
    return rows[0].value !== 'false';
  } catch {
    return true;
  }
}

export async function setAccessEnabled(enabled) {
  await pool.query(
    `INSERT INTO app_config ("key", "value") VALUES ('access_enabled', $1) ON CONFLICT ("key") DO UPDATE SET "value" = $2`,
    [String(enabled), String(enabled)]
  );
}
