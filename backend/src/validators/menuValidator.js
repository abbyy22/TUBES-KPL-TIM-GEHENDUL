'use strict';

const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const VALID_CATEGORIES = ['food', 'drink', 'snack', 'beverage'];
const VALID_STATUSES = ['available', 'unavailable', 'out_of_stock'];

// Schema untuk CREATE menu (semua field wajib)
const menuCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'name wajib diisi',
    'any.required': 'name wajib diisi',
    'string.min': 'name minimal 2 karakter',
  }),
  stok: Joi.number().integer().min(0).default(0).messages({
    'number.base': 'stok harus berupa angka',
    'number.integer': 'stok harus bilangan bulat',
    'number.min': 'stok tidak boleh negatif',
  }),
  price: Joi.number().integer().min(0).required().messages({
    'number.base': 'price harus berupa angka',
    'number.integer': 'price harus bilangan bulat',
    'number.min': 'price tidak boleh negatif',
    'any.required': 'price wajib diisi',
  }),
  status: Joi.string().valid(...VALID_STATUSES).default('available').messages({
    'any.only': `status harus salah satu dari: ${VALID_STATUSES.join(', ')}`,
  }),
  category_id: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().valid(...VALID_CATEGORIES),
  ).required().messages({
    'any.required': 'category_id wajib diisi',
  }),
  kantin_id: Joi.number().integer().positive().required().messages({
    'any.required': 'kantin_id wajib diisi',
    'number.positive': 'kantin_id harus integer positif',
  }),
  description: Joi.string().max(500).allow(null, '').optional(),
  emoji: Joi.string().max(10).allow(null, '').optional(),
  available: Joi.boolean().optional(),
});

// Schema untuk UPDATE menu (semua field opsional)
const menuUpdateSchema = menuCreateSchema.fork(
  ['name', 'price', 'category_id', 'kantin_id'],
  (schema) => schema.optional(),
);

function validateMenuCreate(body) {
  const { error, value } = menuCreateSchema.validate(body, { abortEarly: true, allowUnknown: false });
  if (error) throw ApiError.badRequest(error.details[0].message);

  // Normalize: if available not given, derive from status
  if (value.available === undefined) {
    value.available = value.status === 'available' ? 1 : 0;
  } else {
    value.available = value.available ? 1 : 0;
  }

  return value;
}

function validateMenuUpdate(body) {
  const { error, value } = menuUpdateSchema.validate(body, { abortEarly: true, allowUnknown: false });
  if (error) throw ApiError.badRequest(error.details[0].message);

  const out = {};
  if (value.name !== undefined) out.name = value.name;
  if (value.stok !== undefined) out.stok = value.stok;
  if (value.price !== undefined) out.price = value.price;
  if (value.status !== undefined) out.status = value.status;
  if (value.category_id !== undefined) out.category_id = value.category_id;
  if (value.kantin_id !== undefined) out.kantin_id = value.kantin_id;
  if (value.description !== undefined) out.description = value.description;
  if (value.emoji !== undefined) out.emoji = value.emoji;
  if (value.available !== undefined) out.available = value.available ? 1 : 0;

  return out;
}

// Legacy aliases for backward compat with menuController
function validateMenuInput(body, { partial = false } = {}) {
  return partial ? validateMenuUpdate(body) : validateMenuCreate(body);
}

module.exports = { validateMenuCreate, validateMenuUpdate, validateMenuInput };
