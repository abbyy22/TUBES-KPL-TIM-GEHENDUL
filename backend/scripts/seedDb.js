'use strict';

/**
 * Seed DB: jalankan seed.sql.
 *
 * Usage:
 *   npm run db:seed
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

async function main() {
  const seedPath = path.join(__dirname, '..', 'database', 'seed.sql');
  const sql = fs.readFileSync(seedPath, 'utf8');

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  console.log('[seedDb] Menjalankan seed.sql...');
  await conn.query(sql);
  await conn.end();
  console.log('[seedDb] Selesai.');
}

main().catch((err) => {
  console.error('[seedDb] Gagal:', err.message);
  process.exit(1);
});
