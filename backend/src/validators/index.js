'use strict';

const ApiError = require('../utils/ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function isPositiveInt(v) {
  return Number.isInteger(v) && v > 0;
}

function isNonNegativeInt(v) {
  return Number.isInteger(v) && v >= 0;
}

function assert(condition, message, details) {
  if (!condition) throw ApiError.badRequest(message, details);
}

function validateRegister(body) {
  const { name, email, password, role } = body || {};
  assert(isNonEmptyString(name), 'name wajib diisi');
  assert(isNonEmptyString(email) && EMAIL_RE.test(email), 'email tidak valid');
  assert(isNonEmptyString(password) && password.length >= 6, 'password minimal 6 karakter');
  if (role !== undefined) {
    assert(role === 'pelanggan', "register publik hanya boleh role 'pelanggan'");
  }
  return {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password,
    role: 'pelanggan',
  };
}

function validateLogin(body) {
  const { email, password } = body || {};
  assert(isNonEmptyString(email) && EMAIL_RE.test(email), 'email tidak valid');
  assert(isNonEmptyString(password), 'password wajib diisi');
  return { email: email.trim().toLowerCase(), password };
}

function validateMenuInput(body, { partial = false } = {}) {
  const out = {};
  const { kantin_id, name, price, emoji, description, available } = body || {};

  if (!partial || kantin_id !== undefined) {
    assert(isPositiveInt(kantin_id), 'kantin_id harus integer positif');
    out.kantin_id = kantin_id;
  }
  if (!partial || name !== undefined) {
    assert(isNonEmptyString(name), 'name wajib diisi');
    out.name = name.trim();
  }
  if (!partial || price !== undefined) {
    assert(isNonNegativeInt(price), 'price harus integer >= 0');
    out.price = price;
  }
  if (emoji !== undefined) {
    assert(typeof emoji === 'string' && emoji.length <= 10, 'emoji tidak valid');
    out.emoji = emoji;
  }
  if (description !== undefined) {
    assert(description === null || typeof description === 'string', 'description tidak valid');
    out.description = description;
  }
  if (available !== undefined) {
    assert(typeof available === 'boolean', 'available harus boolean');
    out.available = available ? 1 : 0;
  }
  return out;
}

function validateOrderInput(body) {
  const { kantin_id, customer_name, items } = body || {};
  assert(isPositiveInt(kantin_id), 'kantin_id harus integer positif');
  assert(isNonEmptyString(customer_name), 'customer_name wajib diisi (nama pemesan)');
  assert(Array.isArray(items) && items.length > 0, 'items minimal 1 item');

  const cleanItems = items.map((it, idx) => {
    assert(it && isPositiveInt(it.menu_id), `items[${idx}].menu_id harus integer positif`);
    assert(isPositiveInt(it.quantity), `items[${idx}].quantity harus integer positif`);
    return { menu_id: it.menu_id, quantity: it.quantity };
  });

  return {
    kantin_id,
    customer_name: customer_name.trim(),
    items: cleanItems,
  };
}

module.exports = {
  isNonEmptyString,
  isPositiveInt,
  isNonNegativeInt,
  assert,
  validateRegister,
  validateLogin,
  validateMenuInput,
  validateOrderInput,
};
