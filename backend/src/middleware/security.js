"use strict";

/**
 * Secure coding middleware tanpa dependency tambahan.
 * Fokus: mitigasi header-level untuk XSS/clickjacking/MIME sniffing.
 */
function securityHeaders(req, res, next) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'",
  );
  next();
}

module.exports = { securityHeaders };
