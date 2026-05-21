'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu,
} = require('../controllers/menuController');

const router = express.Router();

router.get('/', authenticate, asyncHandler(listMenus));
router.get('/:id', authenticate, asyncHandler(getMenu));

router.post('/', authenticate, authorize('admin'), asyncHandler(createMenu));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(updateMenu));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(deleteMenu));

module.exports = router;
