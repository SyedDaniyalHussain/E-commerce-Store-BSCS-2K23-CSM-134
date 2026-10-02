const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { errorResponse } = require('../utils/errors');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return errorResponse(res, 401, 'AUTH_REQUIRED', 'Authentication is required.');
  try {
    req.user = jwt.verify(header.slice(7), env.jwtSecret);
    next();
  } catch { return errorResponse(res, 401, 'INVALID_TOKEN', 'The authentication token is invalid or expired.'); }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return errorResponse(res, 403, 'ADMIN_REQUIRED', 'Administrator access is required.');
  next();
}

module.exports = { authenticate, requireAdmin };
