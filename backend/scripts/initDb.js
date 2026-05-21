'use strict';

/**
 * Init DB: jalankan schema.sql.
 *
 * Pakai mysql2 untuk konek tanpa memilih database (karena schema membuat DB),
 * lalu jalankan setiap statement.
 *
 * Usage:
 *   npm run db:init
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const config = require('../src/config/env');

function splitStatements(sql) {
  // Hilangkan komentar baris dan pecah by semicolon di akhir baris.
  const cleaned = sql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n');
  return cleaned
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

async function main() {
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitStatements(sql);

  const conn = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true,
  });

  console.log(`[initDb] Menjalankan ${statements.length} statement dari schema.sql...`);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  await conn.end();
  console.log('[initDb] Selesai.');
}

main().catch((err) => {
  console.error('[initDb] Gagal:', err.message);
  process.exit(1);
});
