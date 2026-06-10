'use strict';

/**
 * scripts/migratePhotos.js
 *
 * Jalankan dengan: npm run db:migrate:photos
 * Menambahkan kolom photo_url di tabel users & menus,
 * serta membuat tabel uploads jika belum ada.
 */

const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const SQL_FILE = path.join(__dirname, '../database/migrate_add_photos.sql');

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'smart_canteen',
    multipleStatements: true,
  });

  try {
    const sql = fs.readFileSync(SQL_FILE, 'utf8');
    console.log('▶ Running migration: migrate_add_photos.sql …');
    await conn.query(sql);
    console.log('✅ Migration selesai. Kolom photo_url & tabel uploads sudah siap.');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('❌ Migration gagal:', err.message);
  process.exit(1);
});
