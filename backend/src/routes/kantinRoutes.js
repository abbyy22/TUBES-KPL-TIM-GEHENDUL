'use strict';

const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth');
const {
  listKantins, getKantin, createKantin, updateKantin, deleteKantin,
} = require('../controllers/kantinController');

const router = express.Router();

// Read: semua user yang sudah login
router.get('/', authenticate, asyncHandler(listKantins));
router.get('/:id', authenticate, asyncHandler(getKantin));

// Write: hanya admin
router.post('/', authenticate, authorize('admin'), asyncHandler(createKantin));
router.put('/:id', authenticate, authorize('admin'), asyncHandler(updateKantin));
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(deleteKantin));

module.exports = router;
