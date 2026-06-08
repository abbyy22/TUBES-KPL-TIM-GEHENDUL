"use strict";

const bcrypt = require("bcryptjs");
const { pool } = require("../config/db");
const { signToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");
const { validateRegister, validateLogin } = require("../validators");

async function register(req, res) {
  // validateRegister maps full_name → name, and forces role: 'user'
  const { name, email, password, role } = validateRegister(req.body);

  const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [
    email,
  ]);
  if (existing.length > 0) {
    throw ApiError.conflict("Email sudah terdaftar");
  }

  const password_hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, password_hash, role],
  );

  const user = { id: result.insertId, name, email, role };
  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
  });

  res.status(201).json({ success: true, data: { user, token } });
}

async function login(req, res) {
  const { email, password } = validateLogin(req.body);

  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, 
          k.id as kantin_id, k.name as kantin_name, k.code as kantin_code
   FROM users u
   LEFT JOIN kantins k ON k.code = SUBSTRING_INDEX(u.email, '@', 1)
   WHERE u.email = ?`,
    [email],
  );
  if (rows.length === 0)
    throw ApiError.unauthorized("Email atau password salah");

  const row = rows[0];
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) throw ApiError.unauthorized("Email atau password salah");

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    kantin_id: row.kantin_id,
    kantin_name: row.kantin_name,
  };
  const token = signToken({
    sub: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    kantin_id: user.kantin_id,
    kantin_name: user.kantin_name,
  });

  res.json({ success: true, data: { user, token } });
}

async function me(req, res) {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
    [req.user.id],
  );
  if (rows.length === 0) throw ApiError.notFound("User tidak ditemukan");
  res.json({ success: true, data: rows[0] });
}

module.exports = { register, login, me };
