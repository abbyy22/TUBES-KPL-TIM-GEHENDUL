"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const {
  register,
  login,
  me,
  updateProfile,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
router.patch("/me", authenticate, asyncHandler(updateProfile));

module.exports = router;
