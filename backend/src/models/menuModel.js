const db = require('../config/db');

class MenuModel {
    static async findAll() {
        const [rows] = await db.execute('SELECT * FROM menus');
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT * FROM menus WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(menu) {
        const { name, description = null, price, image_url = null, is_available = true } = menu;
        const [result] = await db.execute(
            'INSERT INTO menus (name, description, price, image_url, is_available) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, image_url, is_available]
        );
        return result.insertId;
    }

    static async update(id, menu) {
        const { name, description = null, price, image_url = null, is_available = true } = menu;
        await db.execute(
            'UPDATE menus SET name = ?, description = ?, price = ?, image_url = ?, is_available = ? WHERE id = ?',
            [name, description, price, image_url, is_available, id]
        );
    }

    static async delete(id) {
        await db.execute('DELETE FROM menus WHERE id = ?', [id]);
    }
}

module.exports = MenuModel;
