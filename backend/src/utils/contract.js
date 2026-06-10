"use strict";

const ApiError = require("./ApiError");

/**
 * Design by Contract helper.
 * Dipakai untuk menegaskan precondition, postcondition, dan invariant
 * pada service/backend agar input-output tidak melenceng dari kontrak.
 */
function precondition(condition, message = "Precondition gagal") {
  if (!condition) throw ApiError.badRequest(message);
}

function postcondition(condition, message = "Postcondition gagal") {
  if (!condition) throw ApiError.internal(message);
}

function invariant(condition, message = "Invariant gagal") {
  if (!condition) throw ApiError.internal(message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasRequiredKeys(object, keys) {
  return keys.every((key) =>
    Object.prototype.hasOwnProperty.call(object || {}, key),
  );
}

module.exports = {
  hasRequiredKeys,
  invariant,
  isNonEmptyString,
  postcondition,
  precondition,
};
