"use strict";

const { pool } = require("../config/db");

function mapAuthRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role,
    kantin_id: row.kantin_id,
    kantin_name: row.kantin_name,
    kantin_code: row.kantin_code,
    created_at: row.created_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role,
            k.id as kantin_id, k.name as kantin_name, k.code as kantin_code
     FROM users u
     LEFT JOIN kantins k ON k.code = SUBSTRING_INDEX(u.email, '@', 1)
     WHERE u.email = ?`,
    [email],
  );
  return mapAuthRow(rows[0]);
}

async function findPublicById(id) {
  const [rows] = await pool.query(
    "SELECT id, name, email, role, photo_url, created_at FROM users WHERE id = ?",
    [id],
  );
  return rows[0] || null;
}

async function createUser({ name, email, password_hash, role }) {
  const [result] = await pool.query(
    "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
    [name, email, password_hash, role],
  );
  return { id: result.insertId, name, email, role };
}

async function updateUser(id, updates) {
  const entries = Object.entries(updates).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return findPublicById(id);

  const setSql = entries.map(([key]) => `${key} = ?`).join(", ");
  const params = entries.map(([, value]) => value);
  params.push(id);

  await pool.query(`UPDATE users SET ${setSql} WHERE id = ?`, params);
  return findPublicById(id);
}


module.exports = {
  createUser,
  findByEmail,
  findPublicById,
  updateUser,
};
