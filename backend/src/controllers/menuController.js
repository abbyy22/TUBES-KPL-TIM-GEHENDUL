'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { isPositiveInt, validateMenuInput } = require('../validators');

function mapMenuRow(r) {
  return {
    id: r.id,
    kantin_id: r.kantin_id,
    kantin_name: r.kantin_name,
    name: r.name,
    price: r.price,
    emoji: r.emoji,
    description: r.description,
    available: r.available === 1,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const SELECT_MENU = `
  SELECT m.id, m.kantin_id, k.name AS kantin_name, m.name, m.price, m.emoji,
         m.description, m.available, m.created_at, m.updated_at
  FROM menus m
  JOIN kantins k ON k.id = m.kantin_id
`;

async function listMenus(req, res) {
  const params = [];
  const where = [];

  if (req.query.kantin_id !== undefined) {
    const k = parseInt(req.query.kantin_id, 10);
    if (!isPositiveInt(k)) throw ApiError.badRequest('kantin_id tidak valid');
    where.push('m.kantin_id = ?');
    params.push(k);
  }
  if (req.query.available !== undefined) {
    const v = req.query.available === 'true' ? 1 : req.query.available === 'false' ? 0 : null;
    if (v === null) throw ApiError.badRequest("query 'available' harus true/false");
    where.push('m.available = ?');
    params.push(v);
  }

  const sql = SELECT_MENU + (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY m.kantin_id ASC, m.id ASC';

  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows.map(mapMenuRow) });
}

async function getMenu(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id menu tidak valid');

  const [rows] = await pool.query(SELECT_MENU + ' WHERE m.id = ?', [id]);
  if (rows.length === 0) throw ApiError.notFound('Menu tidak ditemukan');
  res.json({ success: true, data: mapMenuRow(rows[0]) });
}

async function createMenu(req, res) {
  const input = validateMenuInput(req.body, { partial: false });

  const [kantin] = await pool.query('SELECT id FROM kantins WHERE id = ?', [input.kantin_id]);
  if (kantin.length === 0) throw ApiError.badRequest('Kantin tidak ditemukan');

  const [result] = await pool.query(
    'INSERT INTO menus (kantin_id, name, price, emoji, description, available) VALUES (?, ?, ?, ?, ?, ?)',
    [
      input.kantin_id,
      input.name,
      input.price,
      input.emoji ?? null,
      input.description ?? null,
      input.available ?? 1,
    ],
  );

  const [rows] = await pool.query(SELECT_MENU + ' WHERE m.id = ?', [result.insertId]);
  const menuData = mapMenuRow(rows[0]);

  // Emit real-time menu update so pelanggan's menu grid refreshes
  const io = req.app.locals.io;
  if (io) {
    io.emit('menu:updated', { action: 'create', menu: menuData });
    console.log(`[socket.io] emitted menu:updated (create) for menu #${menuData.id}`);
  }

  res.status(201).json({ success: true, data: menuData });
}

async function updateMenu(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id menu tidak valid');

  const input = validateMenuInput(req.body, { partial: true });
  const keys = Object.keys(input);
  if (keys.length === 0) throw ApiError.badRequest('Tidak ada field yang diupdate');

  if (input.kantin_id !== undefined) {
    const [k] = await pool.query('SELECT id FROM kantins WHERE id = ?', [input.kantin_id]);
    if (k.length === 0) throw ApiError.badRequest('Kantin tidak ditemukan');
  }

  const setClause = keys.map((k) => `${k} = ?`).join(', ');
  const params = keys.map((k) => input[k]);
  params.push(id);

  const [result] = await pool.query(`UPDATE menus SET ${setClause} WHERE id = ?`, params);
  if (result.affectedRows === 0) throw ApiError.notFound('Menu tidak ditemukan');

  const [rows] = await pool.query(SELECT_MENU + ' WHERE m.id = ?', [id]);
  const menuData = mapMenuRow(rows[0]);

  // Emit real-time menu update so pelanggan's menu grid refreshes
  const io = req.app.locals.io;
  if (io) {
    io.emit('menu:updated', { action: 'update', menu: menuData });
    console.log(`[socket.io] emitted menu:updated (update) for menu #${menuData.id}`);
  }

  res.json({ success: true, data: menuData });
}

async function deleteMenu(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id menu tidak valid');

  // Fetch before delete to get kantin_id for socket emit
  const [rows] = await pool.query(SELECT_MENU + ' WHERE m.id = ?', [id]);
  if (rows.length === 0) throw ApiError.notFound('Menu tidak ditemukan');
  const menuData = mapMenuRow(rows[0]);

  const [result] = await pool.query('DELETE FROM menus WHERE id = ?', [id]);
  if (result.affectedRows === 0) throw ApiError.notFound('Menu tidak ditemukan');

  // Emit real-time menu update so pelanggan's menu grid refreshes
  const io = req.app.locals.io;
  if (io) {
    io.emit('menu:updated', { action: 'delete', menu: { id, kantin_id: menuData.kantin_id } });
    console.log(`[socket.io] emitted menu:updated (delete) for menu #${id}`);
  }

  res.json({ success: true, data: { id, deleted: true } });
}

module.exports = { listMenus, getMenu, createMenu, updateMenu, deleteMenu };
