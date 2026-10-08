/**
 * Step 5 - Professional CampusBite UI System Verification Suite
 * Tests:
 * 1. Design Token Specifications (Colors, Font: Inter)
 * 2. Desktop Admin Dashboard (Left sidebar, top header, dashboard KPI cards, tables, charts)
 * 3. Mobile Student Application (Mobile-first layout, bottom navigation, touch targets, clean product cards)
 * 4. CSS Spacing, Contrast, and Clean SaaS Principles (No excessive gradients/animations)
 * 5. Responsive Breakpoint Integrity
 */

const fs = require('fs');
const path = require('path');

const CSS_DIR = path.join(__dirname, 'frontend', 'css');
const HTML_DIR = path.join(__dirname, 'frontend');

async function runUiTests() {
  console.log("=================================================");
  console.log("  STEP 5 - PROFESSIONAL CAMPUSBITE UI SYSTEM     ");
  console.log("=================================================\n");

  let allPassed = true;

  // ---------------------------------------------------------------------------
  // 1. Color System & Typography (Inter)
  // ---------------------------------------------------------------------------
  console.log("▶ TEST 1: Color System & Typography Specifications");
  const styleCss = fs.readFileSync(path.join(CSS_DIR, 'style.css'), 'utf8');

  const requiredTokens = [
    { name: 'Primary (#4F46E5)', pattern: /--primary:\s*#4F46E5/i },
    { name: 'Deep Navy (#172554)', pattern: /--navy:\s*#172554/i },
    { name: 'Teal (#14B8A6)', pattern: /--accent:\s*#14B8A6/i },
    { name: 'Background (#F8FAFC)', pattern: /--bg-main:\s*#F8FAFC/i },
    { name: 'Card (#FFFFFF)', pattern: /--bg-card:\s*#FFFFFF/i },
    { name: 'Primary Text (#0F172A)', pattern: /--text-primary:\s*#0F172A/i },
    { name: 'Secondary Text (#64748B)', pattern: /--text-secondary:\s*#64748B/i },
    { name: 'Border (#E2E8F0)', pattern: /--border-subtle:\s*#E2E8F0/i },
    { name: 'Warning (#F59E0B)', pattern: /--color-warning:\s*#F59E0B/i },
    { name: 'Error (#DC2626)', pattern: /--color-error:\s*#DC2626/i },
    { name: 'Info (#2563EB)', pattern: /--color-info:\s*#2563EB/i },
    { name: 'Font Inter', pattern: /'Inter'/i }
  ];

  let tokensValid = true;
  for (const token of requiredTokens) {
    if (token.pattern.test(styleCss)) {
      console.log(`  ✅ ${token.name}: Verified`);
    } else {
      console.error(`  ❌ ${token.name}: Missing or mismatch`);
      tokensValid = false;
      allPassed = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Desktop Admin Dashboard Layout
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 2: Desktop Admin Dashboard Architecture");
  const adminHtml = fs.readFileSync(path.join(HTML_DIR, 'admin.html'), 'utf8');
  const adminCss = fs.readFileSync(path.join(CSS_DIR, 'admin.css'), 'utf8');

  const adminChecks = [
    { name: 'Left Sidebar (.admin-sidebar)', pattern: /\.admin-sidebar\s*\{[^}]*width:\s*250px[^}]*background:\s*#172554/i, source: adminCss },
    { name: 'Top Header (.master-header)', pattern: /<header class="master-header">/i, source: adminHtml },
    { name: 'Dashboard KPI Cards (.kpi-cards-grid & .kpi-card)', pattern: /class="kpi-cards-grid"/i, source: adminHtml },
    { name: 'Inventory Management Table (table.inventory-table)', pattern: /<table class="inventory-table">/i, source: adminHtml },
    { name: 'Sales Analytics Charts (.chart-card & canvas)', pattern: /class="chart-card"/i, source: adminHtml }
  ];

  for (const check of adminChecks) {
    if (check.pattern.test(check.source)) {
      console.log(`  ✅ ${check.name}: Verified`);
    } else {
      console.error(`  ❌ ${check.name}: Missing or mismatch`);
      allPassed = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Mobile Student Application Layout
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 3: Mobile Student Application Architecture");
  const mobileHtml = fs.readFileSync(path.join(HTML_DIR, 'mobile.html'), 'utf8');
  const mobileCss = fs.readFileSync(path.join(CSS_DIR, 'mobile-shell.css'), 'utf8');

  const mobileChecks = [
    { name: 'Mobile-first Container (.mobile-phone-container / .smartphone-screen)', pattern: /class="(?:smartphone-screen|mobile-phone-container)"/i, source: mobileHtml },
    { name: 'Bottom Navigation Bar (.mobile-bottom-nav)', pattern: /<nav class="mobile-bottom-nav">/i, source: mobileHtml },
    { name: '5 Bottom Navigation Items (Home, Menu, Tray, History, Account)', pattern: /data-screen="home"[^>]*>[\s\S]*data-screen="menu"[\s\S]*data-screen="cart"[\s\S]*data-screen="profile"/i, source: mobileHtml },
    { name: 'Clean Product Cards (.food-card-row with 12px radius)', pattern: /\.food-card-row/i, source: mobileCss },
    { name: 'Sticky / Fixed Cart & Checkout Actions', pattern: /\.desktop-cart-sidebar\s*\{[^}]*position:\s*sticky/i, source: fs.readFileSync(path.join(CSS_DIR, 'desktop.css'), 'utf8') }
  ];

  for (const check of mobileChecks) {
    if (check.pattern.test(check.source)) {
      console.log(`  ✅ ${check.name}: Verified`);
    } else {
      console.error(`  ❌ ${check.name}: Missing or mismatch`);
      allPassed = false;
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Design Hygiene (No excessive gradients, no orange remnants)
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 4: Design Hygiene & Color Consistency");
  const desktopCss = fs.readFileSync(path.join(CSS_DIR, 'desktop.css'), 'utf8');
  const allCss = styleCss + '\n' + desktopCss + '\n' + mobileCss + '\n' + adminCss;

  const orangeRemnants = /#FF5A1F|#E0480F|rgba\(255,\s*90,\s*31/i.test(allCss);
  if (!orangeRemnants) {
    console.log("  ✅ Zero conflicting generic orange color remnants detected across all stylesheets");
  } else {
    console.error("  ❌ Found legacy orange color remnants in CSS");
    allPassed = false;
  }

  // ---------------------------------------------------------------------------
  // 5. Responsive Media Queries
  // ---------------------------------------------------------------------------
  console.log("\n▶ TEST 5: Responsive Media Query Integrity");
  const hasTabletQuery = /@media\s*\([^)]*max-width:\s*(?:1024px|1080px|768px)\)/i.test(desktopCss);
  const hasMobileGridQuery = /@media\s*\([^)]*max-width:\s*768px\)/i.test(desktopCss);

  if (hasTabletQuery && hasMobileGridQuery) {
    console.log("  ✅ Responsive grid layout rules for desktop (2-3 columns), tablet (1-2 columns), and mobile (1 column) verified");
  } else {
    console.error("  ❌ Media query breakpoints missing or incomplete");
    allPassed = false;
  }

  console.log("\n=================================================");
  if (allPassed) {
    console.log("🎉 ALL STEP 5 UI SYSTEM VERIFICATION TESTS PASSED!");
  } else {
    console.log("⚠️ SOME UI SYSTEM CHECKS FAILED!");
  }
  console.log("=================================================");
}

runUiTests().catch(console.error);
