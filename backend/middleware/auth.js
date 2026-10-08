/**
 * CampusBite Security & Role-Based Authentication Middleware
 * Standard HMAC-SHA256 signed token management & role-based route guards
 */

const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'campusbite_jwt_secret_key_2026';

// Generates a cryptographically signed session token
function generateToken(user) {
  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: (user.role || 'student').toLowerCase(),
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

// Verifies token signature and checks expiry
function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(data).digest('base64url');
  if (signature !== expectedSig) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

// Authenticates incoming request from Bearer header
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-auth-token'];
  if (!token && req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session token. Please log in again.'
    });
  }

  req.user = decoded;
  next();
}

// Enforces role-based authorization
function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) 
    ? allowedRoles.map(r => r.toLowerCase()) 
    : [allowedRoles.toLowerCase()];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role || 'student').toLowerCase();
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: requires ${roles.join(' or ')} privileges`
      });
    }

    next();
  };
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateToken,
  requireRole
};
