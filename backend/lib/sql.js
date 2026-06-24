import { pool } from './db.js';

// Tagged-template SQL adapter for Postgres.
// Builds $1..$n placeholders from the interpolated values.
// Usage: await sql`SELECT * FROM users WHERE id = ${id}`
export async function sql(strings, ...values) {
  let text = '';
  const params = [];
  strings.forEach((str, i) => {
    text += str;
    if (i < values.length) {
      const v = values[i];
      params.push(Array.isArray(v) ? v.join(',') : (v ?? null));
      text += '$' + params.length;
    }
  });
  const { rows } = await pool.query(text, params);
  return rows;
}

// Helper: COUNT(*) AS cnt → number
export async function count(table) {
  const { rows } = await pool.query(`SELECT COUNT(*) AS cnt FROM "${table}"`);
  return Number(rows[0].cnt);
}
