'use strict';

const { pool } = require('../config/db');
const ApiError = require('../utils/ApiError');
const { isPositiveInt, validateOrderInput, assert } = require('../validators');
const { STATES, canTransition, isValidState, nextStates } = require('../utils/orderStateMachine');

function mapOrderRow(r) {
  return {
    id: r.id,
    user_id: r.user_id,
    kantin_id: r.kantin_id,
    customer_name: r.customer_name,
    total_price: r.total_price,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
  };
}

const SELECT_ORDER = `
  SELECT o.id, o.user_id, o.kantin_id, o.customer_name,
         o.total_price, o.status, o.created_at, o.updated_at
  FROM orders o
`;

async function fetchOrderItems(orderId) {
  const [rows] = await pool.query(
    `SELECT id, order_id, menu_id, menu_name, quantity, price_at_order
     FROM order_items WHERE order_id = ? ORDER BY id ASC`,
    [orderId],
  );
  return rows;
}

/**
 * POST /api/orders - pelanggan membuat pesanan baru.
 * Body: { kantin_id, customer_name, items: [{ menu_id, quantity }] }
 */
async function createOrder(req, res) {
  const input = validateOrderInput(req.body);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil semua menu yang dipesan, validasi kantin & ketersediaan
    const menuIds = input.items.map((i) => i.menu_id);
    const [menus] = await conn.query(
      `SELECT id, kantin_id, name, price, available
       FROM menus WHERE id IN (?)`,
      [menuIds],
    );
    if (menus.length !== new Set(menuIds).size) {
      throw ApiError.badRequest('Sebagian menu tidak ditemukan');
    }
    const menuById = new Map(menus.map((m) => [m.id, m]));

    let total = 0;
    const orderItems = [];
    for (const it of input.items) {
      const m = menuById.get(it.menu_id);
      assert(m, `menu_id ${it.menu_id} tidak ditemukan`);
      assert(m.kantin_id === input.kantin_id,
        `menu_id ${it.menu_id} bukan milik kantin yang dipilih`);
      assert(m.available === 1, `Menu '${m.name}' sedang tidak tersedia`);

      total += m.price * it.quantity;
      orderItems.push({
        menu_id: m.id,
        menu_name: m.name,
        quantity: it.quantity,
        price_at_order: m.price,
      });
    }

    const [orderRes] = await conn.query(
      `INSERT INTO orders (user_id, kantin_id, customer_name, total_price, status)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, input.kantin_id, input.customer_name, total, STATES.ORDERED],
    );
    const orderId = orderRes.insertId;

    const itemValues = orderItems.map((oi) => [
      orderId, oi.menu_id, oi.menu_name, oi.quantity, oi.price_at_order,
    ]);
    await conn.query(
      'INSERT INTO order_items (order_id, menu_id, menu_name, quantity, price_at_order) VALUES ?',
      [itemValues],
    );

    await conn.commit();

    const [orderRows] = await pool.query(SELECT_ORDER + ' WHERE o.id = ?', [orderId]);
    const items = await fetchOrderItems(orderId);
    res.status(201).json({
      success: true,
      data: { ...mapOrderRow(orderRows[0]), items },
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * GET /api/orders/me - riwayat pesanan user saat ini.
 */
async function listMyOrders(req, res) {
  const [rows] = await pool.query(
    SELECT_ORDER + ' WHERE o.user_id = ? ORDER BY o.created_at DESC',
    [req.user.id],
  );
  res.json({ success: true, data: rows.map(mapOrderRow) });
}

/**
 * GET /api/orders - admin melihat seluruh pesanan (opsional ?status=, ?kantin_id=).
 */
async function listAllOrders(req, res) {
  const where = [];
  const params = [];
  if (req.query.status !== undefined) {
    assert(isValidState(req.query.status), 'status tidak valid');
    where.push('o.status = ?'); params.push(req.query.status);
  }
  if (req.query.kantin_id !== undefined) {
    const k = parseInt(req.query.kantin_id, 10);
    assert(isPositiveInt(k), 'kantin_id tidak valid');
    where.push('o.kantin_id = ?'); params.push(k);
  }
  const sql = SELECT_ORDER + (where.length ? ' WHERE ' + where.join(' AND ') : '') +
    ' ORDER BY o.created_at DESC';
  const [rows] = await pool.query(sql, params);
  res.json({ success: true, data: rows.map(mapOrderRow) });
}

/**
 * GET /api/orders/:id - detail pesanan. Pelanggan hanya boleh akses miliknya.
 */
async function getOrder(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id order tidak valid');

  const [rows] = await pool.query(SELECT_ORDER + ' WHERE o.id = ?', [id]);
  if (rows.length === 0) throw ApiError.notFound('Order tidak ditemukan');
  const order = rows[0];

  if (req.user.role !== 'admin' && order.user_id !== req.user.id) {
    throw ApiError.forbidden('Tidak boleh mengakses pesanan user lain');
  }

  const items = await fetchOrderItems(order.id);
  res.json({ success: true, data: { ...mapOrderRow(order), items } });
}

/**
 * PATCH /api/orders/:id/status - admin update status sesuai state machine.
 * Body: { status: 'COOKING' | 'READY' | 'DONE' }
 */
async function updateOrderStatus(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!isPositiveInt(id)) throw ApiError.badRequest('id order tidak valid');

  const { status } = req.body || {};
  if (!isValidState(status)) {
    throw ApiError.badRequest("status harus salah satu dari ORDERED/COOKING/READY/DONE");
  }

  const [rows] = await pool.query('SELECT id, status FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) throw ApiError.notFound('Order tidak ditemukan');
  const current = rows[0].status;

  if (!canTransition(current, status)) {
    throw ApiError.badRequest(
      `Transisi tidak valid: ${current} -> ${status}. Allowed: ${nextStates(current).join(', ') || '(none)'}`,
    );
  }

  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

  const [updated] = await pool.query(SELECT_ORDER + ' WHERE o.id = ?', [id]);
  const items = await fetchOrderItems(id);
  const orderData = { ...mapOrderRow(updated[0]), items };

  // Emit real-time notification via Socket.io to all connected clients
  const io = req.app.locals.io;
  if (io) {
    io.emit('order:status', {
      orderId: id,
      status,
      order: orderData,
    });
    console.log(`[socket.io] emitted order:status for order #${id} → ${status}`);
  }

  res.json({ success: true, data: orderData });
}

async function listOrdersByKantin(req, res) {
  const kantinId = parseInt(req.params.kantin_id, 10);
  if (!isPositiveInt(kantinId)) throw ApiError.badRequest('kantin_id tidak valid');
  const [rows] = await pool.query(
    SELECT_ORDER + ' WHERE o.kantin_id = ? ORDER BY o.created_at DESC',
    [kantinId],
  );
  res.json({ success: true, data: rows.map(mapOrderRow) });
}

module.exports = {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrder,
  updateOrderStatus,
  listOrdersByKantin
};
