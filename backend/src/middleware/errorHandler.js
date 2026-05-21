'use strict';

const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Internal server error';
  let details = null;

  if (err instanceof ApiError) {
    status = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err && err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Token tidak valid';
  } else if (err && err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token sudah kadaluarsa';
  } else if (err && err.code === 'ER_DUP_ENTRY') {
    status = 409;
    message = 'Data duplikat (constraint unik dilanggar)';
  } else if (err && err.message) {
    message = err.message;
  }

  if (status >= 500) {
    console.error('[errorHandler]', err);
  }

  res.status(status).json({
    success: false,
    error: { message, details },
  });
}

module.exports = { notFound, errorHandler };
