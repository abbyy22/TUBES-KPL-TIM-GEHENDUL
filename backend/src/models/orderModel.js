const db = require('../config/db');

class OrderModel {
    static async create(userId, totalPrice, items) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [orderResult] = await connection.execute(
                'INSERT INTO orders (user_id, total_price, status) VALUES (?, ?, ?)',
                [userId, totalPrice, 'ORDERED']
            );
            const orderId = orderResult.insertId;

            for (let item of items) {
                await connection.execute(
                    'INSERT INTO order_items (order_id, menu_id, quantity, price) VALUES (?, ?, ?, ?)',
                    [orderId, item.menu_id, item.quantity, item.price]
                );
            }

            await connection.commit();
            return orderId;
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    static async findAll() {
        const [rows] = await db.execute(`
            SELECT o.*, u.name as user_name
            FROM orders o
            JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        return rows;
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute(`
            SELECT * FROM orders
            WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM orders WHERE id = ?', [id]);
        if (rows.length === 0) return null;

        const order = rows[0];
        const [items] = await db.execute(`
            SELECT oi.*, m.name as menu_name
            FROM order_items oi
            JOIN menus m ON oi.menu_id = m.id
            WHERE oi.order_id = ?
        `, [id]);

        order.items = items;
        return order;
    }

    static async updateStatus(id, status) {
        await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }
}

module.exports = OrderModel;
