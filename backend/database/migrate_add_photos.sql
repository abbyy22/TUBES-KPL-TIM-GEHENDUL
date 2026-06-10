-- =======================================================
-- MIGRATION: Tambah dukungan foto profil & foto menu
-- Jalankan sekali jika database sudah ada sebelumnya.
-- Aman dijalankan berulang kali (IF NOT EXISTS / IF EXISTS guard).
-- =======================================================

USE smart_canteen;

-- 1. Tambah kolom photo_url di tabel users (foto profil pelanggan / admin)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL
    COMMENT 'URL foto profil user (pelanggan/admin)'
    AFTER role;

-- 2. Tambah kolom photo_url di tabel menus (foto menu dari sisi kantin → tampil ke pelanggan)
ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500) NULL
    COMMENT 'URL foto menu yang ditampilkan ke pelanggan'
    AFTER available;

-- 3. Buat tabel uploads untuk mencatat metadata semua file yang pernah diupload
CREATE TABLE IF NOT EXISTS uploads (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type    ENUM('user', 'menu') NOT NULL COMMENT 'Jenis entitas pemilik foto',
  owner_id      INT UNSIGNED NOT NULL COMMENT 'id dari tabel users atau menus',
  filename      VARCHAR(255) NOT NULL COMMENT 'Nama file yang disimpan di disk',
  original_name VARCHAR(255) NOT NULL COMMENT 'Nama file asli dari client',
  mimetype      VARCHAR(100) NOT NULL,
  size_bytes    INT UNSIGNED NOT NULL,
  url           VARCHAR(500) NOT NULL COMMENT 'URL publik yang bisa diakses frontend',
  uploaded_by   INT UNSIGNED NOT NULL COMMENT 'id user yang melakukan upload',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_uploads_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uploads_owner (owner_type, owner_id),
  INDEX idx_uploads_uploader (uploaded_by)
) ENGINE=InnoDB;
