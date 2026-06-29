'use strict';
/**
 * One-time script to add users from CSV data.
 * Run on server: node scripts/add-users.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const bcrypt = require('bcryptjs');

const USERS = [
  { name: 'John Doe',   email: 'john@test.com', password: 'pass123', role: 'user',  user_role: 'user', phone: '9876543210', department: 'Sales'      },
  { name: 'Jane Smith', email: 'jane@test.com', password: 'pass123', role: 'hod',   user_role: 'hod',  phone: '9876543211', department: 'Production' },
  { name: 'IT Admin',   email: 'it@test.com',   password: 'pass123', role: 'admin', user_role: 'user', phone: '9876543212', department: 'IT'         },
];

function parseRoles(role, userRole) {
  const combined = [role, userRole].join(',').toLowerCase();
  const roles = [];
  if (combined.includes('admin')) roles.push('Admin');
  if (combined.includes('hod'))   roles.push('HOD');
  if (combined.includes('user'))  roles.push('User');
  return roles.length ? roles : ['User'];
}

async function run() {
  // ── Database connection ─────────────────────────────────────────────
  const DB_TYPE = (process.env.DB_TYPE || '').toLowerCase();

  if (DB_TYPE === 'mysql' || (!process.env.DATABASE_URL && process.env.DB_HOST)) {
    // MySQL
    const mysql = require('mysql2/promise');
    const pool = await mysql.createPool({
      host: process.env.DB_HOST, port: +(process.env.DB_PORT || 3306),
      user: process.env.DB_USER, password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await insertUsers(pool, 'mysql');
    await pool.end();
  } else if (process.env.DATABASE_URL || process.env.DB_HOST) {
    // PostgreSQL
    const { Pool } = require('pg');
    const connStr = process.env.DATABASE_URL ||
      `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT||5432}/${process.env.DB_NAME||'postgres'}`;
    const pool = new Pool({ connectionString: connStr });
    await insertUsers(pool, 'postgres');
    await pool.end();
  } else {
    // JSON file store
    const path = require('path');
    const fs   = require('fs').promises;
    const file = path.join(__dirname, '../database/store.json');
    let store  = {};
    try { store = JSON.parse(await fs.readFile(file, 'utf8')); } catch { store = { users: [] }; }
    store.users = store.users || [];
    let lastNum = store.users.reduce((m, u) => { const n = parseInt((u.id||'').replace('U','')||0); return n>m?n:m; }, 0);
    for (const row of USERS) {
      if (store.users.find(u => u.email === row.email)) { console.log(`SKIP  ${row.email} (already exists)`); continue; }
      lastNum++;
      const id    = 'U' + String(lastNum).padStart(3, '0');
      const roles = parseRoles(row.role, row.user_role);
      store.users.push({ id, name: row.name, email: row.email.toLowerCase(), phone: row.phone||'', department: row.department||'', roles, active: true, createdAt: new Date().toISOString() });
      console.log(`ADD   ${id} ${row.name} <${row.email}> [${roles.join(',')}]`);
    }
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(store, null, 2));
    console.log('\nDone (JSON store). Restart the server.');
    return;
  }
}

async function insertUsers(pool, dialect) {
  const q = (sql, params) => {
    if (dialect === 'mysql') {
      const mysqlSql = sql.replace(/\$(\d+)/g, '?');
      return pool.execute(mysqlSql, params);
    }
    return pool.query(sql, params);
  };

  for (const row of USERS) {
    const email = row.email.toLowerCase();
    const [existing] = await q('SELECT id FROM users WHERE email = $1', [email]);
    const rows = dialect === 'mysql' ? existing : existing.rows;
    if (rows.length) { console.log(`SKIP  ${email} (already exists)`); continue; }

    const [[last]] = dialect === 'mysql'
      ? await pool.execute('SELECT id FROM users ORDER BY id DESC LIMIT 1')
      : [await pool.query('SELECT id FROM users ORDER BY id DESC LIMIT 1').then(r=>r.rows)];

    const lastNum = last ? parseInt((last.id||'U000').replace(/[^0-9]/g,''))||0 : 0;
    const id      = 'U' + String(lastNum + 1).padStart(3, '0');
    const roles   = parseRoles(row.role, row.user_role).join(',');
    const hash    = await bcrypt.hash(row.password, 10);

    await q(
      'INSERT INTO users (id,name,email,phone,department,roles,active,password_hash,created_at) VALUES ($1,$2,$3,$4,$5,$6,1,$7,NOW())',
      [id, row.name, email, row.phone||'', row.department||'', roles, hash]
    );
    console.log(`ADD   ${id} ${row.name} <${email}> [${roles}]`);
  }
  console.log('\nDone.');
}

run().catch(e => { console.error('Error:', e.message); process.exit(1); });
