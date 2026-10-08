/**
 * Step 4 - Authentication & Role Management Automated Test Suite
 * Tests all 6 required conditions:
 * 1. Student registration
 * 2. Student login
 * 3. Admin login
 * 4. Invalid login
 * 5. Logout
 * 6. Protected routes (RBAC access checks)
 */

const BASE_URL = 'http://localhost:3000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log("=================================================");
  console.log("   STEP 4 - AUTHENTICATION & ROLE ACCESS TESTS   ");
  console.log("=================================================\n");

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // 1. Student Registration
  // ---------------------------------------------------------------------------
  const testStudentEmail = `test_student_${Date.now()}@campus.edu`;
  console.log("▶ TEST 1: Student Registration");
  const regRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: "Aakash Varma",
      email: testStudentEmail,
      password: "password123",
      phone: "91234 56789",
      role: "student",
      department: "Computer Science & Engineering",
      studentId: "CB-2024-9988"
    })
  });

  if (regRes.status === 201 && regRes.data.success && regRes.data.token && regRes.data.user?.role === 'student') {
    console.log("  ✅ PASS: Student registered successfully with role 'student'");
    console.log(`     User ID: ${regRes.data.user.id}, Welcome Points: ${regRes.data.user.loyalty_points}`);
    console.log(`     Token issued: ${regRes.data.token.substring(0, 30)}...`);
  } else {
    console.error("  ❌ FAIL: Registration failed", regRes);
    allPassed = false;
  }

  // Duplicate registration test (validation)
  const dupRes = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: "Duplicate User",
      email: testStudentEmail,
      password: "password123"
    })
  });
  if (dupRes.status === 400 && !dupRes.data.success) {
    console.log("  ✅ PASS: Duplicate registration properly blocked with 400 Bad Request");
  } else {
    console.error("  ❌ FAIL: Duplicate registration allowed or wrong code", dupRes);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 2. Student Login
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Student Login");
  const studentLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testStudentEmail,
      password: "password123",
      role: "student"
    })
  });

  let studentToken = null;
  if (studentLoginRes.status === 200 && studentLoginRes.data.success && studentLoginRes.data.token) {
    studentToken = studentLoginRes.data.token;
    console.log("  ✅ PASS: Student authenticated successfully");
    console.log(`     Logged in as: ${studentLoginRes.data.user.name} (${studentLoginRes.data.user.role})`);
    console.log(`     Token issued: ${studentToken.substring(0, 30)}...`);
  } else {
    console.error("  ❌ FAIL: Student login failed", studentLoginRes);
    allPassed = false;
  }

  // Also verify seed student login (Jaswant)
  const seedStudentLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'jaswant@campus.edu',
      password: 'student123',
      role: 'student'
    })
  });
  if (seedStudentLogin.status === 200 && seedStudentLogin.data.success) {
    console.log("  ✅ PASS: Seed student account login verified (jaswant@campus.edu)");
  } else {
    console.error("  ❌ FAIL: Seed student account login failed", seedStudentLogin);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 3. Admin Login
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Admin Login");
  const adminLoginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@campusbite.com',
      password: 'admin123',
      role: 'admin'
    })
  });

  let adminToken = null;
  if (adminLoginRes.status === 200 && adminLoginRes.data.success && adminLoginRes.data.user?.role === 'admin') {
    adminToken = adminLoginRes.data.token;
    console.log("  ✅ PASS: Admin authenticated successfully");
    console.log(`     Logged in as: ${adminLoginRes.data.user.name} (Role: ${adminLoginRes.data.user.role})`);
    console.log(`     Token issued: ${adminToken.substring(0, 30)}...`);
  } else {
    console.error("  ❌ FAIL: Admin login failed", adminLoginRes);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 4. Invalid Login (Wrong Password / Unregistered Email)
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Invalid Login");
  const wrongPassRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'jaswant@campus.edu',
      password: 'wrong_password_xyz'
    })
  });

  if (wrongPassRes.status === 401 && !wrongPassRes.data.success) {
    console.log("  ✅ PASS: Wrong password rejected with 401 Unauthorized");
    console.log(`     Message: "${wrongPassRes.data.message}"`);
  } else {
    console.error("  ❌ FAIL: Wrong password did not return 401", wrongPassRes);
    allPassed = false;
  }

  const wrongUserRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'nonexistent_user_999@campus.edu',
      password: 'somepassword'
    })
  });

  if (wrongUserRes.status === 401 && !wrongUserRes.data.success) {
    console.log("  ✅ PASS: Unregistered user rejected with 401 Unauthorized");
    console.log(`     Message: "${wrongUserRes.data.message}"`);
  } else {
    console.error("  ❌ FAIL: Unregistered user did not return 401", wrongUserRes);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 5. Logout
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 5: Logout");
  const logoutRes = await request('/api/auth/logout', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (logoutRes.status === 200 && logoutRes.data.success) {
    console.log("  ✅ PASS: Logout endpoint cleared session cleanly");
    console.log(`     Message: "${logoutRes.data.message}"`);
  } else {
    console.error("  ❌ FAIL: Logout endpoint failed", logoutRes);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 6. Protected Routes & Role-Based Access Control (RBAC)
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 6: Protected Routes & RBAC");

  // 6a. Accessing /api/auth/me without token -> must be 401
  const noTokenMe = await request('/api/auth/me');
  if (noTokenMe.status === 401) {
    console.log("  ✅ PASS: Protected route (/api/auth/me) rejected unauthenticated request with 401");
  } else {
    console.error("  ❌ FAIL: Protected route allowed unauthenticated request", noTokenMe);
    allPassed = false;
  }

  // 6b. Accessing /api/auth/me with valid student token -> must be 200
  const studentMe = await request('/api/auth/me', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (studentMe.status === 200 && studentMe.data.success && studentMe.data.user.email === testStudentEmail) {
    console.log("  ✅ PASS: Protected route (/api/auth/me) succeeded with student token");
    console.log(`     Retrieved profile: ${studentMe.data.user.name} (${studentMe.data.user.department})`);
  } else {
    console.error("  ❌ FAIL: Protected route failed for student", studentMe);
    allPassed = false;
  }

  // 6c. Accessing Admin-only route (/api/auth/admin-check) with STUDENT token -> must be 403 Forbidden!
  const studentOnAdmin = await request('/api/auth/admin-check', {
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (studentOnAdmin.status === 403) {
    console.log("  ✅ PASS: Student blocked from Admin-only endpoint with 403 Forbidden");
    console.log(`     Message: "${studentOnAdmin.data.message}"`);
  } else {
    console.error("  ❌ FAIL: Student was NOT blocked from Admin-only endpoint!", studentOnAdmin);
    allPassed = false;
  }

  // 6d. Accessing Admin-only route (/api/auth/admin-check) with ADMIN token -> must be 200 OK!
  const adminOnAdmin = await request('/api/auth/admin-check', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (adminOnAdmin.status === 200 && adminOnAdmin.data.success) {
    console.log("  ✅ PASS: Admin successfully authorized on Admin-only endpoint with 200 OK");
  } else {
    console.error("  ❌ FAIL: Admin was denied access to Admin-only endpoint!", adminOnAdmin);
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n=================================================");
  if (allPassed) {
    console.log("🎉 ALL STEP 4 AUTHENTICATION & RBAC TESTS PASSED!");
  } else {
    console.log("⚠️ SOME TESTS FAILED!");
  }
  console.log("=================================================");
}

runTests().catch(console.error);
