'use strict';

const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const registerSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'full_name wajib diisi',
    'any.required': 'full_name wajib diisi',
    'string.min': 'full_name minimal 2 karakter',
  }),
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'email tidak valid',
    'string.empty': 'email wajib diisi',
    'any.required': 'email wajib diisi',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'password minimal 6 karakter',
    'string.empty': 'password wajib diisi',
    'any.required': 'password wajib diisi',
  }),
  // role tidak boleh dikirim dari form publik; selalu default "user"
  role: Joi.forbidden().messages({
    'any.unknown': "register publik tidak boleh memilih role",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().required().messages({
    'string.email': 'email tidak valid',
    'string.empty': 'email wajib diisi',
    'any.required': 'email wajib diisi',
  }),
  password: Joi.string().required().messages({
    'string.empty': 'password wajib diisi',
    'any.required': 'password wajib diisi',
  }),
});

function validateRegister(body) {
  const { error, value } = registerSchema.validate(body, { abortEarly: true, allowUnknown: false });
  if (error) throw ApiError.badRequest(error.details[0].message);
  return {
    name: value.full_name,   // map full_name → name (DB column)
    email: value.email,
    password: value.password,
    role: 'user',            // default role for public register
  };
}

function validateLogin(body) {
  const { error, value } = loginSchema.validate(body, { abortEarly: true });
  if (error) throw ApiError.badRequest(error.details[0].message);
  return { email: value.email, password: value.password };
}

module.exports = { validateRegister, validateLogin };
