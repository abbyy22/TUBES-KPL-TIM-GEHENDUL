"use strict";

const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const userRepository = require("../repositories/userRepository");
const {
  hasRequiredKeys,
  invariant,
  isNonEmptyString,
  postcondition,
  precondition,
} = require("../utils/contract");

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    photo_url: user.photo_url || null,
    kantin_id: user.kantin_id,
    kantin_name: user.kantin_name,
    kantin_code: user.kantin_code || null,
    created_at: user.created_at,
  };
}

function createSession(user) {
  precondition(user && user.id, "User session tidak valid");

  const publicUser = toPublicUser(user);
  const token = signToken({
    sub: publicUser.id,
    role: publicUser.role,
    email: publicUser.email,
    name: publicUser.name,
    kantin_id: publicUser.kantin_id,
    kantin_name: publicUser.kantin_name,
    kantin_code: publicUser.kantin_code,
  });

  postcondition(isNonEmptyString(token), "Token gagal dibuat");
  return { user: publicUser, token };
}

async function registerUser(input) {
  precondition(
    hasRequiredKeys(input, ["name", "email", "password"]),
    "Data registrasi tidak lengkap",
  );
  precondition(isNonEmptyString(input.email), "Email wajib diisi");
  precondition(isNonEmptyString(input.password), "Password wajib diisi");

  const existing = await userRepository.findByEmail(input.email);
  if (existing) throw ApiError.conflict("Email sudah terdaftar");

  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await userRepository.createUser({
    name: input.name,
    email: input.email,
    password_hash: passwordHash,
    role: "pelanggan", // selalu pelanggan — admin hanya bisa diset manual di DB
  });

  invariant(created.id > 0, "User gagal dibuat");
  return createSession(created);
}

async function loginUser(input) {
  precondition(
    hasRequiredKeys(input, ["email", "password"]),
    "Data login tidak lengkap",
  );

  const user = await userRepository.findByEmail(input.email);
  if (!user) throw ApiError.unauthorized("Email atau password salah");

  const ok = await bcrypt.compare(input.password, user.password_hash);
  if (!ok) throw ApiError.unauthorized("Email atau password salah");

  return createSession(user);
}

async function getCurrentUser(userId) {
  precondition(Number.isInteger(Number(userId)), "User id tidak valid");
  const user = await userRepository.findPublicById(userId);
  if (!user) throw ApiError.notFound("User tidak ditemukan");
  return user;
}

async function updateCurrentUser(userId, input) {
  const publicUser = await userRepository.findPublicById(userId);
  if (!publicUser) throw ApiError.notFound("User tidak ditemukan");

  const updates = {};
  if (input.name !== undefined) updates.name = input.name;

  if (input.new_password) {
    const authUser = await userRepository.findByEmail(publicUser.email);
    invariant(
      authUser && authUser.password_hash,
      "Data password user tidak tersedia",
    );
    const ok = await bcrypt.compare(
      input.current_password,
      authUser.password_hash,
    );
    if (!ok) throw ApiError.unauthorized("Password lama salah");
    updates.password_hash = await bcrypt.hash(input.new_password, 10);
  }

  return userRepository.updateUser(userId, updates);
}

module.exports = {
  getCurrentUser,
  loginUser,
  registerUser,
  updateCurrentUser,
};
