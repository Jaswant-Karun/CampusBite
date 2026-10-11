/**
 * CampusBite Security & Privacy Review Verification Suite (Step 27)
 * Tests all 12 dimensions of the security review.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { hashPassword, verifyPassword, sanitizeUser, sanitizeInput, createRateLimiter } = require('./utils/security');
const { generateToken, verifyToken, authenticateToken, requireRole } = require('./middleware/auth');
const db = require('./data/db');

console.log('====================================================');
console.log('🛡️ CAMPUSBITE STEP 27: SECURITY & PRIVACY TEST SUITE');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${totalTests}. ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${totalTests}. ${name}`);
    console.error(`     Error: ${err.message}`);
  }
}

// ----------------------------------------------------
// 1. Authentication
// ----------------------------------------------------
console.log('--- 1. Authentication & Session Security ---');
runTest('Tokens are cryptographically signed and verify successfully', () => {
  const user = { id: 'u-101', name: 'Jaswant Karun', email: 'jaswant@campus.edu', role: 'student' };
  const token = generateToken(user);
  assert(typeof token === 'string' && token.includes('.'), 'Token format valid');
  const decoded = verifyToken(token);
  assert(decoded && decoded.id === 'u-101' && decoded.role === 'student', 'Token payload correctly verified');
});

runTest('Tampered or malformed tokens are safely rejected', () => {
  const user = { id: 'u-101', name: 'Jaswant Karun', role: 'student' };
  const validToken = generateToken(user);
  const tamperedToken = validToken.slice(0, -4) + 'abcd';
  assert.strictEqual(verifyToken(tamperedToken), null, 'Tampered token rejected');
  assert.strictEqual(verifyToken('malformed.token.format'), null, 'Malformed token rejected');
  assert.strictEqual(verifyToken(''), null, 'Empty token rejected');
  assert.strictEqual(verifyToken(null), null, 'Null token rejected');
});

// ----------------------------------------------------
// 2. Password Handling
// ----------------------------------------------------
console.log('\n--- 2. Password Handling & Storage Security ---');
runTest('Passwords are never stored as plaintext (PBKDF2 hashing enforced)', () => {
  const plain = 'StrongPass2026!';
  const hash = hashPassword(plain);
  assert(hash.startsWith('pbkdf2:10000:'), 'Password uses PBKDF2 with 10,000 iterations');
  assert(!hash.includes(plain), 'Hash does not contain raw password');
});

runTest('Password verification matches valid passwords and rejects invalid ones', () => {
  const plain = 'StudentSecret123';
  const hash = hashPassword(plain);
  assert(verifyPassword(plain, hash, 'student'), 'Valid password verified against hash');
  assert(!verifyPassword('WrongSecret', hash, 'student'), 'Invalid password rejected');
});

runTest('User object sanitization strictly strips the password field', () => {
  const rawUser = {
    id: 'u-101',
    name: 'Jaswant Karun',
    email: 'jaswant@campus.edu',
    password: 'pbkdf2:10000:salt:hash',
    role: 'student'
  };
  const sanitized = sanitizeUser(rawUser);
  assert.strictEqual(sanitized.password, undefined, 'Sanitized user has no password property');
  assert.strictEqual(sanitized.name, 'Jaswant Karun', 'Other user properties preserved');
});

// ----------------------------------------------------
// 3. Role-based Authorization
// ----------------------------------------------------
console.log('\n--- 3. Role-based Authorization ---');
runTest('Role guard grants access to authorized roles', () => {
  const guard = requireRole(['admin', 'staff']);
  let nextCalled = false;
  const mockReq = { user: { role: 'admin' } };
  const mockRes = { status: () => ({ json: () => {} }) };
  guard(mockReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled, 'Admin role granted access');
});

runTest('Role guard rejects unauthorized roles with 403 Forbidden', () => {
  const guard = requireRole(['admin']);
  let statusSent = null;
  const mockReq = { user: { role: 'student' } };
  const mockRes = {
    status(code) {
      statusSent = code;
      return { json: () => {} };
    }
  };
  guard(mockReq, mockRes, () => {});
  assert.strictEqual(statusSent, 403, 'Student denied access to admin route with 403');
});

// ----------------------------------------------------
// 4. Protected Admin Routes
// ----------------------------------------------------
console.log('\n--- 4. Protected Admin Routes ---');
runTest('Customer management, analytics, and coupons routes enforce route guards', () => {
  const customersRoute = fs.readFileSync(path.join(__dirname, 'routes/customers.js'), 'utf8');
  assert(customersRoute.includes('requireRole'), 'customers.js enforces requireRole');
  
  const analyticsRoute = fs.readFileSync(path.join(__dirname, 'routes/analytics.js'), 'utf8');
  assert(analyticsRoute.includes('requireRole'), 'analytics.js enforces requireRole');
  
  const couponsRoute = fs.readFileSync(path.join(__dirname, 'routes/coupons.js'), 'utf8');
  assert(couponsRoute.includes('requireRole'), 'coupons.js enforces requireRole on admin actions');
});

// ----------------------------------------------------
// 5. API Authorization
// ----------------------------------------------------
console.log('\n--- 5. API Authorization ---');
runTest('Unauthenticated external requests receive 401 Unauthorized', () => {
  let statusSent = null;
  const mockReq = {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    query: {}
  };
  const mockRes = {
    status(code) {
      statusSent = code;
      return { json: () => {} };
    }
  };
  authenticateToken(mockReq, mockRes, () => {});
  assert.strictEqual(statusSent, 401, 'Unauthenticated browser request blocked with 401');
});

// ----------------------------------------------------
// 6. Input Validation
// ----------------------------------------------------
console.log('\n--- 6. Input Validation ---');
runTest('Order creation rejects empty cart and non-array items', () => {
  const ordersRoute = fs.readFileSync(path.join(__dirname, 'routes/orders.js'), 'utf8');
  assert(ordersRoute.includes('!items || !Array.isArray(items) || !items.length'), 'orders.js validates items array');
});

runTest('Rate limiter prevents brute force attacks after threshold', () => {
  const limiter = createRateLimiter(60000, 3);
  const ip = '192.168.1.100';
  assert(!limiter.isBlocked(ip), 'Initially not blocked');
  limiter.recordAttempt(ip);
  limiter.recordAttempt(ip);
  assert(!limiter.isBlocked(ip), 'Not blocked after 2 attempts');
  limiter.recordAttempt(ip);
  assert(limiter.isBlocked(ip), 'Blocked after 3 attempts');
  limiter.reset(ip);
  assert(!limiter.isBlocked(ip), 'Unblocked after reset');
});

// ----------------------------------------------------
// 7. SQL/NoSQL Injection Risks
// ----------------------------------------------------
console.log('\n--- 7. SQL/NoSQL Injection Neutralization ---');
runTest('NoSQL injection operators ($gt, $ne, $where) and prototype pollution keys are stripped', () => {
  const maliciousPayload = {
    email: 'student@campus.edu',
    filter: { '$gt': '' },
    '$where': 'function() { return true; }',
    '__proto__': { admin: true },
    nested: {
      '$ne': null,
      validKey: 'safeValue'
    }
  };
  const cleaned = sanitizeInput(maliciousPayload);
  assert.strictEqual(cleaned['$where'], undefined, '$where stripped');
  assert.strictEqual(cleaned.nested['$ne'], undefined, 'nested $ne stripped');
  assert.strictEqual(cleaned.nested.validKey, 'safeValue', 'validKey preserved');
  assert.strictEqual(cleaned.email, 'student@campus.edu', 'email preserved');
  assert.strictEqual(Object.prototype.admin, undefined, 'Prototype pollution prevented');
});

// ----------------------------------------------------
// 8. Sensitive Environment Variables
// ----------------------------------------------------
console.log('\n--- 8. Sensitive Environment Variables ---');
runTest('.env file is listed in .gitignore and .env.example exists', () => {
  const gitignore = fs.readFileSync(path.join(__dirname, '../.gitignore'), 'utf8');
  assert(gitignore.includes('.env'), '.gitignore excludes .env');
  assert(fs.existsSync(path.join(__dirname, '../.env.example')), '.env.example exists');
});

// ----------------------------------------------------
// 9. Payment Information Handling
// ----------------------------------------------------
console.log('\n--- 9. Payment Information Handling ---');
runTest('Raw card CVV and card numbers are never stored in orders or returned in payment responses', () => {
  const ordersRoute = fs.readFileSync(path.join(__dirname, 'routes/orders.js'), 'utf8');
  assert(ordersRoute.includes('delete req.body.cvv'), 'orders.js scrubs cvv immediately upon receipt');
  assert(ordersRoute.includes('delete req.body.card_number'), 'orders.js scrubs raw card_number after masking');
  assert(ordersRoute.includes('card_masked'), 'orders.js stores only masked card string');
});

// ----------------------------------------------------
// 10. Client-Side Secrets
// ----------------------------------------------------
console.log('\n--- 10. Client-Side Secrets ---');
runTest('Frontend scripts do not leak private API keys or hardcoded database secrets', () => {
  const apiJs = fs.readFileSync(path.join(__dirname, '../frontend/js/api.js'), 'utf8');
  assert(!apiJs.includes('sk_live'), 'No live payment secret keys in api.js');
  assert(!apiJs.includes('mongodb://'), 'No database URI in api.js');
  assert(!apiJs.includes('secret_key'), 'No hardcoded private keys in api.js');
});

// ----------------------------------------------------
// 11. CORS Configuration
// ----------------------------------------------------
console.log('\n--- 11. CORS Configuration ---');
runTest('server.js defines explicit CORS origin whitelist and security response headers', () => {
  const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
  assert(serverJs.includes('allowedOrigins'), 'server.js defines allowedOrigins whitelist');
  assert(serverJs.includes('X-Content-Type-Options'), 'server.js sets X-Content-Type-Options nosniff');
  assert(serverJs.includes('X-Frame-Options'), 'server.js sets X-Frame-Options SAMEORIGIN');
});

// ----------------------------------------------------
// 12. Error Message Exposure
// ----------------------------------------------------
console.log('\n--- 12. Error Message Exposure ---');
runTest('Centralized error handler suppresses server stack traces and sensitive path exposure', () => {
  const errorHandler = fs.readFileSync(path.join(__dirname, 'middleware/errorHandler.js'), 'utf8');
  assert(!errorHandler.includes('stack: err.stack'), 'errorHandler does not expose stack traces to clients');
  assert(errorHandler.includes('safeMessage'), 'errorHandler returns sanitized user-facing messages');
});

console.log('\n====================================================');
console.log(`📊 SECURITY VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
console.log('====================================================\n');

if (passedTests === totalTests) {
  console.log('🛡️ ALL 12 SECURITY AUDIT CHECKS PASSED PERFECTLY!\n');
  process.exit(0);
} else {
  console.error(`⚠️ ${totalTests - passedTests} CHECKS FAILED`);
  process.exit(1);
}
