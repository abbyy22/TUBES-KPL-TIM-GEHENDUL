const OrderModel = require('../models/orderModel');
const MenuModel = require('../models/menuModel');
const Joi = require('joi');

const orderSchema = Joi.object({
    items: Joi.array().items(
        Joi.object({
            menu_id: Joi.number().integer().required(),
            quantity: Joi.number().integer().min(1).required()
        })
    ).min(1).required()
});

const statusSchema = Joi.object({
    status: Joi.string().valid('ORDERED', 'COOKING', 'READY', 'DONE').required()
});

const placeOrder = async (req, res) => {
    try {
        const { error, value } = orderSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        let totalPrice = 0;
        const processedItems = [];

        // Validate items and calculate total price
        for (let item of value.items) {
            const menu = await MenuModel.findById(item.menu_id);
            if (!menu || !menu.is_available) {
                return res.status(400).json({ message: `Menu item ${item.menu_id} is not available` });
            }
            const itemPrice = menu.price * item.quantity;
            totalPrice += itemPrice;
            processedItems.push({
                menu_id: item.menu_id,
                quantity: item.quantity,
                price: menu.price // save the price at the time of order
            });
        }

        const newOrderId = await OrderModel.create(req.user.userId, totalPrice, processedItems);

        // Emit socket event to admin
        const io = req.app.get('io');
        if (io) {
            io.emit('new_order', { orderId: newOrderId, userId: req.user.userId, totalPrice });
        }

        res.status(201).json({ message: 'Order placed successfully', orderId: newOrderId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await OrderModel.findByUserId(req.user.userId);
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllOrders = async (req, res) => {
    try {
        const orders = await OrderModel.findAll();
        res.json(orders);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getOrderById = async (req, res) => {
    try {
        const order = await OrderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // Ensure user can only view their own order, unless they are admin
        if (order.user_id !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(order);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { error, value } = statusSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const order = await OrderModel.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        await OrderModel.updateStatus(req.params.id, value.status);

        // Emit socket event to the user who placed the order
        const io = req.app.get('io');
        if (io) {
            io.emit(`order_status_${order.user_id}`, { orderId: req.params.id, status: value.status });
            io.emit('admin_order_update', { orderId: req.params.id, status: value.status });
        }

        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    placeOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus
};
