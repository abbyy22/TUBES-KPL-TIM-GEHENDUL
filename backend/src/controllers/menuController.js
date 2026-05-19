const MenuModel = require('../models/menuModel');
const Joi = require('joi');

const menuSchema = Joi.object({
    name: Joi.string().max(255).required(),
    description: Joi.string().allow('', null).optional(),
    price: Joi.number().positive().required(),
    image_url: Joi.string().uri().allow('', null).optional(),
    is_available: Joi.boolean().optional()
});

const getAllMenus = async (req, res) => {
    try {
        const menus = await MenuModel.findAll();
        res.json(menus);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMenuById = async (req, res) => {
    try {
        const menu = await MenuModel.findById(req.params.id);
        if (!menu) return res.status(404).json({ message: 'Menu not found' });
        res.json(menu);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const createMenu = async (req, res) => {
    try {
        const { error, value } = menuSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const newMenuId = await MenuModel.create(value);
        res.status(201).json({ message: 'Menu created successfully', id: newMenuId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateMenu = async (req, res) => {
    try {
        const { error, value } = menuSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const menu = await MenuModel.findById(req.params.id);
        if (!menu) return res.status(404).json({ message: 'Menu not found' });

        await MenuModel.update(req.params.id, value);
        res.json({ message: 'Menu updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteMenu = async (req, res) => {
    try {
        const menu = await MenuModel.findById(req.params.id);
        if (!menu) return res.status(404).json({ message: 'Menu not found' });

        await MenuModel.delete(req.params.id);
        res.json({ message: 'Menu deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu
};
