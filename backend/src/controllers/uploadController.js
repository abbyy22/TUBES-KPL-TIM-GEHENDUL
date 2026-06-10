'use strict';

/**
 * controllers/uploadController.js
 *
 * Handler untuk endpoint upload foto:
 *  - uploadUserPhoto   : upload/ganti foto profil user yang sedang login
 *  - uploadMenuPhoto   : upload/ganti foto menu (admin only)
 *  - deleteUserPhoto   : hapus foto profil user
 *  - deleteMenuPhoto   : hapus foto menu (admin only)
 */

const fs   = require('fs');
const path = require('path');
const { pool }        = require('../config/db');
const ApiError        = require('../utils/ApiError');
const { buildPublicUrl, UPLOAD_ROOT, SUBFOLDER } = require('../middleware/upload');

// ─── Helper: hapus file lama dari disk (best-effort, jangan crash jika gagal) ─
function removeOldFile(oldUrl, subfolder) {
  if (!oldUrl) return;
  try {
    // Extract filename dari URL:  .../uploads/avatars/<filename>
    const filename = path.basename(oldUrl);
    const filePath = path.join(UPLOAD_ROOT, subfolder, filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_) {
    // Biarkan - file lama tidak ditemukan, tidak masalah
  }
}

// ─── Helper: catat metadata upload ke tabel uploads ───────────────────────────
async function recordUpload({ ownerType, ownerId, file, url, uploadedBy }) {
  await pool.query(
    `INSERT INTO uploads (owner_type, owner_id, filename, original_name, mimetype, size_bytes, url, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      ownerType,
      ownerId,
      file.filename,
      file.originalname,
      file.mimetype,
      file.size,
      url,
      uploadedBy,
    ],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOTO PROFIL USER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/auth/avatar
 * Upload/ganti foto profil user yang sedang login.
 * Body: multipart/form-data, field "photo"
 */
async function uploadUserPhoto(req, res) {
  if (!req.file) throw ApiError.badRequest('File foto wajib disertakan (field: photo)');

  const userId   = req.user.id;
  const url      = buildPublicUrl(SUBFOLDER.avatar, req.file.filename, req);

  // Ambil foto lama untuk dihapus dari disk
  const [rows] = await pool.query('SELECT photo_url FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw ApiError.notFound('User tidak ditemukan');
  const oldUrl = rows[0].photo_url;

  // Update DB
  await pool.query('UPDATE users SET photo_url = ? WHERE id = ?', [url, userId]);

  // Catat di tabel uploads
  await recordUpload({
    ownerType: 'user',
    ownerId:   userId,
    file:      req.file,
    url,
    uploadedBy: userId,
  });

  // Hapus file lama setelah DB berhasil diupdate
  removeOldFile(oldUrl, SUBFOLDER.avatar);

  res.json({
    success: true,
    data: { photo_url: url },
  });
}

/**
 * DELETE /api/auth/avatar
 * Hapus foto profil user yang sedang login (set null).
 */
async function deleteUserPhoto(req, res) {
  const userId = req.user.id;

  const [rows] = await pool.query('SELECT photo_url FROM users WHERE id = ?', [userId]);
  if (rows.length === 0) throw ApiError.notFound('User tidak ditemukan');

  const oldUrl = rows[0].photo_url;
  if (!oldUrl) throw ApiError.badRequest('User belum memiliki foto profil');

  await pool.query('UPDATE users SET photo_url = NULL WHERE id = ?', [userId]);
  removeOldFile(oldUrl, SUBFOLDER.avatar);

  res.json({ success: true, data: { photo_url: null } });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FOTO MENU
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/menus/:id/photo
 * Upload/ganti foto menu (admin only).
 * Body: multipart/form-data, field "photo"
 */
async function uploadMenuPhoto(req, res) {
  if (!req.file) throw ApiError.badRequest('File foto wajib disertakan (field: photo)');

  const menuId = parseInt(req.params.id, 10);
  if (!menuId || menuId <= 0) throw ApiError.badRequest('id menu tidak valid');

  const url = buildPublicUrl(SUBFOLDER.menuPhoto, req.file.filename, req);

  // Ambil foto lama
  const [rows] = await pool.query('SELECT photo_url FROM menus WHERE id = ?', [menuId]);
  if (rows.length === 0) throw ApiError.notFound('Menu tidak ditemukan');
  const oldUrl = rows[0].photo_url;

  // Update DB
  await pool.query('UPDATE menus SET photo_url = ? WHERE id = ?', [url, menuId]);

  // Catat di tabel uploads
  await recordUpload({
    ownerType: 'menu',
    ownerId:   menuId,
    file:      req.file,
    url,
    uploadedBy: req.user.id,
  });

  // Hapus file lama
  removeOldFile(oldUrl, SUBFOLDER.menuPhoto);

  // Emit real-time agar pelanggan langsung lihat foto baru
  const io = req.app.locals.io;
  if (io) {
    io.emit('menu:updated', { action: 'photo', menuId, photo_url: url });
  }

  res.json({
    success: true,
    data: { menu_id: menuId, photo_url: url },
  });
}

/**
 * DELETE /api/menus/:id/photo
 * Hapus foto menu (admin only, set null).
 */
async function deleteMenuPhoto(req, res) {
  const menuId = parseInt(req.params.id, 10);
  if (!menuId || menuId <= 0) throw ApiError.badRequest('id menu tidak valid');

  const [rows] = await pool.query('SELECT photo_url FROM menus WHERE id = ?', [menuId]);
  if (rows.length === 0) throw ApiError.notFound('Menu tidak ditemukan');

  const oldUrl = rows[0].photo_url;
  if (!oldUrl) throw ApiError.badRequest('Menu belum memiliki foto');

  await pool.query('UPDATE menus SET photo_url = NULL WHERE id = ?', [menuId]);
  removeOldFile(oldUrl, SUBFOLDER.menuPhoto);

  const io = req.app.locals.io;
  if (io) {
    io.emit('menu:updated', { action: 'photo', menuId, photo_url: null });
  }

  res.json({ success: true, data: { menu_id: menuId, photo_url: null } });
}

module.exports = {
  uploadUserPhoto,
  deleteUserPhoto,
  uploadMenuPhoto,
  deleteMenuPhoto,
};
