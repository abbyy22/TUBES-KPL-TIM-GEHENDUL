
"use strict";

const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { authenticate } = require("../middleware/auth");
const { uploadAvatar } = require("../middleware/upload");
const { register, login, me, updateProfile } = require("../controllers/authController");
const { uploadUserPhoto, deleteUserPhoto } = require("../controllers/uploadController");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.get("/me", authenticate, asyncHandler(me));
router.patch("/me", authenticate, asyncHandler(updateProfile));

// ─── Foto Profil ──────────────────────────────────────────────────────────────
// Upload/ganti foto profil user yang sedang login
router.post('/avatar', authenticate, uploadAvatar, asyncHandler(uploadUserPhoto));
// Hapus foto profil user
router.delete('/avatar', authenticate, asyncHandler(deleteUserPhoto));

module.exports = router;
