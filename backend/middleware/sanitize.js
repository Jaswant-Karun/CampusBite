/**
 * CampusBite Input Sanitization Middleware
 * Protects Express application from NoSQL injection and prototype pollution.
 */

const { sanitizeInput } = require('../utils/security');

function sanitizeMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
}

module.exports = sanitizeMiddleware;
