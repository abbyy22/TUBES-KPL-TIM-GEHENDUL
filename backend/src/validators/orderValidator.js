'use strict';

const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const orderItemSchema = Joi.object({
  menu_id: Joi.number().integer().positive().required().messages({
    'number.base': 'menu_id harus berupa angka',
    'number.integer': 'menu_id harus bilangan bulat',
    'number.positive': 'menu_id harus integer positif',
    'any.required': 'menu_id wajib diisi',
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'number.base': 'quantity harus berupa angka',
    'number.integer': 'quantity harus bilangan bulat',
    'number.positive': 'quantity harus integer positif',
    'any.required': 'quantity wajib diisi',
  }),
});

const orderSchema = Joi.object({
  user_id: Joi.number().integer().positive().optional().messages({
    'number.base': 'user_id harus berupa angka',
    'number.integer': 'user_id harus bilangan bulat',
    'number.positive': 'user_id harus integer positif',
  }),
  kantin_id: Joi.number().integer().positive().required().messages({
    'number.base': 'kantin_id harus berupa angka',
    'number.integer': 'kantin_id harus bilangan bulat',
    'number.positive': 'kantin_id harus integer positif',
    'any.required': 'kantin_id wajib diisi',
  }),
  customer_name: Joi.string().trim().min(1).max(100).required().messages({
    'string.empty': 'customer_name wajib diisi (nama pemesan)',
    'any.required': 'customer_name wajib diisi (nama pemesan)',
  }),
  no_meja: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().max(10),
  ).optional().messages({
    'alternatives.match': 'no_meja harus berupa angka atau string singkat',
  }),
  items: Joi.array().items(orderItemSchema).min(1).required().messages({
    'array.min': 'items minimal 1 item',
    'array.base': 'items harus berupa array',
    'any.required': 'items wajib diisi',
  }),
});

function validateOrderInput(body) {
  const { error, value } = orderSchema.validate(body, { abortEarly: true, allowUnknown: false });
  if (error) throw ApiError.badRequest(error.details[0].message);

  return {
    kantin_id: value.kantin_id,
    customer_name: value.customer_name.trim(),
    no_meja: value.no_meja ?? null,
    items: value.items.map(it => ({ menu_id: it.menu_id, quantity: it.quantity })),
  };
}

module.exports = { validateOrderInput };
