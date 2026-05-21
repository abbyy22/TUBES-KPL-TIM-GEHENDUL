'use strict';

/**
 * Wrap async route handlers sehingga error otomatis ke next().
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
