const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authMiddleware, adminMiddleware } = require('../middlewares/authMiddleware');

router.get('/', menuController.getAllMenus);
router.get('/:id', menuController.getMenuById);

// Admin only routes
router.post('/', authMiddleware, adminMiddleware, menuController.createMenu);
router.put('/:id', authMiddleware, adminMiddleware, menuController.updateMenu);
router.delete('/:id', authMiddleware, adminMiddleware, menuController.deleteMenu);

module.exports = router;
