"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate, authorize } = require("../middleware/auth");
const {
  createOrder,
  listMyOrders,
  listAllOrders,
  getOrder,
  updateOrderStatus,
  listOrdersByKantin,
} = require("../controllers/orderController");

const router = express.Router();

// Pelanggan & admin
router.post("/", authenticate, asyncHandler(createOrder));
router.get("/me", authenticate, asyncHandler(listMyOrders));

// Admin only - lihat semua pesanan
router.get("/", authenticate, authorize("admin"), asyncHandler(listAllOrders));

router.get(
  "/kantin/:kantin_id",
  authenticate,
  asyncHandler(listOrdersByKantin),
);

// Detail order: pelanggan untuk milik sendiri, admin untuk semua (cek di handler)
router.get("/:id", authenticate, asyncHandler(getOrder));
// Update status: admin only
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  asyncHandler(updateOrderStatus),
);

module.exports = router;
