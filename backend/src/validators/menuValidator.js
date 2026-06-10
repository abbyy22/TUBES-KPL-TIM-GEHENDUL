"use strict";

const Joi = require("joi");
const ApiError = require("../utils/ApiError");

// Field yang benar-benar ada di tabel menus:
// id, kantin_id, name, price, emoji, description, available, created_at, updated_at
// Field UI lama seperti stok/status/category_id tetap diterima,
// tapi tidak dimasukkan ke query SQL karena kolomnya tidak ada di database.
const VALID_CATEGORIES = ["food", "drink", "snack", "beverage"];
const VALID_STATUSES = ["available", "unavailable", "out_of_stock"];

const menuCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "name wajib diisi",
    "any.required": "name wajib diisi",
    "string.min": "name minimal 2 karakter",
  }),

  price: Joi.number().integer().min(0).required().messages({
    "number.base": "price harus berupa angka",
    "number.integer": "price harus bilangan bulat",
    "number.min": "price tidak boleh negatif",
    "any.required": "price wajib diisi",
  }),

  kantin_id: Joi.number().integer().positive().required().messages({
    "any.required": "kantin_id wajib diisi",
    "number.positive": "kantin_id harus integer positif",
  }),

  description: Joi.string().max(500).allow(null, "").optional(),
  emoji: Joi.string().max(10).allow(null, "").optional(),
  available: Joi.boolean().optional(),

  // Backward-compatible dari form lama.
  // Tidak disimpan ke DB.
  stok: Joi.number().integer().min(0).optional(),
  status: Joi.string()
    .valid(...VALID_STATUSES)
    .optional(),
  category_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().valid(...VALID_CATEGORIES),
    )
    .optional(),
});

const menuUpdateSchema = menuCreateSchema.fork(
  ["name", "price", "kantin_id"],
  (schema) => schema.optional(),
);

function toDbPayload(value) {
  const out = {};

  if (value.name !== undefined) out.name = value.name;
  if (value.price !== undefined) out.price = value.price;
  if (value.kantin_id !== undefined) out.kantin_id = value.kantin_id;
  if (value.description !== undefined) out.description = value.description;
  if (value.emoji !== undefined) out.emoji = value.emoji;

  // Di UI ada status, di database adanya available.
  if (value.available !== undefined) {
    out.available = value.available ? 1 : 0;
  } else if (value.status !== undefined) {
    out.available = value.status === "available" ? 1 : 0;
  }

  return out;
}

function validateMenuCreate(body) {
  const { error, value } = menuCreateSchema.validate(body, {
    abortEarly: true,
    allowUnknown: false,
  });

  if (error) throw ApiError.badRequest(error.details[0].message);

  const out = toDbPayload(value);
  out.kantin_id = value.kantin_id;

  if (out.available === undefined) out.available = 1;

  return out;
}

function validateMenuUpdate(body) {
  const { error, value } = menuUpdateSchema.validate(body, {
    abortEarly: true,
    allowUnknown: false,
  });

  if (error) throw ApiError.badRequest(error.details[0].message);

  return toDbPayload(value);
}

function validateMenuInput(body, { partial = false } = {}) {
  return partial ? validateMenuUpdate(body) : validateMenuCreate(body);
}

module.exports = {
  validateMenuCreate,
  validateMenuUpdate,
  validateMenuInput,
};
