'use strict';

const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');

/**
 * Role aliases – map frontend/DB role strings to canonical groups.
 * penjual / admin / owner  →  all treated as admin-capable
 */
const ADMIN_ROLES = new Set(['admin', 'penjual', 'owner']);

/**
 * Normalize a raw role string to a canonical role.
 * Returns 'admin' for any admin-capable role, otherwise the role as-is.
 */
function normalizeRole(role) {
  return ADMIN_ROLES.has(role) ? 'admin' : role;
}

/**
 * Auth middleware - verifikasi JWT dari header Authorization: Bearer <token>.
 * Hasil decoded disimpan di req.user = { id, role, email, name }.
 * req.user.role adalah nilai RAW dari token (e.g. 'penjual', 'user').
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Authorization header wajib (Bearer <token>)'));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
      name: payload.name,
      kantin_id: payload.kantin_id || null,  // ID numerik kantin owner (null untuk pelanggan)
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Role-based authorization. Pakai setelah authenticate.
 * Mendukung role aliases: 'admin' juga menerima 'penjual' dan 'owner'.
 * @param  {...string} roles - roles yang diizinkan
 */
function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) return next(ApiError.unauthorized());

    if (roles.length > 0) {
      // Normalize requested roles – jika 'admin' ada di list, expand ke semua admin-capable roles
      const allowed = new Set(roles);
      if (allowed.has('admin')) {
        ADMIN_ROLES.forEach(r => allowed.add(r));
      }

      if (!allowed.has(req.user.role)) {
        return next(ApiError.forbidden('Akses ditolak untuk role ini'));
      }
    }

    return next();
  };
}

module.exports = { authenticate, authorize, normalizeRole, ADMIN_ROLES };
