"use strict";

const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require("../validators");
const authService = require("../services/authService");

async function register(req, res) {
  const input = validateRegister(req.body);
  const session = await authService.registerUser(input);
  res.status(201).json({ success: true, data: session });
}

async function login(req, res) {
  const input = validateLogin(req.body);
  const session = await authService.loginUser(input);
  res.json({ success: true, data: session });
}

async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  res.json({ success: true, data: user });
}

async function updateProfile(req, res) {
  const input = validateUpdateProfile(req.body);
  const user = await authService.updateCurrentUser(req.user.id, input);
  res.json({ success: true, data: user });
}

module.exports = { register, login, me, updateProfile };
