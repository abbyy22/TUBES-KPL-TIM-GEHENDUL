'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadMenuPhoto: uploadMenuFile } = require('../middleware/upload');
const {
  listMenus, getMenu, createMenu, updateMenu, deleteMenu,
} = require('../controllers/menuController');
const { uploadMenuPhoto, deleteMenuPhoto } = require('../controllers/uploadController');

const router = express.Router();

router.get('/', authenticate, asyncHandler(listMenus));
router.get('/:id', authenticate, asyncHandler(getMenu));

router.post('/', authenticate, authorize('admin'), asyncHandler(createMenu));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(updateMenu));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(deleteMenu));

// ─── Foto Menu ─────────────────────────────────────────────────────────────
router.post('/:id/photo', authenticate, authorize('admin'), uploadMenuFile, asyncHandler(uploadMenuPhoto));
router.delete('/:id/photo', authenticate, authorize('admin'), asyncHandler(deleteMenuPhoto));

module.exports = router;
