'use strict';

/**
 * scripts/seedPhotos.js
 *
 * Mengisi kolom photo_url untuk user dan menu di database
 * dengan menggunakan aset default yang ada di uploads/.
 */

const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'smart_canteen',
  });

  try {
    const port = process.env.PORT || 3000;
    const baseUrl = `http://localhost:${port}`;

    console.log('▶ Menghubungkan ke database untuk mengisi asset photo_url...');

    // 1. Update foto profil user default
    const avatarUrl = `${baseUrl}/uploads/avatars/profile.png`;
    await conn.query('UPDATE users SET photo_url = ? WHERE photo_url IS NULL', [avatarUrl]);
    console.log('✅ Foto profil user di-update ke:', avatarUrl);

    // 2. Update foto menu
    const [menus] = await conn.query('SELECT id, name FROM menus');
    let updatedCount = 0;

    for (const menu of menus) {
      const name = menu.name.toLowerCase();
      let photoName = null;

      if (name.includes('nasi goreng')) {
        photoName = 'nasi_goreng.png';
      } else if (name.includes('teh')) {
        photoName = 'es_teh_manis.png';
      } else if (name.includes('ayam')) {
        photoName = 'ayam_goreng.png';
      } else if (name.includes('jeruk') || name.includes('jus')) {
        photoName = 'jus_jeruk.png';
      }

      if (photoName) {
        const menuPhotoUrl = `${baseUrl}/uploads/menus/${photoName}`;
        await conn.query('UPDATE menus SET photo_url = ? WHERE id = ?', [menuPhotoUrl, menu.id]);
        updatedCount++;
      }
    }

    console.log(`✅ Berhasil meng-update ${updatedCount} foto menu.`);
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('❌ Gagal seed asset photo_url:', err.message);
  process.exit(1);
});
