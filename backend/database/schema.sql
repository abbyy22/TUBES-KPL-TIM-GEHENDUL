-- =======================================================
-- Smart Canteen Ordering System - Database Schema (MySQL)
-- =======================================================

CREATE DATABASE IF NOT EXISTS smart_canteen
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_canteen;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('pelanggan', 'admin') NOT NULL DEFAULT 'pelanggan',
  photo_url     VARCHAR(500) NULL COMMENT 'URL foto profil user (pelanggan/admin)',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ---------- KANTINS ----------
CREATE TABLE IF NOT EXISTS kantins (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code       VARCHAR(20)  NOT NULL UNIQUE,
  name       VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- ---------- MENUS ----------
CREATE TABLE IF NOT EXISTS menus (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  kantin_id   INT UNSIGNED NOT NULL,
  name        VARCHAR(150) NOT NULL,
  price       INT UNSIGNED NOT NULL,
  emoji       VARCHAR(10)  NULL,
  description VARCHAR(255) NULL,
  available   TINYINT(1)   NOT NULL DEFAULT 1,
  photo_url   VARCHAR(500) NULL COMMENT 'URL foto menu yang ditampilkan ke pelanggan',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_menus_kantin FOREIGN KEY (kantin_id) REFERENCES kantins(id) ON DELETE CASCADE,
  INDEX idx_menus_kantin (kantin_id)
) ENGINE=InnoDB;

-- ---------- UPLOADS ----------
-- Mencatat metadata setiap file foto yang diupload ke server
CREATE TABLE IF NOT EXISTS uploads (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_type   ENUM('user', 'menu') NOT NULL COMMENT 'Jenis entitas pemilik foto',
  owner_id     INT UNSIGNED NOT NULL COMMENT 'id dari tabel users atau menus',
  filename     VARCHAR(255) NOT NULL COMMENT 'Nama file yang disimpan di disk',
  original_name VARCHAR(255) NOT NULL COMMENT 'Nama file asli dari client',
  mimetype     VARCHAR(100) NOT NULL,
  size_bytes   INT UNSIGNED NOT NULL,
  url          VARCHAR(500) NOT NULL COMMENT 'URL publik yang bisa diakses frontend',
  uploaded_by  INT UNSIGNED NOT NULL COMMENT 'id user yang melakukan upload',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_uploads_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_uploads_owner (owner_type, owner_id),
  INDEX idx_uploads_uploader (uploaded_by)
) ENGINE=InnoDB;

-- ---------- ORDERS ----------
CREATE TABLE IF NOT EXISTS orders (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NOT NULL,
  kantin_id     INT UNSIGNED NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  total_price   INT UNSIGNED NOT NULL DEFAULT 0,
  status        ENUM('ORDERED','COOKING','READY','DONE') NOT NULL DEFAULT 'ORDERED',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_orders_kantin FOREIGN KEY (kantin_id) REFERENCES kantins(id) ON DELETE RESTRICT,
  INDEX idx_orders_user   (user_id),
  INDEX idx_orders_kantin (kantin_id),
  INDEX idx_orders_status (status)
) ENGINE=InnoDB;

-- ---------- ORDER ITEMS ----------
CREATE TABLE IF NOT EXISTS order_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id        INT UNSIGNED NOT NULL,
  menu_id         INT UNSIGNED NOT NULL,
  menu_name       VARCHAR(150) NOT NULL,
  quantity        INT UNSIGNED NOT NULL,
  price_at_order  INT UNSIGNED NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_oi_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_menu  FOREIGN KEY (menu_id)  REFERENCES menus(id)  ON DELETE RESTRICT,
  INDEX idx_oi_order (order_id)
) ENGINE=InnoDB;
