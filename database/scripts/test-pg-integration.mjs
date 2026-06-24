// Integration smoke-test: runs representative native-Postgres queries through
// the app's db.js pool against a REAL Postgres, verifying schema + CRUD work.
//
// Usage (needs a Postgres):  POSTGRES_URL=... node database/scripts/test-pg-integration.mjs
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('❌ Set POSTGRES_URL (or DATABASE_URL) to a test Postgres.');
  process.exit(1);
}

let pass = 0, fail = 0;
function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
}

async function main() {
  const { pool, q, ensureSchema } = await import('../../backend/lib/db.js');

  console.log('→ ensureSchema() (creates 15-table parity schema + seeds)…');
  await ensureSchema();

  // 1. auth-style lookup (active = 1 on SMALLINT) + seed present
  const users = await q('SELECT * FROM users WHERE active = 1 ORDER BY id LIMIT 1');
  check('users SELECT (active = 1)', users.length === 1 && users[0].id === 'U001', JSON.stringify(users[0] || {}));

  // 2. camelCase aliases survive (row.doerId, not row.doerid)
  const del = await q('SELECT id, doer_id AS "doerId", due_date AS "dueDate" FROM delegations ORDER BY id LIMIT 1');
  check('camelCase alias preserved', del.length === 0 || ('doerId' in del[0] && 'dueDate' in del[0]), JSON.stringify(del[0] || {}));

  // 3. app_config ON CONFLICT upsert (with $ placeholder in update clause)
  await pool.query(`INSERT INTO app_config ("key", "value") VALUES ('access_enabled', $1) ON CONFLICT ("key") DO UPDATE SET "value" = $2`, ['true', 'true']);
  await pool.query(`INSERT INTO app_config ("key", "value") VALUES ('access_enabled', $1) ON CONFLICT ("key") DO UPDATE SET "value" = $2`, ['false', 'false']);
  const cfg = await q(`SELECT "value" FROM app_config WHERE "key" = 'access_enabled'`);
  check('app_config upsert', cfg.length === 1 && cfg[0].value === 'false', JSON.stringify(cfg[0] || {}));

  // 4. checklist insert with NOW()/CURRENT_DATE, then CURRENT_DATE read
  await pool.query("DELETE FROM checklist_completions WHERE id = 'TST_INT'");
  await pool.query('INSERT INTO checklist_completions (id, master_id, doer, completed_at, date) VALUES ($1, $2, $3, NOW(), CURRENT_DATE)', ['TST_INT', 'CHK001', 'tester']);
  const cc = await q('SELECT master_id FROM checklist_completions WHERE date = CURRENT_DATE');
  check('CURRENT_DATE insert + read', cc.some((r) => r.master_id === 'CHK001'));

  // 5. dev_backups interval insert
  await pool.query("DELETE FROM dev_backups WHERE id = 'BKP_INT'");
  await pool.query("INSERT INTO dev_backups (id, label, data, expires_at) VALUES ($1, $2, $3, (NOW() + INTERVAL '15 DAY'))", ['BKP_INT', 'test', '{}']);
  const bk = await q('SELECT id FROM dev_backups WHERE expires_at > NOW() AND id = $1', ['BKP_INT']);
  check('interval insert', bk.length === 1);

  // 6. COUNT(*) AS cnt (lowercase alias)
  const cnt = await q('SELECT COUNT(*) AS cnt FROM users');
  check('COUNT(*) AS cnt', Number(cnt[0].cnt) >= 1, JSON.stringify(cnt[0] || {}));

  // cleanup
  await pool.query("DELETE FROM checklist_completions WHERE id = 'TST_INT'");
  await pool.query("DELETE FROM dev_backups WHERE id = 'BKP_INT'");

  console.log(`\n${fail === 0 ? '✅' : '❌'} pg integration: ${pass} passed, ${fail} failed`);
  await pool.end?.();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('❌ integration test crashed:', err.message);
  console.error(err);
  process.exit(1);
});
