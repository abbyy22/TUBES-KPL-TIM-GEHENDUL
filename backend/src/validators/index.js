"use strict";

/**
 * validators/index.js
 *
 * Central export point for all validators.
 * Each domain has its own Joi-based file; this module re-exports
 * everything for backward compatibility with existing controllers.
 */

const {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
} = require("./authValidator");
const {
  validateMenuCreate,
  validateMenuUpdate,
  validateMenuInput,
} = require("./menuValidator");
const { validateOrderInput } = require("./orderValidator");
const ApiError = require("../utils/ApiError");

// ─── Legacy helpers used directly in controllers/orderController.js ───────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
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

// ─── Re-exports ───────────────────────────────────────────────────────────────

module.exports = {
  // Auth
  validateRegister,
  validateLogin,
  validateUpdateProfile,

  // Menu
  validateMenuCreate,
  validateMenuUpdate,
  validateMenuInput,

  // Order
  validateOrderInput,

  // Utilities (used by orderController etc.)
  isNonEmptyString,
  isPositiveInt,
  isNonNegativeInt,
  assert,
};
