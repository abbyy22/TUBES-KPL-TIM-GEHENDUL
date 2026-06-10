-- =======================================================
-- Smart Canteen - Seed Data
-- Default password untuk semua user demo: "password123"
-- Hash di bawah ini di-generate dengan bcryptjs (cost 10)
-- =======================================================

USE smart_canteen;

-- ---------- Users ----------
-- password: password123 untuk semua
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin Kantin NEO 1', 'neo1@telfood.test',      '$2a$10$ZGuzx7bnwVc4RifsW7zDY.mWfW3HP81G7diBT8msE8wi6wG6/HZkO', 'admin'),
  ('Admin Kantin NEO 2', 'neo2@telfood.test',      '$2a$10$ZGuzx7bnwVc4RifsW7zDY.mWfW3HP81G7diBT8msE8wi6wG6/HZkO', 'admin'),
  ('Admin Kantin TPB',   'tpb@telfood.test',       '$2a$10$ZGuzx7bnwVc4RifsW7zDY.mWfW3HP81G7diBT8msE8wi6wG6/HZkO', 'admin'),
  ('Admin Kantin GKM',   'gkm@telfood.test',       '$2a$10$ZGuzx7bnwVc4RifsW7zDY.mWfW3HP81G7diBT8msE8wi6wG6/HZkO', 'admin'),
  ('Mimae',              'pelanggan@telfood.test', '$2a$10$ZGuzx7bnwVc4RifsW7zDY.mWfW3HP81G7diBT8msE8wi6wG6/HZkO', 'pelanggan');

-- ---------- Kantins ----------
INSERT INTO kantins (code, name) VALUES
  ('neo1', 'Kantin NEO 1'),
  ('neo2', 'Kantin NEO 2'),
  ('tpb',  'Kantin TPB'),
  ('gkm',  'Kantin GKM');

-- ---------- Menus ----------
-- NEO 1
INSERT INTO menus (kantin_id, name, price, emoji) VALUES
  ((SELECT id FROM kantins WHERE code='neo1'), 'Nasi goreng maza',     15000, '🍳'),
  ((SELECT id FROM kantins WHERE code='neo1'), 'Es teh manis',          2000, '🍵'),
  ((SELECT id FROM kantins WHERE code='neo1'), 'Mie goreng spesial',   13000, '🍜'),
  ((SELECT id FROM kantins WHERE code='neo1'), 'Ayam bakar',           18000, '🍗'),
  ((SELECT id FROM kantins WHERE code='neo1'), 'Nasi putih',            5000, '🍚'),
  ((SELECT id FROM kantins WHERE code='neo1'), 'Soto ayam',            12000, '🥣');

-- NEO 2
INSERT INTO menus (kantin_id, name, price, emoji) VALUES
  ((SELECT id FROM kantins WHERE code='neo2'), 'Bakso kuah',           14000, '🍲'),
  ((SELECT id FROM kantins WHERE code='neo2'), 'Nasi uduk',            12000, '🍙'),
  ((SELECT id FROM kantins WHERE code='neo2'), 'Tahu goreng',           3000, '🟨'),
  ((SELECT id FROM kantins WHERE code='neo2'), 'Es jeruk',              3000, '🍊'),
  ((SELECT id FROM kantins WHERE code='neo2'), 'Gado-gado',            13000, '🥗'),
  ((SELECT id FROM kantins WHERE code='neo2'), 'Tempe mendoan',         4000, '🟫');

-- TPB
INSERT INTO menus (kantin_id, name, price, emoji) VALUES
  ((SELECT id FROM kantins WHERE code='tpb'),  'Nasi rames',           11000, '🍱'),
  ((SELECT id FROM kantins WHERE code='tpb'),  'Jus alpukat',           8000, '🥑'),
  ((SELECT id FROM kantins WHERE code='tpb'),  'Pecel lele',           16000, '🐟'),
  ((SELECT id FROM kantins WHERE code='tpb'),  'Es campur',             6000, '🧊'),
  ((SELECT id FROM kantins WHERE code='tpb'),  'Nasi goreng telur',    13000, '🍳'),
  ((SELECT id FROM kantins WHERE code='tpb'),  'Sate ayam',            15000, '🍢');

-- GKM
INSERT INTO menus (kantin_id, name, price, emoji) VALUES
  ((SELECT id FROM kantins WHERE code='gkm'),  'Mie ayam',             12000, '🍜'),
  ((SELECT id FROM kantins WHERE code='gkm'),  'Siomay',               10000, '🥟'),
  ((SELECT id FROM kantins WHERE code='gkm'),  'Ketoprak',             11000, '🥣'),
  ((SELECT id FROM kantins WHERE code='gkm'),  'Es teh tawar',          2000, '🍵'),
  ((SELECT id FROM kantins WHERE code='gkm'),  'Batagor',               9000, '🐟'),
  ((SELECT id FROM kantins WHERE code='gkm'),  'Nasi kuning',          14000, '🍚');

-- ---------- Orders ----------
INSERT INTO orders (id, user_id, kantin_id, customer_name, total_price, status) VALUES
  (1, (SELECT id FROM users WHERE email='pelanggan@telfood.test'), (SELECT id FROM kantins WHERE code='neo1'), 'Mimae', 17000, 'DONE'),
  (2, (SELECT id FROM users WHERE email='pelanggan@telfood.test'), (SELECT id FROM kantins WHERE code='neo2'), 'Mimae', 14000, 'READY');

-- ---------- Order Items ----------
INSERT INTO order_items (order_id, menu_id, menu_name, quantity, price_at_order) VALUES
  (1, (SELECT id FROM menus WHERE name='Nasi goreng maza' LIMIT 1), 'Nasi goreng maza', 1, 15000),
  (1, (SELECT id FROM menus WHERE name='Es teh manis' LIMIT 1), 'Es teh manis', 1, 2000),
  (2, (SELECT id FROM menus WHERE name='Bakso kuah' LIMIT 1), 'Bakso kuah', 1, 14000);

