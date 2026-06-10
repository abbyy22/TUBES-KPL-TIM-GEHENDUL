'use strict';

/**
 * scripts/seedTodayOrders.js
 *
 * Mengisi database dengan contoh order transaksi hari ini
 * untuk kantin NEO 1 agar tampilan Riwayat Transaksi Harian terisi data.
 *
 * Jalankan: node scripts/seedTodayOrders.js
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
    console.log('▶ Menambahkan dummy orders hari ini ke database...\n');

    // Ambil ID user pelanggan dan semua kantin
    const [[pelanggan]] = await conn.query(`SELECT id FROM users WHERE email = 'pelanggan@telfood.test'`);
    if (!pelanggan) throw new Error('User pelanggan tidak ditemukan. Jalankan db:seed terlebih dahulu.');

    const [kantins] = await conn.query(`SELECT id, code, name FROM kantins`);
    const kantinMap = Object.fromEntries(kantins.map(k => [k.code, k]));

    const [allMenus] = await conn.query(`SELECT id, kantin_id, name, price FROM menus`);
    const menusByKantin = {};
    allMenus.forEach(m => {
      if (!menusByKantin[m.kantin_id]) menusByKantin[m.kantin_id] = [];
      menusByKantin[m.kantin_id].push(m);
    });

    const userId = pelanggan.id;

    // Data dummy per kantin
    const dummyOrders = [
      // --- NEO 1 ---
      { kantin: 'neo1', customer: 'Budi Santoso',   status: 'DONE',    items: [[0, 1], [1, 2]] },
      { kantin: 'neo1', customer: 'Anisa Rahayu',   status: 'DONE',    items: [[2, 1], [0, 1]] },
      { kantin: 'neo1', customer: 'Rizky Firmansyah', status: 'READY', items: [[3, 2]] },
      { kantin: 'neo1', customer: 'Dewi Kurniawati', status: 'COOKING',items: [[0, 1], [4, 1]] },
      { kantin: 'neo1', customer: 'Ahmad Fauzi',    status: 'ORDERED', items: [[5, 1]] },
      // --- NEO 2 ---
      { kantin: 'neo2', customer: 'Lina Setiawan',  status: 'DONE',    items: [[0, 2], [3, 1]] },
      { kantin: 'neo2', customer: 'Hendra Wijaya',  status: 'DONE',    items: [[1, 1], [2, 1]] },
      { kantin: 'neo2', customer: 'Sari Indah',     status: 'COOKING', items: [[0, 1]] },
      // --- TPB ---
      { kantin: 'tpb',  customer: 'Fajar Nugroho',  status: 'DONE',    items: [[0, 1], [1, 1]] },
      { kantin: 'tpb',  customer: 'Mega Pertiwi',   status: 'READY',   items: [[2, 2]] },
      // --- GKM ---
      { kantin: 'gkm',  customer: 'Dimas Pratama',  status: 'DONE',    items: [[0, 1], [4, 1]] },
      { kantin: 'gkm',  customer: 'Nadia Putri',    status: 'ORDERED', items: [[1, 1], [2, 1]] },
    ];

    // Waktu acak dalam rentang hari ini (07:00 - sekarang)
    const todayStart = new Date();
    todayStart.setHours(7, 0, 0, 0);
    const now = Date.now();

    function randomTimeToday() {
      const ms = todayStart.getTime() + Math.random() * (now - todayStart.getTime());
      return new Date(ms).toISOString().slice(0, 19).replace('T', ' ');
    }

    let createdCount = 0;

    for (const data of dummyOrders) {
      const kantin = kantinMap[data.kantin];
      if (!kantin) { console.warn(`  ⚠ Kantin ${data.kantin} tidak ditemukan, skip.`); continue; }

      const menus = menusByKantin[kantin.id] || [];
      if (menus.length === 0) { console.warn(`  ⚠ Menu untuk ${data.kantin} kosong, skip.`); continue; }

      // Kalkulasi total harga
      let totalPrice = 0;
      const resolvedItems = data.items.map(([menuIdx, qty]) => {
        const menu = menus[menuIdx % menus.length];
        totalPrice += menu.price * qty;
        return { menu, qty };
      });

      const createdAt = randomTimeToday();

      // Insert order
      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, kantin_id, customer_name, total_price, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, kantin.id, data.customer, totalPrice, data.status, createdAt],
      );
      const orderId = orderResult.insertId;

      // Insert order items
      for (const { menu, qty } of resolvedItems) {
        await conn.query(
          `INSERT INTO order_items (order_id, menu_id, menu_name, quantity, price_at_order)
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, menu.id, menu.name, qty, menu.price],
        );
      }

      console.log(`  ✅ [${kantin.name}] Order #${orderId} — ${data.customer} — ${data.status} — Rp ${totalPrice.toLocaleString('id-ID')}`);
      createdCount++;
    }

    console.log(`\n✅ Selesai! ${createdCount} order dummy hari ini berhasil ditambahkan.`);
    console.log('   Refresh halaman Profil Owner untuk melihat hasilnya.\n');
  } finally {
    await conn.end();
  }
}

run().catch((err) => {
  console.error('❌ Gagal seed today orders:', err.message);
  process.exit(1);
});
