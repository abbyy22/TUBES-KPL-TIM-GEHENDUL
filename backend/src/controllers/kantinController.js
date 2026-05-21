'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { isPositiveInt, isNonEmptyString, assert } = require('../validators');

async function listKantins(req, res) {
  const [rows] = await pool.query(
    'SELECT id, code, name, created_at FROM kantins ORDER BY id ASC',
  );
  res.json({ success: true, data: rows });
}

async function getKantin(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id kantin tidak valid');

  const [rows] = await pool.query(
    'SELECT id, code, name, created_at FROM kantins WHERE id = ?',
    [id],
  );
  if (rows.length === 0) throw ApiError.notFound('Kantin tidak ditemukan');
  res.json({ success: true, data: rows[0] });
}

async function createKantin(req, res) {
  const { code, name } = req.body || {};
  assert(isNonEmptyString(code), 'code wajib diisi');
  assert(isNonEmptyString(name), 'name wajib diisi');

  const [result] = await pool.query(
    'INSERT INTO kantins (code, name) VALUES (?, ?)',
    [code.trim(), name.trim()],
  );
  res.status(201).json({
    success: true,
    data: { id: result.insertId, code: code.trim(), name: name.trim() },
  });
}

async function updateKantin(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id kantin tidak valid');

  const { code, name } = req.body || {};
  const fields = [];
  const params = [];
  if (code !== undefined) {
    assert(isNonEmptyString(code), 'code tidak valid');
    fields.push('code = ?'); params.push(code.trim());
  }
  if (name !== undefined) {
    assert(isNonEmptyString(name), 'name tidak valid');
    fields.push('name = ?'); params.push(name.trim());
  }
  if (fields.length === 0) throw ApiError.badRequest('Tidak ada field yang diupdate');

  params.push(id);
  const [result] = await pool.query(`UPDATE kantins SET ${fields.join(', ')} WHERE id = ?`, params);
  if (result.affectedRows === 0) throw ApiError.notFound('Kantin tidak ditemukan');

  const [rows] = await pool.query(
    'SELECT id, code, name, created_at FROM kantins WHERE id = ?',
    [id],
  );
  res.json({ success: true, data: rows[0] });
}

async function deleteKantin(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id kantin tidak valid');

  const [result] = await pool.query('DELETE FROM kantins WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw ApiError.notFound('Kantin tidak ditemukan');
  res.json({ success: true, data: { id, deleted: true } });
}

module.exports = { listKantins, getKantin, createKantin, updateKantin, deleteKantin };
