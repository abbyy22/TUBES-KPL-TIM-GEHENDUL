'use strict';

/**
 * middleware/upload.js
 *
 * Konfigurasi Multer untuk upload foto:
 *  - avatar  : foto profil user  (POST /api/auth/avatar)
 *  - menuPhoto : foto menu       (POST /api/menus/:id/photo)
 *
 * File disimpan di  uploads/<type>/<filename>
 * URL publik diakses via  /uploads/<type>/<filename>
 */

const path = require('path');
const fs   = require('fs');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

// ─── Konstanta ────────────────────────────────────────────────────────────────
const UPLOAD_ROOT = path.join(__dirname, '../../uploads');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Pastikan folder upload ada ───────────────────────────────────────────────
['avatars', 'menus'].forEach((sub) => {
  const dir = path.join(UPLOAD_ROOT, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ─── Table-driven: mapping type → subfolder ───────────────────────────────────
const SUBFOLDER = Object.freeze({
  avatar:    'avatars',
  menuPhoto: 'menus',
});

// ─── Storage engine ───────────────────────────────────────────────────────────
function buildStorage(type) {
  return multer.diskStorage({
    destination(_req, _file, cb) {
      cb(null, path.join(UPLOAD_ROOT, SUBFOLDER[type]));
    },
    filename(_req, file, cb) {
      const ext  = path.extname(file.originalname).toLowerCase() || '.jpg';
      const name = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
      cb(null, name);
    },
  });
}

// ─── File filter (validasi MIME) ──────────────────────────────────────────────
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest('Format foto tidak didukung. Gunakan JPEG, PNG, WebP, atau GIF.'));
  }
}

// ─── Multer instances (parameterized by type) ─────────────────────────────────
const uploaders = Object.fromEntries(
  Object.keys(SUBFOLDER).map((type) => [
    type,
    multer({
      storage:  buildStorage(type),
      fileFilter,
      limits: { fileSize: MAX_SIZE_BYTES },
    }),
  ]),
);

/**
 * Middleware upload foto profil (field: "photo")
 */
const uploadAvatar = uploaders.avatar.single('photo');

/**
 * Middleware upload foto menu (field: "photo")
 */
const uploadMenuPhoto = uploaders.menuPhoto.single('photo');

/**
 * Membangun URL publik dari filename dan type.
 * @param {string} type  - 'avatars' | 'menus'
 * @param {string} filename
 * @param {import('express').Request} req
 * @returns {string}
 */
function buildPublicUrl(type, filename, req) {
  const base = process.env.APP_URL
    || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${type}/${filename}`;
}

module.exports = {
  uploadAvatar,
  uploadMenuPhoto,
  buildPublicUrl,
  UPLOAD_ROOT,
  SUBFOLDER,
};
