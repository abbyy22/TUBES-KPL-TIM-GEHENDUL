'use strict';

const express = require('express');
const authRoutes = require('./authRoutes');
const kantinRoutes = require('./kantinRoutes');
const menuRoutes = require('./menuRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Smart Canteen API',
    version: '1.0.0',
    endpoints: [
      'POST   /api/auth/register',
      'POST   /api/auth/login',
      'GET    /api/auth/me',
      'GET    /api/kantins',
      'GET    /api/kantins/:id',
      'POST   /api/kantins                (admin)',
      'PUT    /api/kantins/:id            (admin)',
      'DELETE /api/kantins/:id            (admin)',
      'GET    /api/menus?kantin_id=&available=',
      'GET    /api/menus/:id',
      'POST   /api/menus                  (admin)',
      'PUT    /api/menus/:id              (admin)',
      'DELETE /api/menus/:id              (admin)',
      'POST   /api/orders',
      'GET    /api/orders/me',
      'GET    /api/orders?status=&kantin_id=   (admin)',
      'GET    /api/orders/:id',
      'PATCH  /api/orders/:id/status      (admin)',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/kantins', kantinRoutes);
router.use('/menus', menuRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
