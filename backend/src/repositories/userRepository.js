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
    photo_url: row.photo_url || null,
    kantin_id: row.kantin_id,
    kantin_name: row.kantin_name,
    kantin_code: row.kantin_code,
    created_at: row.created_at,
  };
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.password_hash, u.role, u.photo_url,
            k.id as kantin_id, k.name as kantin_name, k.code as kantin_code
     FROM users u
     LEFT JOIN kantins k ON k.code = CASE 
       WHEN SUBSTRING_INDEX(u.email, '@', 1) = 'admin' THEN 'neo1'
       ELSE SUBSTRING_INDEX(u.email, '@', 1)
     END
     WHERE u.email = ?`,
    [email],
  );
  return mapAuthRow(rows[0]);
}

async function findPublicById(id) {
  const [rows] = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.photo_url, u.created_at,
            k.id as kantin_id, k.name as kantin_name, k.code as kantin_code
     FROM users u
     LEFT JOIN kantins k ON k.code = CASE 
       WHEN SUBSTRING_INDEX(u.email, '@', 1) = 'admin' THEN 'neo1'
       ELSE SUBSTRING_INDEX(u.email, '@', 1)
     END
     WHERE u.id = ?`,
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
