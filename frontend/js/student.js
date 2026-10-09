/**
 * CampusBite - Student App Controller
 * With Enhanced Motion Intro, Advanced Auth, Crowding Meter, Digital Wallet & Customizations
 */

const StudentApp = {
  currentUser: {
    id: "u-101",
    name: "Jaswant Karun",
    email: "jaswant@campus.edu",
    phone: "87541 59344",
    role: "student",
    studentId: "CB-2024-2028",
    department: "Computer Science & Business Systems",
    loyalty_points: 420,
    wallet_balance: 850,
    avatar: "JK"
  },

  selectedAuthRole: 'student',
  currentAuthTab: 'signin',
  cart: [],
  appliedCoupon: null,
  redeemLoyalty: false,
  selectedPickupSlot: "12:00 PM – 12:15 PM",
  selectedPaymentMethod: "UPI",
  isPlacingOrder: false,
  currentTrackOrderId: "CB1024",
  products: [],
  customizingProduct: null,
  currentDetailProduct: null,
  currentDetailQty: 1,
  currentDietFilter: 'all',
  currentStall: 'all',
  currentCategory: 'All',
  kineticWords: [
    "Hot Fresh Meals",
    "2-Minute Break Bites",
    "Group Bench Pooling",
    "Zero-Wait Pickup",
    "Chef-Crafted Campus Fuel"
  ],
  kineticIndex: 0,
  kineticTimer: null,

  productPhotos: {
    'p-1': 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=320&q=80',
    'p-2': 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=320&q=80',
    'p-3': 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=320&q=80',
    'p-4': 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=320&q=80',
    'p-5': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=320&q=80',
    'p-6': 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=320&q=80',
    'p-7': 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=320&q=80',
    'p-8': 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&w=320&q=80',
    'p-9': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=320&q=80',
    'p-10': 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=320&q=80',
    'p-11': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=320&q=80',
    'p-12': 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=320&q=80',
    'p-13': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=320&q=80',
    'p-14': 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=320&q=80',
    'p-15': 'https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=320&q=80',
    'p-16': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=320&q=80'
  },
  groupPoolMembers: [
    { name: "Jaswant Karun (You • Host)", avatar: "JK", item: "Classic Veg Burger", price: 80 },
    { name: "Priya Sundaram (Desk 2)", avatar: "PS", item: "Cold Coffee with Ice Cream", price: 70 },
    { name: "Rahul Verma (Desk 3)", avatar: "RV", item: "Veg Grilled Sandwich", price: 60 }
  ],

  profiles: [
    {
      id: "u-101",
      name: "Jaswant Karun",
      email: "jaswant@campus.edu",
      alternate_email: "24cb023@kpriet.ac.in",
      phone: "87541 59344",
      role: "student",
      studentId: "CB-2024-2028",
      department: "Computer Science & Business Systems",
      loyalty_points: 429,
      wallet_balance: 850,
      avatar: "JK"
    },
    {
      id: "u-102",
      name: "Dr. Priya Sundaram",
      email: "priya.sundaram@campus.edu",
      phone: "98401 22334",
      role: "faculty",
      studentId: "FAC-8821",
      department: "School of Management & Business",
      loyalty_points: 890,
      wallet_balance: 1450,
      avatar: "PS"
    },
    {
      id: "u-103",
      name: "Karthik Raman",
      email: "karthik.raman@campus.edu",
      phone: "97911 55667",
      role: "staff",
      studentId: "STF-4402",
      department: "Central Library & Lab Administration",
      loyalty_points: 180,
      wallet_balance: 320,
      avatar: "KR"
    },
    {
      id: "u-admin",
      name: "Ramesh Canteen Manager",
      email: "admin@campusbite.com",
      phone: "+91 98765 00000",
      role: "admin",
      studentId: "ADM-001",
      department: "Campus Hospitality & Dining",
      loyalty_points: 2500,
      wallet_balance: 5000,
      avatar: "RC"
    }
  ],

  init() {
    this.initTheme();
    try {
      const savedUser = localStorage.getItem('campusbite_user');
      if (savedUser) {
        this.currentUser = { ...this.currentUser, ...JSON.parse(savedUser) };
      }
    } catch (e) {}

    this.loadCartFromSession();
    this.bindEvents();
    this.loadProducts();
    this.updateCartBadge();
    this.updateCartShortcutBanner();
    this.refreshUserLoyalty();
    this.updateWalletUI();
    this.updateUserInterfaceDetails();
    this.renderDesktopCart();
    this.initKineticTypography();
  },

  initTheme() {
    const savedTheme = localStorage.getItem('campusbite_theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = savedTheme === 'dark' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light';
    }
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('campusbite_theme', next);
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.innerHTML = next === 'dark' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> Dark' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> Light';
    }
    App.showToast(`Switched to ${next.toUpperCase()} theme`, 'info');
  },

  openProfileSwitcherModal() {
    App.openModal('profile-switcher-modal');
  },

  switchProfileById(profileId) {
    const target = this.profiles.find(p => p.id === profileId);
    if (!target) return;
    this.currentUser = { ...target };
    localStorage.setItem('campusbite_user', JSON.stringify(this.currentUser));
    this.updateUserInterfaceDetails();
    this.updateWalletUI();
    this.refreshUserLoyalty();
    this.renderDesktopCart();
    App.closeModal('profile-switcher-modal');

    if (target.role === 'admin') {
      App.showToast(`Switched to ${target.name} (Admin Mode)`, 'success');
      App.switchViewMode('admin');
    } else {
      App.showToast(`Switched active profile to ${target.name} (${target.role.toUpperCase()})`, 'success');
      this.navigateTo('home');
    }
  },

  openLoyaltyStoreModal() {
    const ptsEl = document.getElementById('store-active-points');
    if (ptsEl) ptsEl.textContent = `${this.currentUser.loyalty_points || 429} Points`;
    App.openModal('rewards-store-modal');
  },

  claimRewardVoucher(pointsCost, couponCode, discountAmount) {
    const currentPts = this.currentUser.loyalty_points || 0;
    if (currentPts < pointsCost) {
      App.showToast(`Insufficient loyalty points! You need ${pointsCost} pts (Current: ${currentPts} pts).`, 'warning');
      return;
    }
    this.currentUser.loyalty_points -= pointsCost;
    localStorage.setItem('campusbite_user', JSON.stringify(this.currentUser));
    this.refreshUserLoyalty();
    this.updateUserInterfaceDetails();

    // Auto-apply this claimed coupon
    this.applyCouponCode(couponCode);
    const couponInput = document.getElementById('desktop-sidebar-coupon-input');
    if (couponInput) couponInput.value = couponCode;

    App.closeModal('rewards-store-modal');
    App.showToast(`Reward Claimed: ₹${discountAmount} voucher applied to your meal tray.`, 'success');
  },

  openCustomerReviewModal() {
    App.openModal('customer-review-modal');
  },

  filterByDiet(dietType, btn) {
    this.currentDietFilter = dietType;
    if (btn) {
      document.querySelectorAll('.diet-chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
    }
    this.applyCombinedFilters();
  },

  bindEvents() {
    // Bottom nav tabs (mobile)
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.dataset.screen;
        if (targetScreen) {
          this.navigateTo(targetScreen);
        }
      });
    });

    // Desktop nav buttons
    document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetScreen = btn.dataset.screen;
        if (targetScreen) {
          this.navigateTo(targetScreen);
        }
      });
    });

    // Category chips
    document.querySelectorAll('#home-category-chips .cat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#home-category-chips .cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.category;
        this.filterProducts(cat);
      });
    });

    // Search input (Home & Menu Catalogue)
    const searchInput = document.getElementById('student-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchProducts(e.target.value);
      });
    }

    const menuSearchInput = document.getElementById('menu-search-input');
    if (menuSearchInput) {
      menuSearchInput.addEventListener('input', (e) => {
        this.searchProducts(e.target.value);
      });
    }

    // Veg-only filter checkbox
    const vegFilter = document.getElementById('veg-only-filter');
    if (vegFilter) {
      vegFilter.addEventListener('change', (e) => {
        this.toggleVegFilter(e.target.checked);
      });
    }

    // Pickup slot pills
    document.querySelectorAll('.pickup-slot-grid .slot-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.pickup-slot-grid .slot-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.selectedPickupSlot = pill.dataset.slot;
      });
    });

    // Payment method pills
    document.querySelectorAll('.payment-options-list .payment-method-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.payment-options-list .payment-method-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedPaymentMethod = card.dataset.method;
      });
    });
  },

  filterDiet(dietType) {
    this.navigateTo('home');
    const chip = document.querySelector(`.diet-chip[data-diet="${dietType}"]`);
    this.filterByDiet(dietType, chip);
    const catRow = document.getElementById('home-category-chips');
    if (catRow) catRow.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  navigateTo(screenId) {
    document.querySelectorAll('.mob-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    if (screenId === 'menu') {
      this.renderMenuList(this.products);
      this.renderCategoryChips();
    }

    // Update bottom nav highlighting (mobile)
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    // Update desktop nav buttons
    document.querySelectorAll('.desktop-nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.screen === screenId);
    });

    // Bottom nav visibility: ONLY on small/mobile screens, NEVER on desktop website
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
      if (['motion-splash', 'login'].includes(screenId)) {
        bottomNav.style.display = 'none';
      } else if (window.innerWidth <= 768) {
        bottomNav.style.display = 'flex';
      } else {
        bottomNav.style.display = 'none';
      }
    }

    // Toggle Desktop Hero & Desktop 2-column Main Grid visibility
    const desktopHero = document.querySelector('.desktop-hero-banner');
    const desktopGrid = document.querySelector('.desktop-main-grid');
    if (desktopHero && desktopGrid) {
      if (['motion-splash', 'login'].includes(screenId)) {
        desktopHero.style.display = 'none';
        desktopGrid.style.display = 'none';
      } else if (screenId === 'home') {
        desktopHero.style.display = 'flex';
        desktopGrid.style.display = 'grid';
      } else {
        desktopHero.style.display = 'none';
        desktopGrid.style.display = 'none';
      }
    }

    if (screenId === 'cart') {
      this.renderCart();
    } else if (screenId === 'checkout') {
      this.renderCheckout();
    } else if (screenId === 'profile') {
      this.renderProfile();
    } else if (screenId === 'tracking') {
      this.renderTracking(this.currentTrackOrderId);
    } else if (screenId === 'wallet') {
      this.updateWalletUI();
    }

    this.renderDesktopCart();
    this.updateCartShortcutBanner();
  },

  // ==========================================
  // Auth & Role Handlers
  // ==========================================
  switchAuthTab(tab) {
    this.currentAuthTab = tab;
    document.querySelectorAll('.auth-segmented-nav .segmented-tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    const submitBtn = document.getElementById('auth-submit-btn');
    const registerFields = document.getElementById('auth-register-extra-fields');

    if (tab === 'signup') {
      if (submitBtn) submitBtn.innerHTML = '<span>Create Student Account</span> <span class="arrow-motion">→</span>';
      if (registerFields) registerFields.style.display = 'block';
    } else {
      if (submitBtn) submitBtn.innerHTML = '<span>Sign In to CampusBite</span> <span class="arrow-motion">→</span>';
      if (registerFields) registerFields.style.display = 'none';
    }
  },

  selectAuthRole(role) {
    this.selectedAuthRole = role;
    document.querySelectorAll('.role-pills-row .role-pill-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });

    const emailInput = document.getElementById('auth-email-input');
    if (role === 'student' && emailInput) {
      emailInput.value = 'jaswant@campus.edu';
    } else if (role === 'staff' && emailInput) {
      emailInput.value = 'kitchen@campusbite.com';
    } else if (role === 'admin' && emailInput) {
      emailInput.value = 'admin@campusbite.com';
    }
  },

  togglePasswordVisibility() {
    const pwdInput = document.getElementById('auth-password-input');
    const icon = document.getElementById('pwd-toggle-icon');
    if (pwdInput) {
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        if (icon) icon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
      } else {
        pwdInput.type = 'password';
        if (icon) icon.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      }
    }
  },

  async handleAuthSubmit() {
    const emailInput = document.getElementById('auth-email-input') || document.getElementById('auth-email');
    const email = (emailInput?.value || '').trim();
    const pwdInput = document.getElementById('auth-password-input') || document.getElementById('auth-password');
    const password = (pwdInput?.value || '').trim();
    const submitBtn = document.getElementById('auth-submit-btn');

    if (!email) {
      App.showToast('Please enter your campus email or phone', 'warning');
      return;
    }
    if (!password) {
      App.showToast('Please enter your password', 'warning');
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Authenticating...</span>';
    }

    try {
      let res;
      if (this.currentAuthTab === 'signup') {
        const nameInput = document.getElementById('auth-name-input') || document.getElementById('auth-name');
        const name = (nameInput?.value || 'Campus Student').trim();
        const deptInput = document.getElementById('auth-dept-input') || document.getElementById('auth-dept');
        const dept = (deptInput?.value || 'Computer Science & Business Systems').trim();
        const studentIdInput = document.getElementById('auth-student-id');
        const studentId = (studentIdInput?.value || ('CB-2024-' + Math.floor(1000 + Math.random() * 9000))).trim();

        res = await window.api.register({
          name,
          email,
          password,
          phone: "87541 59344",
          role: this.selectedAuthRole,
          department: dept,
          studentId
        });
      } else {
        res = await window.api.login({
          email,
          password,
          role: this.selectedAuthRole
        });
      }

      if (res && res.success && res.user) {
        this.currentUser = {
          ...this.currentUser,
          ...res.user
        };

        if (res.token) {
          localStorage.setItem('campusbite_token', res.token);
        }
        try {
          localStorage.setItem('campusbite_user', JSON.stringify(this.currentUser));
        } catch (e) {}

        this.updateUserInterfaceDetails();
        App.showToast(`Welcome, ${res.user.name}! Signed in successfully.`, 'success');

        if (res.user.role === 'admin' || this.selectedAuthRole === 'admin') {
          App.switchViewMode('admin');
        } else {
          this.navigateTo('home');
        }
      } else {
        App.showToast((res && res.message) || 'Authentication failed. Please check credentials.', 'error');
      }
    } catch (e) {
      console.warn("Auth error:", e);
      const errMsg = (e.data && e.data.message) || e.message || 'Invalid credentials or user not found.';
      App.showToast(errMsg, 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = this.currentAuthTab === 'signup' 
          ? '<span>Create Student Account</span> <span class="arrow-motion">→</span>'
          : '<span>Sign In to CampusBite</span> <span class="arrow-motion">→</span>';
      }
    }
  },

  async quickLogin(role, email) {
    this.selectAuthRole(role);
    const emailInput = document.getElementById('auth-email-input') || document.getElementById('auth-email');
    if (emailInput) emailInput.value = email;

    const pwd = role === 'admin' ? 'admin123' : (role === 'student' ? 'student123' : 'password123');
    const pwdInput = document.getElementById('auth-password-input') || document.getElementById('auth-password');
    if (pwdInput) pwdInput.value = pwd;

    try {
      const res = await window.api.login({ email, password: pwd, role });
      if (res && res.success && res.user) {
        this.currentUser = { ...this.currentUser, ...res.user };
        if (res.token) {
          localStorage.setItem('campusbite_token', res.token);
        }
        try { localStorage.setItem('campusbite_user', JSON.stringify(this.currentUser)); } catch (e) {}
        this.updateUserInterfaceDetails();

        if (role === 'admin') {
          App.showToast('Logged in as Ramesh (Canteen Manager)', 'success');
          App.switchViewMode('admin');
        } else {
          App.showToast(`Logged in as ${res.user.name} (${role.toUpperCase()})`, 'success');
          this.navigateTo('home');
        }
      } else {
        App.showToast((res && res.message) || 'Quick login failed', 'error');
      }
    } catch (e) {
      console.warn("Quick login failed:", e);
      const errMsg = (e.data && e.data.message) || e.message || 'Quick login failed';
      App.showToast(errMsg, 'error');
    }
  },

  async logout() {
    try {
      if (window.api && window.api.logout) {
        await window.api.logout();
      }
    } catch (e) {
      console.warn("Logout error:", e);
    }
    localStorage.removeItem('campusbite_token');
    localStorage.removeItem('campusbite_user');
    this.currentUser = {
      id: null,
      name: "Guest Student",
      email: "",
      phone: "",
      role: "student",
      studentId: "",
      department: "",
      loyalty_points: 0,
      wallet_balance: 0,
      avatar: "GS"
    };
    this.cart = [];
    this.renderDesktopCart();
    this.updateUserInterfaceDetails();
    if (window.App) {
      window.App.showToast('You have been logged out.', 'info');
    }
    this.navigateTo('login');
  },

  updateUserInterfaceDetails() {
    // 1. Home screen greeting
    const greetingEl = document.querySelector('.user-greeting h3');
    if (greetingEl) {
      const firstName = (this.currentUser.name || 'Jaswant').split(' ')[0];
      greetingEl.textContent = `Welcome, ${firstName}`;
    }

    // 2. Topbar user pill
    const topPillName = document.getElementById('topbar-user-name');
    if (topPillName) {
      topPillName.textContent = this.currentUser.name;
    }
    const topPillId = document.getElementById('topbar-user-id');
    if (topPillId && this.currentUser.studentId) {
      topPillId.textContent = `${this.currentUser.studentId} • ${this.currentUser.department ? this.currentUser.department.split(' ')[0] : 'CSBS'}`;
    }

    // 3. Profile screen
    const profName = document.getElementById('profile-user-name');
    if (profName) profName.textContent = this.currentUser.name;
    const profId = document.getElementById('profile-user-id');
    if (profId) profId.textContent = `${this.currentUser.studentId || 'CB-2024-2028'} • ${this.currentUser.department || 'Computer Science & Business Systems'}`;
    const profPhone = document.getElementById('profile-user-phone');
    if (profPhone) profPhone.textContent = `${this.currentUser.phone || '87541 59344'}`;

    // 4. Wallet Card
    this.updateWalletUI();
  },

  // Desktop cart synchronization
  renderDesktopCart() {
    const container = document.getElementById('desktop-sidebar-cart-items');
    const badge = document.getElementById('desktop-sidebar-cart-count');
    const quickBtn = document.getElementById('desktop-nav-cart-btn-text');
    const subtotalEl = document.getElementById('desktop-sidebar-subtotal');
    const discountEl = document.getElementById('desktop-sidebar-discount');
    const discountRow = document.getElementById('desktop-sidebar-discount-row');
    const totalEl = document.getElementById('desktop-sidebar-total');
    const checkoutBtn = document.getElementById('desktop-sidebar-checkout-btn');

    const totalQty = this.cart.reduce((s, i) => s + i.quantity, 0);
    if (badge) badge.textContent = `${totalQty} Item${totalQty === 1 ? '' : 's'}`;
    if (quickBtn) quickBtn.textContent = `Cart (${totalQty})`;

    const { subtotal, couponDiscount, loyaltyDiscount, facultyDiscount, total } = this.calculateCartBill();

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (discountEl && discountRow) {
      const totalDisc = couponDiscount + loyaltyDiscount + (facultyDiscount || 0);
      if (totalDisc > 0) {
        discountRow.style.display = 'flex';
        discountEl.style.color = '#10B981';
        discountEl.textContent = `-₹${totalDisc}${facultyDiscount > 0 ? ' (10% Faculty Subsidy)' : ''}`;
      } else if (this.appliedCoupon && subtotal > 0 && subtotal < (this.appliedCoupon.minimum_order || 0)) {
        discountRow.style.display = 'flex';
        discountEl.style.color = '#F59E0B';
        discountEl.textContent = `Add ₹${this.appliedCoupon.minimum_order - subtotal} for ${this.appliedCoupon.code}`;
      } else {
        discountRow.style.display = 'none';
      }
    }
    if (totalEl) totalEl.textContent = `₹${total}`;
    if (checkoutBtn) {
      checkoutBtn.textContent = totalQty > 0 ? `Checkout (₹${total}) →` : 'Cart is Empty';
      checkoutBtn.disabled = totalQty === 0;
    }

    if (!container) return;
    if (!this.cart.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:24px 10px;color:#94A3B8;">
          <span style="display:inline-block;margin-bottom:6px;"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg></span>
          <div style="font-size:12.5px;font-weight:600;">Your tray is empty</div>
          <div style="font-size:11px;color:#64748B;margin-top:2px;">Add delicious campus meals from the menu</div>
        </div>
      `;
      return;
    }

    container.innerHTML = this.cart.map(item => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="avatar-monogram sm" style="width:22px;height:22px;font-size:10px;">${item.name.substring(0, 2).toUpperCase()}</span>
          <div>
            <div style="font-size:12.5px;font-weight:700;color:#F8FAFC;">${item.name}</div>
            <div style="font-size:11px;color:#94A3B8;">₹${item.price} × ${item.quantity}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <button class="stepper-btn" onclick="StudentApp.decrementCart('${item.productId}')" style="width:24px;height:24px;border-radius:6px;font-size:12px;" title="Decrease quantity">-</button>
          <span style="font-size:12px;font-weight:700;color:white;">${item.quantity}</span>
          <button class="stepper-btn" onclick="StudentApp.addToCart('${item.productId}')" style="width:24px;height:24px;border-radius:6px;font-size:12px;" title="Increase quantity">+</button>
          <button onclick="StudentApp.removeFromCart('${item.productId}')" style="background:transparent;border:none;color:#94A3B8;cursor:pointer;padding:2px 4px;font-size:12px;margin-left:2px;" title="Remove item">✕</button>
        </div>
      </div>
    `).join('');
  },

  applyHeroCoupon() {
    const input = document.getElementById('hero-combo-coupon-input');
    const code = input ? input.value.trim() : 'CAMPUS20';
    if (!code) {
      App.showToast('Please type a coupon code (e.g. CAMPUS20)', 'warning');
      return;
    }
    this.applyCouponCode(code);
  },

  applyDesktopCoupon() {
    const input = document.getElementById('desktop-sidebar-coupon-input');
    const code = input ? input.value.trim() : '';
    if (!code) {
      App.showToast('Please enter coupon code', 'warning');
      return;
    }
    this.applyCouponCode(code);
    this.renderDesktopCart();
  },

  syncActiveView() {
    this.updateUserInterfaceDetails();
    this.renderDesktopCart();
    this.updateCartBadge();
  },

  // ==========================================
  // Product Catalog & Customization
  // ==========================================
  async loadProducts() {
    try {
      // 1. Load Categories from Real DB
      try {
        const catRes = await window.api.getCategories();
        if (catRes && catRes.categories) {
          this.categories = catRes.categories;
        }
      } catch (e) {
        console.warn("Categories fetch fallback:", e);
      }

      // 2. Load Coupons from Real DB
      try {
        const coupRes = await window.api.getCoupons();
        if (coupRes && coupRes.coupons) {
          this.coupons = coupRes.coupons;
        }
      } catch (e) {
        console.warn("Coupons fetch fallback:", e);
      }

      // 3. Load Products from Real DB
      const data = await window.api.getProducts();
      if (data && data.products) {
        this.products = data.products;
      }
    } catch (e) {
      console.warn("Using cached products", e);
    }

    // Render all elements
    this.renderCategoryChips();
    this.renderFeaturedItems();
    this.renderPopularItems();
    this.renderOffersSection();
    this.renderMenuList(this.products);
    this.checkActiveOrder();
    this.updateCartShortcutBanner();
  },

  renderCategoryChips() {
    const homeCats = document.getElementById('home-category-chips');
    const menuCats = document.getElementById('menu-category-chips');
    
    const categories = this.categories && this.categories.length ? this.categories : [
      { id: 'cat-1', name: 'Snacks', icon: '🥪' },
      { id: 'cat-2', name: 'Drinks', icon: '🥤' },
      { id: 'cat-3', name: 'Meals', icon: '🍛' },
      { id: 'cat-4', name: 'Healthy', icon: '🥗' },
      { id: 'cat-5', name: 'Desserts', icon: '🍨' }
    ];

    const generateChipsHtml = () => `
      <button class="cat-chip ${this.currentCategory === 'All' ? 'active' : ''}" data-category="All" onclick="StudentApp.filterProducts('All', this)">
        <span>✨</span> All Categories (${this.products.length})
      </button>
      ${categories.map(c => {
        const count = this.products.filter(p => p.category && p.category.toLowerCase() === c.name.toLowerCase()).length;
        const active = this.currentCategory.toLowerCase() === c.name.toLowerCase() ? 'active' : '';
        return `
          <button class="cat-chip ${active}" data-category="${c.name}" onclick="StudentApp.filterProducts('${c.name}', this)">
            <span>${c.icon || '🍽️'}</span> ${c.name} (${count})
          </button>
        `;
      }).join('')}
    `;

    if (homeCats) homeCats.innerHTML = generateChipsHtml();
    if (menuCats) menuCats.innerHTML = generateChipsHtml();
  },

  renderFeaturedItems() {
    const container = document.getElementById('home-featured-container');
    if (!container) return;

    let featured = this.products.filter(p => p.featured);
    if (!featured.length) {
      const highlightIds = ['p-2', 'p-9', 'p-6', 'p-15', 'p-11'];
      featured = this.products.filter(p => highlightIds.includes(p.id));
      if (!featured.length) featured = this.products.slice(0, 4);
    }

    container.innerHTML = featured.map(item => {
      const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock <= 0);
      const photoUrl = this.productPhotos[item.id] || item.image_url;
      const inCart = this.cart.find(c => c.productId === item.id);
      const qty = inCart ? inCart.quantity : 0;

      return `
        <div class="featured-food-card" onclick="StudentApp.openProductDetails('${item.id}')">
          <div class="featured-card-img-wrap">
            ${photoUrl ? `
              <img src="${photoUrl}" alt="${item.name}" class="featured-card-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div class="food-emoji-fallback" style="display:none;font-size:24px;align-items:center;justify-content:center;height:100%;">${item.image_emoji || '🍱'}</div>
            ` : `
              <div class="food-emoji-fallback" style="display:flex;font-size:24px;align-items:center;justify-content:center;height:100%;">${item.image_emoji || '🍱'}</div>
            `}
            <span class="${item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}" style="position:absolute;top:8px;left:8px;" title="${item.is_veg ? 'Pure Veg' : 'Non-Veg'}"></span>
            <div style="position:absolute;top:8px;right:8px;">
              ${isOutOfStock ? `
                <span class="stock-badge out-of-stock">✕ Sold Out</span>
              ` : `
                <span class="stock-badge in-stock">● In Stock</span>
              `}
            </div>
          </div>
          <div class="featured-card-content">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
              <strong style="font-size:13.5px;color:var(--text-primary);line-height:1.3;">${item.name}</strong>
              <span style="font-size:11px;color:#D97706;font-weight:700;white-space:nowrap;margin-left:6px;">⭐ ${item.rating || 4.8}</span>
            </div>
            <p style="font-size:11px;color:var(--text-secondary);margin:0 0 8px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">
              ${item.description}
            </p>
            <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid #F1F5F9;">
              <span style="font-size:14px;font-weight:800;color:var(--text-primary);">₹${item.price}</span>
              ${isOutOfStock ? `
                <button class="add-mini-btn sold-out" disabled style="padding:4px 10px;font-size:11px;">Sold Out</button>
              ` : (qty > 0 ? `
                <span style="font-size:11.5px;font-weight:700;color:var(--primary);">${qty} in Tray</span>
              ` : `
                <button class="add-mini-btn" style="padding:5px 12px;font-size:11.5px;" onclick="event.stopPropagation(); StudentApp.addToCart('${item.id}')">+ Add</button>
              `)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderPopularItems() {
    const container = document.getElementById('home-popular-container');
    if (!container) return;

    const popular = this.products.filter(p => p.popular).slice(0, 5);
    container.innerHTML = popular.map(item => {
      const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock <= 0);
      return `
        <div class="popular-food-card" onclick="StudentApp.openProductDetails('${item.id}')">
          <div class="popular-card-emoji">${item.image_emoji || '🍱'}</div>
          <div class="popular-card-name">${item.name}</div>
          <div class="popular-card-price">₹${item.price}</div>
          ${isOutOfStock ? `
            <button class="add-mini-btn sold-out" disabled style="padding:3px 8px;font-size:10.5px;cursor:not-allowed;">Sold Out</button>
          ` : `
            <button class="add-mini-btn" onclick="event.stopPropagation(); StudentApp.addToCart('${item.id}')">
              + Add
            </button>
          `}
        </div>
      `;
    }).join('');
  },

  renderOffersSection() {
    const container = document.getElementById('home-offers-container');
    if (!container) return;

    const coupons = this.coupons && this.coupons.length ? this.coupons : [
      { code: 'CAMPUS20', description: '20% OFF on Canteen Combo & Meals', minimum_order: 100, badge: '🔥 Today\'s Best Offer' },
      { code: 'STUDENT10', description: '10% Student special discount on any order', minimum_order: 50, badge: '⭐ Everyday Saver' },
      { code: 'EXAMSNACK', description: 'Flat ₹25 OFF during study break hours', minimum_order: 150, badge: '📚 Study Hours' },
      { code: 'SNACK15', description: '15% OFF on Sandwiches & Rolls', minimum_order: 40, badge: '🥪 Wheel Perk' }
    ];

    container.innerHTML = coupons.map(c => `
      <div class="offer-coupon-card">
        <div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span class="offer-coupon-badge">${c.code}</span>
            <span style="font-size:10px;color:#10B981;font-weight:700;">${c.badge || 'Active Offer'}</span>
          </div>
          <div style="font-size:12.5px;font-weight:700;color:var(--text-primary);margin-bottom:4px;">
            ${c.description}
          </div>
          <div style="font-size:11px;color:var(--text-secondary);">
            Min order: ₹${c.minimum_order || 50}
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px dashed #E2E8F0;">
          <span style="font-size:10.5px;color:#94A3B8;">1-Tap Apply</span>
          <button class="btn-primary" style="padding:5px 12px;font-size:11px;font-weight:700;border-radius:999px;" onclick="StudentApp.applyCouponCode('${c.code}')">
            Apply Code
          </button>
        </div>
      </div>
    `).join('');
  },

  async checkActiveOrder() {
    const banner = document.getElementById('home-active-order-banner');
    if (!banner) return;

    try {
      const ordersRes = await window.api.getOrders();
      if (ordersRes && ordersRes.orders && ordersRes.orders.length) {
        const activeStatuses = ['PLACED', 'CONFIRMED', 'PREPARING', 'READY', 'Placed', 'Confirmed', 'Preparing', 'Ready'];
        const activeOrder = ordersRes.orders.find(o => 
          activeStatuses.includes(o.order_status || o.status)
        );

        if (activeOrder) {
          this.currentTrackOrderId = activeOrder.id;
          const orderIdEl = document.getElementById('home-active-order-id');
          const statusEl = document.getElementById('home-active-order-status');
          const slotEl = document.getElementById('home-active-order-slot');

          if (orderIdEl) orderIdEl.textContent = `Order #${activeOrder.id}`;
          if (statusEl) {
            statusEl.textContent = activeOrder.order_status || activeOrder.status || 'Preparing';
            statusEl.className = 'stock-badge in-stock';
          }
          if (slotEl) {
            slotEl.textContent = `Pickup Window: ${activeOrder.pickup_slot || '12:30 PM – 12:40 PM'} (Counter 2)`;
          }
          banner.style.display = 'flex';
          return;
        }
      }
    } catch (e) {
      console.warn("Check active order notice:", e);
    }

    if (this.currentTrackOrderId === 'CB1024') {
      banner.style.display = 'flex';
    } else {
      banner.style.display = 'none';
    }
  },

  updateCartShortcutBanner() {
    const banner = document.getElementById('home-cart-shortcut-banner');
    if (!banner) return;

    const totalCount = this.cart.reduce((s, i) => s + i.quantity, 0);
    const { total } = this.calculateCartBill();

    if (totalCount > 0) {
      banner.style.display = 'flex';
      const countEl = document.getElementById('home-cart-shortcut-count');
      const totalEl = document.getElementById('home-cart-shortcut-total');
      if (countEl) countEl.textContent = `Tray: ${totalCount} Item${totalCount === 1 ? '' : 's'}`;
      if (totalEl) totalEl.textContent = `Total: ₹${total}`;
    } else {
      banner.style.display = 'none';
    }
  },

  renderMenuList(itemsToRender) {
    const homeContainer = document.getElementById('menu-items-container');
    const fullContainer = document.getElementById('full-menu-items-container');
    const countBadge = document.getElementById('menu-items-count-badge');
    if (countBadge) {
      countBadge.textContent = `${itemsToRender.length} Dishes Available`;
    }

    const renderHtml = (items) => {
      if (!items.length) {
        return `
          <div style="grid-column: 1 / -1; text-align:center;padding:40px 20px;color:#94A3B8;">
            <div style="margin-bottom:8px;"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></div>
            <p style="font-weight:600;font-size:14px;color:var(--text-primary);">No dishes found</p>
            <p style="font-size:12px;color:var(--text-secondary);margin-top:4px;">Try searching with different keywords or reset category filters.</p>
          </div>
        `;
      }

      return items.map(item => {
        const inCart = this.cart.find(c => c.productId === item.id);
        const qty = inCart ? inCart.quantity : 0;
        const photoUrl = this.productPhotos[item.id] || item.image_url;
        const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock <= 0);

        return `
          <div class="food-card-row" onclick="StudentApp.openProductDetails('${item.id}')" data-product-id="${item.id}">
            <div class="food-photo-wrap">
              ${photoUrl ? `
                <img src="${photoUrl}" alt="${item.name}" class="food-card-img" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="food-emoji-fallback" style="display:none;font-size:14px;font-weight:800;color:var(--text-muted);">${item.name.substring(0, 2).toUpperCase()}</div>
              ` : `
                <div class="food-emoji-fallback" style="font-size:14px;font-weight:800;color:var(--text-muted);">${item.name.substring(0, 2).toUpperCase()}</div>
              `}
              <span class="${item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}" title="${item.is_veg ? 'Pure Vegetarian' : 'Non-Vegetarian'}"></span>
            </div>
            <div class="food-info-col" style="flex:1;">
              <div class="food-title">
                <span>${item.name}</span>
                <span style="font-size:11px;background:rgba(217,119,6,0.12);color:#D97706;padding:2px 7px;border-radius:4px;font-weight:700;">⭐ ${item.rating || 4.8}</span>
              </div>
              <div class="food-desc">${item.description}</div>
              <div style="display:flex;align-items:center;gap:6px;margin:6px 0 10px;flex-wrap:wrap;">
                <span class="food-meta-pill">${item.prep_time || '8 mins'}</span>
                <span class="food-meta-pill">${item.calories || '380 kcal'}</span>
                ${item.protein_g ? `<span class="food-meta-pill" style="color:#4F46E5;font-weight:700;">${item.protein_g}g Protein</span>` : ''}
                ${item.category ? `<span class="food-meta-pill" style="color:#0F766E;">${item.category}</span>` : ''}
                <span class="food-meta-pill" style="color:${item.is_veg ? '#059669' : '#DC2626'};font-weight:700;">${item.is_veg ? 'Vegetarian' : 'Non-Vegetarian'}</span>
                ${isOutOfStock ? `
                  <span class="stock-badge out-of-stock">✕ Sold Out</span>
                ` : `
                  <span class="stock-badge in-stock">● In Stock (${item.stock !== undefined ? item.stock : 'Available'})</span>
                `}
              </div>
              <div class="food-bottom-row">
                <span class="food-price">₹${item.price}</span>
                <div class="food-action-stepper" onclick="event.stopPropagation();">
                  ${isOutOfStock ? `
                    <button class="add-mini-btn sold-out" disabled style="padding:6px 14px;font-size:12px;font-weight:800;background:#F1F5F9;color:#94A3B8;border:1px solid #CBD5E1;cursor:not-allowed;">
                      Sold Out
                    </button>
                  ` : (qty > 0 ? `
                    <button class="stepper-btn" onclick="StudentApp.decrementCart('${item.id}')">-</button>
                    <span class="stepper-qty">${qty}</span>
                    <button class="stepper-btn" onclick="StudentApp.addToCart('${item.id}')">+</button>
                  ` : `
                    <button class="add-mini-btn" style="padding:6px 14px;font-size:12px;font-weight:800;" onclick="StudentApp.addToCart('${item.id}')">
                      + Add
                    </button>
                  `)}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    };

    const htmlContent = renderHtml(itemsToRender);
    if (homeContainer) homeContainer.innerHTML = htmlContent;
    if (fullContainer) fullContainer.innerHTML = htmlContent;
  },

  selectStall(stallId, btn) {
    this.currentStall = stallId;
    document.querySelectorAll('.stall-pill-btn').forEach(b => {
      b.style.background = 'var(--bg-elevated)';
      b.style.color = 'var(--text-secondary)';
      b.classList.remove('active');
    });
    if (btn) {
      btn.style.background = 'var(--primary)';
      btn.style.color = 'white';
      btn.classList.add('active');
    }
    this.applyCombinedFilters();
  },

  applyCombinedFilters() {
    let list = [...this.products];
    if (this.currentStall && this.currentStall !== 'all') {
      list = list.filter(p => p.stall_id === this.currentStall);
    }
    if (this.currentCategory && this.currentCategory !== 'All') {
      list = list.filter(p => p.category && p.category.toLowerCase() === this.currentCategory.toLowerCase());
    }
    if (this.currentDietFilter === 'veg') {
      list = list.filter(p => p.is_veg);
    } else if (this.currentDietFilter === 'popular') {
      list = list.filter(p => p.popular);
    } else if (this.currentDietFilter === 'under50') {
      list = list.filter(p => p.price <= 50);
    } else if (this.currentDietFilter === 'fast') {
      list = list.filter(p => parseInt(p.prep_time) <= 8);
    }
    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery;
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    this.renderMenuList(list);
  },

  filterProducts(category, btn) {
    this.currentCategory = category || 'All';
    document.querySelectorAll('.cat-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.category.toLowerCase() === this.currentCategory.toLowerCase());
    });
    this.applyCombinedFilters();
  },

  searchProducts(query) {
    const studentInput = document.getElementById('student-search-input');
    const menuInput = document.getElementById('menu-search-input');
    const desktopInput = document.getElementById('desktop-search-input');

    if (studentInput && studentInput.value !== query) studentInput.value = query || '';
    if (menuInput && menuInput.value !== query) menuInput.value = query || '';
    if (desktopInput && desktopInput.value !== query) desktopInput.value = query || '';

    this.currentSearchQuery = query ? query.trim().toLowerCase() : '';
    this.applyCombinedFilters();
  },

  toggleVegFilter(isVegOnly) {
    this.currentDietFilter = isVegOnly ? 'veg' : 'all';
    this.applyCombinedFilters();
  },

  // Customization Modal
  openCustomizationModal(productId) {
    const item = this.products.find(p => p.id === productId);
    if (!item) return;

    if (item.is_available === false || (item.stock !== undefined && item.stock <= 0)) {
      App.showToast(`Sorry, ${item.name} is currently out of stock!`, 'warning');
      return;
    }

    this.customizingProduct = item;
    const body = document.getElementById('customization-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div style="text-align:center;margin-bottom:12px;">
        <div style="font-size:52px;margin-bottom:6px;">${item.image_emoji}</div>
        <h3 style="font-size:18px;font-weight:800;color:var(--text-primary);">${item.name}</h3>
        <p style="font-size:12px;color:var(--text-secondary);">${item.description}</p>
        <div style="font-size:16px;font-weight:800;color:var(--primary);margin-top:6px;">Base Price: ₹${item.price}</div>
      </div>

      <div style="margin-bottom:14px;">
        <label style="font-size:12px;font-weight:700;color:#CBD5E1;display:block;margin-bottom:6px;">Choose Spice Level:</label>
        <div style="display:flex;gap:6px;">
          <label style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:10px;text-align:center;font-size:11.5px;cursor:pointer;">
            <input type="radio" name="cust-spice" value="Mild" checked> <span class="status-pulse-dot" style="margin-right:2px;"></span> Mild
          </label>
          <label style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:10px;text-align:center;font-size:11.5px;cursor:pointer;">
            <input type="radio" name="cust-spice" value="Medium"> <span class="status-pulse-dot amber" style="margin-right:2px;"></span> Medium
          </label>
          <label style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:10px;text-align:center;font-size:11.5px;cursor:pointer;">
            <input type="radio" name="cust-spice" value="Spicy"> <span class="status-pulse-dot red" style="margin-right:2px;"></span> Hot
          </label>
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <label style="font-size:12px;font-weight:700;color:#CBD5E1;display:block;margin-bottom:6px;">Add-Ons & Extras:</label>
        <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:6px;font-size:12.5px;cursor:pointer;">
          <span>Extra Melted Cheese Slice</span>
          <div style="display:flex;align-items:center;gap:6px;">
            <span style="color:var(--primary);font-weight:700;">+₹15</span>
            <input type="checkbox" id="addon-cheese" style="accent-color:var(--primary);width:16px;height:16px;">
          </div>
        </label>
      </div>

      <div style="margin-bottom:16px;">
        <label style="font-size:12px;font-weight:700;color:#CBD5E1;display:block;margin-bottom:6px;">Chef Note (Optional):</label>
        <input type="text" id="cust-note" class="modern-input-field" placeholder="E.g. No raw onions, extra crispy" style="padding:8px 12px;font-size:12px;">
      </div>

      <button class="splash-btn" onclick="StudentApp.confirmCustomizationAndAdd()">
        Add Customized Item to Cart →
      </button>
    `;

    App.openModal('customization-modal');
  },

  confirmCustomizationAndAdd() {
    if (!this.customizingProduct) return;

    const cheeseChecked = document.getElementById('addon-cheese')?.checked;
    const spice = document.querySelector('input[name="cust-spice"]:checked')?.value || 'Mild';
    const note = document.getElementById('cust-note')?.value || '';

    let extraPrice = 0;
    const tags = [spice];
    if (cheeseChecked) {
      extraPrice += 15;
      tags.push('Extra Cheese');
    }
    if (note) tags.push(note);

    const finalItemPrice = this.customizingProduct.price + extraPrice;

    this.cart.push({
      productId: this.customizingProduct.id,
      name: `${this.customizingProduct.name} (${tags.join(', ')})`,
      price: finalItemPrice,
      image_emoji: this.customizingProduct.image_emoji,
      quantity: 1
    });

    this.updateCartBadge();
    this.renderMenuList(this.products);
    this.renderDesktopCart();
    App.closeModal('customization-modal');
    App.showToast(`Added ${this.customizingProduct.name} to cart!`, 'success');
  },

  // ==========================================
  // Product Details Screen (Step 7)
  // ==========================================
  openProductDetails(productId, isModal = false) {
    const product = this.products.find(p => p.id === productId);
    if (!product) {
      console.warn("Product not found:", productId);
      return;
    }

    this.currentDetailProduct = product;
    this.currentDetailQty = 1;

    const htmlContent = this.renderProductDetailsHtml(product, isModal);

    if (isModal) {
      const modalBody = document.getElementById('product-detail-modal-body');
      if (modalBody) {
        modalBody.innerHTML = htmlContent;
        App.openModal('product-detail-modal');
      }
    } else {
      const screenContainer = document.getElementById('screen-product-detail-content');
      if (screenContainer) {
        screenContainer.innerHTML = htmlContent;
      }
      this.navigateTo('product-detail');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  },

  renderProductDetailsHtml(item, isModal = false) {
    const isOutOfStock = item.is_available === false || (item.stock !== undefined && item.stock <= 0);
    const photoUrl = this.productPhotos[item.id] || item.image_url;
    const inCart = this.cart.find(c => c.productId === item.id);
    const inCartQty = inCart ? inCart.quantity : 0;
    const stockCount = item.stock !== undefined ? item.stock : 25;
    const currentQty = this.currentDetailQty || 1;
    const subtotal = item.price * currentQty;

    return `
      <div class="product-detail-page-wrapper">
        <!-- Top Navigation & Breadcrumbs -->
        <div class="product-detail-top-bar">
          <div class="product-detail-breadcrumbs">
            <a onclick="StudentApp.navigateTo('menu')">Menu</a>
            <span>/</span>
            <span style="color:#64748B;">${item.category || 'Dishes'}</span>
            <span>/</span>
            <span style="font-weight:700;color:var(--text-primary);">${item.name}</span>
          </div>
          <button class="btn-secondary" onclick="${isModal ? "App.closeModal('product-detail-modal')" : "StudentApp.navigateTo('menu')"}" style="padding:6px 14px;font-size:12px;border-radius:999px;">
            ${isModal ? '✕ Close' : '← Back to Menu'}
          </button>
        </div>

        <div class="product-detail-grid">
          <!-- Left Column: Hero Media & Badges -->
          <div class="product-detail-media-card">
            <div class="product-detail-hero-media">
              ${photoUrl ? `
                <img src="${photoUrl}" alt="${item.name}" class="product-detail-hero-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="food-emoji-fallback" style="display:none;font-size:72px;">${item.image_emoji || '🍱'}</div>
              ` : `
                <div class="food-emoji-fallback" style="display:flex;font-size:72px;align-items:center;justify-content:center;height:100%;">${item.image_emoji || '🍱'}</div>
              `}

              <div class="product-detail-media-badges">
                <span class="product-detail-diet-tag ${item.is_veg ? 'veg' : 'non-veg'}">
                  <span class="${item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}" style="position:static;"></span>
                  <span>${item.is_veg ? 'Pure Veg' : 'Non-Veg'}</span>
                </span>
                <span class="stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}" style="font-size:11.5px;padding:4px 10px;">
                  ${isOutOfStock ? '✕ Currently Sold Out' : '● In Stock'}
                </span>
              </div>
            </div>

            <!-- Quick Food Specs Strip -->
            <div style="padding:14px 18px;background:#F8FAFC;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-around;text-align:center;">
              <div>
                <div style="font-size:10.5px;color:#64748B;font-weight:600;text-transform:uppercase;">Prep Time</div>
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:2px;">⏱ ${item.prep_time || '8 mins'}</div>
              </div>
              <div style="border-left:1px solid #E2E8F0;height:24px;align-self:center;"></div>
              <div>
                <div style="font-size:10.5px;color:#64748B;font-weight:600;text-transform:uppercase;">Calories</div>
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:2px;">🔥 ${item.calories || '380 kcal'}</div>
              </div>
              <div style="border-left:1px solid #E2E8F0;height:24px;align-self:center;"></div>
              <div>
                <div style="font-size:10.5px;color:#64748B;font-weight:600;text-transform:uppercase;">Stall Counter</div>
                <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-top:2px;">🏛 Counter 2</div>
              </div>
            </div>
          </div>

          <!-- Right Column: Product Info, Availability, Quantity Selector & Add to Cart -->
          <div class="product-detail-info-card">
            <div class="product-detail-header">
              <div class="product-detail-tag-row">
                <span class="product-category-pill">${item.category || 'Canteen Special'}</span>
                <span class="product-rating-pill">⭐ ${item.rating || 4.8} / 5.0 (420+ student reviews)</span>
                ${item.popular ? `<span style="font-size:11px;font-weight:700;color:#4F46E5;background:#EEF2FF;padding:2px 8px;border-radius:999px;">Top Student Pick</span>` : ''}
              </div>
              <h1 class="product-detail-title">${item.name}</h1>
              
              <div class="product-detail-price-wrap">
                <span class="product-detail-current-price">₹${item.price}</span>
                <span class="product-detail-price-note">Campus Subsidized Student Rate</span>
              </div>
            </div>

            <!-- Description -->
            <p class="product-detail-desc">${item.description}</p>

            <!-- Dietary & Nutritional highlights -->
            <div class="product-detail-meta-strip">
              <span class="product-meta-cell">🥗 100% Fresh Daily Ingredients</span>
              <span class="product-meta-cell">⚡ Rapid Break Pickup Ready</span>
              ${item.protein_g ? `<span class="product-meta-cell" style="color:#4F46E5;font-weight:700;">💪 ${item.protein_g}g Protein</span>` : ''}
            </div>

            <!-- Availability Status Banner (Step 7 Requirement) -->
            <div class="product-detail-availability-banner ${isOutOfStock ? 'sold-out' : 'in-stock'}" id="detail-availability-banner">
              <div>
                <div class="status-title">
                  ${isOutOfStock ? `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Currently Sold Out
                  ` : `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16A34A" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    In Stock & Available
                  `}
                </div>
                <div class="status-sub">
                  ${isOutOfStock 
                    ? 'This dish is temporarily unavailable. Kitchen restock in progress.' 
                    : `Fresh batch ready at Counter 2 (${stockCount} portion${stockCount === 1 ? '' : 's'} available).`}
                </div>
              </div>
              <span style="font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;background:white;">
                ${isOutOfStock ? 'Unavailable' : `${stockCount} Left`}
              </span>
            </div>

            <!-- Quantity Selector Section (Step 7 Requirement) -->
            <div class="product-detail-qty-section">
              <div class="product-detail-qty-header">
                <label for="detail-qty-val">Select Quantity:</label>
                <div class="product-detail-subtotal-preview" id="detail-subtotal-val">Total: ₹${subtotal}</div>
              </div>
              <div class="product-detail-stepper-control">
                <button 
                  type="button"
                  id="detail-qty-minus" 
                  class="detail-stepper-btn" 
                  onclick="StudentApp.adjustDetailQuantity(-1)"
                  ${isOutOfStock || currentQty <= 1 ? 'disabled' : ''}
                  title="Decrease quantity">
                  −
                </button>
                <span id="detail-qty-val" class="detail-qty-display">${currentQty}</span>
                <button 
                  type="button"
                  id="detail-qty-plus" 
                  class="detail-stepper-btn" 
                  onclick="StudentApp.adjustDetailQuantity(1)"
                  ${isOutOfStock || (item.stock !== undefined && currentQty >= item.stock) ? 'disabled' : ''}
                  title="Increase quantity">
                  +
                </button>
                <span style="font-size:12.5px;color:#64748B;margin-left:6px;font-weight:600;">
                  ${isOutOfStock ? '(Unavailable)' : `(Max available: ${stockCount})`}
                </span>
              </div>
            </div>

            <!-- Action Buttons (Step 7 Requirement) -->
            <div class="product-detail-actions-row">
              <button 
                type="button"
                id="detail-add-cart-btn" 
                class="product-detail-add-btn" 
                onclick="StudentApp.confirmDetailAddToCart()"
                ${isOutOfStock ? 'disabled' : ''}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span id="detail-add-btn-text">
                  ${isOutOfStock ? 'Item Out of Stock — Unavailable' : `Add to Cart • ₹${subtotal}`}
                </span>
              </button>

              <button 
                type="button"
                class="product-detail-customize-btn" 
                onclick="StudentApp.openCustomizationModal('${item.id}')"
                ${isOutOfStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
                <span>⚙️ Customize Spice & Add-ons</span>
              </button>
            </div>

            <!-- Existing In-Tray Notice -->
            ${inCartQty > 0 ? `
              <div class="product-detail-already-in-tray" id="detail-in-tray-notice">
                <span>🛒</span>
                <span>You currently have <strong>${inCartQty} portion${inCartQty === 1 ? '' : 's'}</strong> of this dish in your tray.</span>
              </div>
            ` : `
              <div class="product-detail-already-in-tray" id="detail-in-tray-notice" style="display:none;"></div>
            `}

            <!-- Success Confirmation Banner (Step 7 Requirement: clear success confirmation) -->
            <div id="detail-success-card" class="detail-success-card" style="display:none;">
              <div class="detail-success-header">
                <span class="detail-success-icon-badge">✓</span>
                <div>
                  <div class="detail-success-title">Item Successfully Added to Tray!</div>
                  <div id="detail-success-sub" class="detail-success-msg" style="padding-left:0;margin-top:2px;">
                    Added successfully.
                  </div>
                </div>
              </div>
              <div class="detail-success-actions">
                <button type="button" class="detail-success-view-tray-btn" onclick="StudentApp.navigateTo('cart')">
                  View Tray & Checkout →
                </button>
                <button type="button" class="detail-success-continue-btn" onclick="StudentApp.navigateTo('menu')">
                  Continue Browsing Menu
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;
  },

  adjustDetailQuantity(delta) {
    if (!this.currentDetailProduct) return;
    const item = this.currentDetailProduct;

    // Validate if unavailable (Step 7 requirement)
    if (item.is_available === false || (item.stock !== undefined && item.stock <= 0)) {
      App.showToast(`Sorry, ${item.name} is currently out of stock!`, 'warning');
      return;
    }

    const current = this.currentDetailQty || 1;
    const maxStock = item.stock !== undefined ? item.stock : 99;
    const next = current + delta;

    if (next < 1) {
      return;
    }
    if (next > maxStock) {
      App.showToast(`Maximum available stock (${maxStock}) reached for ${item.name}!`, 'warning');
      return;
    }

    this.currentDetailQty = next;

    // Update UI elements
    const qtyValEl = document.getElementById('detail-qty-val');
    const subtotalEl = document.getElementById('detail-subtotal-val');
    const btnTextEl = document.getElementById('detail-add-btn-text');
    const minusBtn = document.getElementById('detail-qty-minus');
    const plusBtn = document.getElementById('detail-qty-plus');

    const subtotal = item.price * next;
    if (qtyValEl) qtyValEl.textContent = next;
    if (subtotalEl) subtotalEl.textContent = `Total: ₹${subtotal}`;
    if (btnTextEl) btnTextEl.textContent = `Add to Cart • ₹${subtotal}`;

    if (minusBtn) minusBtn.disabled = (next <= 1);
    if (plusBtn) plusBtn.disabled = (next >= maxStock);
  },

  confirmDetailAddToCart() {
    if (!this.currentDetailProduct) return;
    const item = this.currentDetailProduct;

    // Validate unavailable products (Step 7 requirement)
    if (item.is_available === false || (item.stock !== undefined && item.stock <= 0)) {
      App.showToast(`Cannot add ${item.name} — product is currently unavailable or out of stock!`, 'error');
      return;
    }

    const qty = this.currentDetailQty || 1;
    const success = this.addToCart(item.id, qty);
    if (!success) return;

    // Show clear success confirmation in UI (Step 7 requirement)
    const successCard = document.getElementById('detail-success-card');
    const successSub = document.getElementById('detail-success-sub');
    const inTrayNotice = document.getElementById('detail-in-tray-notice');

    const inCart = this.cart.find(c => c.productId === item.id);
    const totalInCart = inCart ? inCart.quantity : qty;

    if (successCard) {
      if (successSub) {
        successSub.textContent = `Added ${qty} portion${qty === 1 ? '' : 's'} of ${item.name} (₹${item.price * qty}) to your order tray. Total in tray: ${totalInCart}.`;
      }
      successCard.style.display = 'flex';
      successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (inTrayNotice) {
      inTrayNotice.style.display = 'flex';
      inTrayNotice.innerHTML = `<span>🛒</span><span>You currently have <strong>${totalInCart} portion${totalInCart === 1 ? '' : 's'}</strong> of this dish in your tray.</span>`;
    }
  },

  addToCart(productId, quantity = 1) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return false;

    // Validate unavailable products (Step 7 requirement)
    if (product.is_available === false || (product.stock !== undefined && product.stock <= 0)) {
      App.showToast(`Sorry, ${product.name} is currently out of stock!`, 'warning');
      return false;
    }

    const qtyToAdd = Math.max(1, parseInt(quantity) || 1);
    const existing = this.cart.find(c => c.productId === productId);
    if (existing) {
      if (product.stock !== undefined && (existing.quantity + qtyToAdd) > product.stock) {
        App.showToast(`Cannot add ${qtyToAdd} more. Maximum stock (${product.stock}) reached for ${product.name}!`, 'warning');
        return false;
      }
      existing.quantity += qtyToAdd;
    } else {
      if (product.stock !== undefined && qtyToAdd > product.stock) {
        App.showToast(`Cannot add ${qtyToAdd}. Only ${product.stock} portions available in stock!`, 'warning');
        return false;
      }
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image_emoji: product.image_emoji || '🍱',
        quantity: qtyToAdd
      });
    }

    this.saveCartToSession();
    this.updateCartBadge();
    this.updateCartShortcutBanner();
    this.renderMenuList(this.products);
    this.renderDesktopCart();
    this.renderCart();
    App.showToast(`✓ Added ${qtyToAdd} × ${product.name} to tray!`, 'success');
    return true;
  },

  decrementCart(productId) {
    const index = this.cart.findIndex(c => c.productId === productId);
    if (index === -1) return;

    this.cart[index].quantity -= 1;
    if (this.cart[index].quantity <= 0) {
      const removedItem = this.cart[index];
      this.cart.splice(index, 1);
      App.showToast(`Removed ${removedItem.name} from tray`, 'info');
    }

    this.saveCartToSession();
    this.updateCartBadge();
    this.updateCartShortcutBanner();
    this.renderMenuList(this.products);
    this.renderDesktopCart();
    this.renderCart();
  },

  removeFromCart(productId) {
    const index = this.cart.findIndex(c => c.productId === productId);
    if (index === -1) return;

    const removedItem = this.cart[index];
    this.cart.splice(index, 1);
    this.saveCartToSession();
    this.updateCartBadge();
    this.updateCartShortcutBanner();
    this.renderMenuList(this.products);
    this.renderDesktopCart();
    this.renderCart();
    App.showToast(`Removed ${removedItem.name} from cart`, 'info');
  },

  clearCart() {
    if (!this.cart || !this.cart.length) return;
    this.cart = [];
    this.saveCartToSession();
    this.updateCartBadge();
    this.updateCartShortcutBanner();
    this.renderMenuList(this.products);
    this.renderDesktopCart();
    this.renderCart();
    App.showToast('Your cart has been cleared', 'info');
  },

  // Session Storage Persistence (Step 8 Requirement)
  saveCartToSession() {
    try {
      sessionStorage.setItem('campusbite_cart', JSON.stringify(this.cart));
      if (this.appliedCoupon) {
        sessionStorage.setItem('campusbite_coupon', JSON.stringify(this.appliedCoupon));
      } else {
        sessionStorage.removeItem('campusbite_coupon');
      }
      sessionStorage.setItem('campusbite_loyalty', JSON.stringify(this.redeemLoyalty));
    } catch (e) {
      console.warn('Session storage save error:', e);
    }
  },

  loadCartFromSession() {
    try {
      const savedCart = sessionStorage.getItem('campusbite_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          this.cart = parsed;
        }
      }
      const savedCoupon = sessionStorage.getItem('campusbite_coupon');
      if (savedCoupon) {
        this.appliedCoupon = JSON.parse(savedCoupon) || null;
      }
      const savedLoyalty = sessionStorage.getItem('campusbite_loyalty');
      if (savedLoyalty !== null) {
        this.redeemLoyalty = JSON.parse(savedLoyalty) === true;
      }
    } catch (e) {
      console.warn('Session storage load error:', e);
    }
  },

  updateCartBadge() {
    const totalCount = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const badge = document.getElementById('mob-cart-badge');
    if (badge) {
      badge.textContent = totalCount;
      badge.style.display = totalCount > 0 ? 'flex' : 'none';
    }
  },

  renderCart() {
    const itemsContainer = document.getElementById('cart-items-container');
    const emptyState = document.getElementById('cart-empty-state');
    const fullState = document.getElementById('cart-full-state');
    const countBadge = document.getElementById('cart-items-count-badge');
    const clearBtn = document.getElementById('cart-clear-btn');
    const checkoutBtn = document.getElementById('cart-checkout-btn');

    const totalQty = this.cart.reduce((s, i) => s + i.quantity, 0);

    if (countBadge) {
      countBadge.textContent = `${totalQty} Item${totalQty === 1 ? '' : 's'}`;
    }
    if (clearBtn) {
      clearBtn.style.display = this.cart.length ? 'inline-block' : 'none';
    }

    if (!this.cart.length) {
      if (emptyState) emptyState.style.display = 'flex';
      if (fullState) fullState.style.display = 'none';
      if (checkoutBtn) checkoutBtn.disabled = true;
      this.calculateCartBill();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (fullState) fullState.style.display = 'grid';
    if (checkoutBtn) checkoutBtn.disabled = false;

    if (itemsContainer) {
      itemsContainer.innerHTML = this.cart.map(item => {
        const product = this.products.find(p => p.id === item.productId) || {};
        const photoUrl = this.productPhotos[item.productId] || product.image_url || item.image_url;
        const itemCategory = product.category || 'Canteen Item';

        return `
          <div class="cart-item-row" data-product-id="${item.productId}">
            <div class="cart-item-thumb-wrap">
              ${photoUrl ? `
                <img src="${photoUrl}" alt="${item.name}" class="cart-item-thumb-img" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="food-emoji-fallback" style="display:none;font-size:24px;">${item.image_emoji || product.image_emoji || '🍱'}</div>
              ` : `
                <div class="food-emoji-fallback" style="display:flex;font-size:24px;align-items:center;justify-content:center;">${item.image_emoji || product.image_emoji || '🍱'}</div>
              `}
            </div>

            <div class="cart-item-info-col">
              <div class="cart-item-title-row">
                <span class="cart-item-title">${item.name}</span>
                <button class="cart-item-remove-btn" onclick="StudentApp.removeFromCart('${item.productId}')" title="Remove ${item.name} from cart">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  <span>Remove</span>
                </button>
              </div>

              <div class="cart-item-meta-row">
                <span class="cart-unit-price-label">Unit Price: <strong>₹${item.price}</strong></span>
                <span class="cart-meta-dot">•</span>
                <span class="cart-item-cat-badge">${itemCategory}</span>
              </div>

              <div class="cart-item-bottom-row">
                <div class="cart-stepper-control">
                  <button class="cart-stepper-btn" onclick="StudentApp.decrementCart('${item.productId}')" title="Decrease quantity">−</button>
                  <span class="cart-stepper-qty">${item.quantity}</span>
                  <button class="cart-stepper-btn" onclick="StudentApp.addToCart('${item.productId}')" title="Increase quantity">+</button>
                </div>

                <div class="cart-item-subtotal-block">
                  <span class="cart-subtotal-label">Subtotal:</span>
                  <span class="cart-item-subtotal-val">₹${item.price * item.quantity}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }

    this.calculateCartBill();
  },

  calculateCartBill() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Coupon discount (verifies minimum order requirement)
    let couponDiscount = 0;
    if (this.appliedCoupon) {
      const minOrder = this.appliedCoupon.minimum_order || 0;
      if (subtotal >= minOrder) {
        if (this.appliedCoupon.discount_type === 'percentage') {
          couponDiscount = Math.min(Math.round((subtotal * this.appliedCoupon.discount_value) / 100), this.appliedCoupon.max_discount || 100);
        } else {
          couponDiscount = Math.min(this.appliedCoupon.discount_value, subtotal);
        }
      }
    }

    // Loyalty discount
    let loyaltyDiscount = 0;
    if (this.redeemLoyalty && this.currentUser.loyalty_points >= 100) {
      loyaltyDiscount = Math.min(Math.floor(this.currentUser.loyalty_points / 100) * 10, subtotal - couponDiscount);
    }

    // Faculty campus dining subsidy (10% on all orders)
    let facultyDiscount = 0;
    if (this.currentUser && this.currentUser.role === 'faculty') {
      facultyDiscount = Math.round(subtotal * 0.10);
    }

    const totalDiscount = couponDiscount + loyaltyDiscount + facultyDiscount;
    const total = Math.max(0, subtotal - totalDiscount);

    // Update Subtotal elements
    const subtotalEl = document.getElementById('cart-subtotal-val');
    const billSubtotal = document.getElementById('bill-subtotal');
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (billSubtotal) billSubtotal.textContent = `₹${subtotal}`;

    // Update Discount elements (Step 8 Requirement)
    const discountRow = document.getElementById('cart-discount-row');
    const discountVal = document.getElementById('cart-discount-val');
    const billDiscountRow = document.getElementById('bill-discount-row');
    const billDiscount = document.getElementById('bill-discount');

    if (totalDiscount > 0) {
      if (discountRow) discountRow.style.display = 'flex';
      if (discountVal) discountVal.textContent = `-₹${totalDiscount}`;
      if (billDiscountRow) billDiscountRow.style.display = 'flex';
      if (billDiscount) billDiscount.textContent = `-₹${totalDiscount}`;
    } else {
      if (discountRow) discountRow.style.display = 'none';
      if (billDiscountRow) billDiscountRow.style.display = 'none';
    }

    // Detailed breakdown rows
    const couponRow = document.getElementById('cart-coupon-row');
    const couponCodeLabel = document.getElementById('cart-coupon-code-label');
    if (couponRow) {
      if (couponDiscount > 0) {
        couponRow.style.display = 'flex';
        const valEl = document.getElementById('cart-coupon-val');
        if (valEl) valEl.textContent = `-₹${couponDiscount}`;
        if (couponCodeLabel && this.appliedCoupon) couponCodeLabel.textContent = this.appliedCoupon.code;
      } else {
        couponRow.style.display = 'none';
      }
    }

    const loyaltyRow = document.getElementById('cart-loyalty-row');
    const billLoyaltyRow = document.getElementById('bill-loyalty-row');
    if (loyaltyDiscount > 0) {
      if (loyaltyRow) {
        loyaltyRow.style.display = 'flex';
        const valEl = document.getElementById('cart-loyalty-val');
        if (valEl) valEl.textContent = `-₹${loyaltyDiscount}`;
      }
      if (billLoyaltyRow) billLoyaltyRow.style.display = 'flex';
    } else {
      if (loyaltyRow) loyaltyRow.style.display = 'none';
      if (billLoyaltyRow) billLoyaltyRow.style.display = 'none';
    }

    const facultyRow = document.getElementById('cart-faculty-row');
    if (facultyRow) {
      if (facultyDiscount > 0) {
        facultyRow.style.display = 'flex';
        const valEl = document.getElementById('cart-faculty-val');
        if (valEl) valEl.textContent = `-₹${facultyDiscount}`;
      } else {
        facultyRow.style.display = 'none';
      }
    }

    // Update Total elements (Step 8 Requirement)
    const totalEl = document.getElementById('cart-total-val');
    const billTotal = document.getElementById('bill-total');
    if (totalEl) totalEl.textContent = `₹${total}`;
    if (billTotal) billTotal.textContent = `₹${total}`;

    const checkoutBtnText = document.getElementById('checkout-action-btn-text');
    if (checkoutBtnText) {
      checkoutBtnText.textContent = total > 0 ? `Proceed to Checkout (₹${total})` : 'Proceed to Checkout';
    }

    const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    if (cartCheckoutBtn) {
      cartCheckoutBtn.disabled = this.cart.length === 0;
    }

    return { subtotal, couponDiscount, loyaltyDiscount, facultyDiscount, totalDiscount, total };
  },

  // ==========================================
  // Step 9: Coupon System (Validation & Immediate Recalculation)
  // ==========================================
  async applyCouponCode(code) {
    const heroInput = document.getElementById('hero-combo-coupon-input');
    const desktopInput = document.getElementById('desktop-sidebar-coupon-input');
    const cartInput = document.getElementById('cart-coupon-field') || document.getElementById('coupon-input-field');
    const checkoutInput = document.getElementById('checkout-coupon-field');
    const mobileInput = document.getElementById('mob-cart-coupon-field') || document.getElementById('coupon-input');
    const mobCheckoutInput = document.getElementById('mob-checkout-coupon-field') || document.getElementById('mob-checkout-coupon-input');

    const couponCode = (code || 
      (heroInput ? heroInput.value : '') || 
      (desktopInput ? desktopInput.value : '') || 
      (checkoutInput ? checkoutInput.value : '') ||
      (cartInput ? cartInput.value : '') || 
      (mobileInput ? mobileInput.value : '') ||
      (mobCheckoutInput ? mobCheckoutInput.value : '')).trim().toUpperCase();

    if (!couponCode) {
      App.showToast('Please type a coupon code', 'warning');
      return;
    }

    // Step 9 Requirement: Validate already applied coupon
    if (this.appliedCoupon && this.appliedCoupon.code.toUpperCase() === couponCode) {
      App.showToast(`Coupon ${couponCode} is already applied to your order!`, 'warning');
      return;
    }

    // Keep all inputs in sync with typed code
    if (heroInput) heroInput.value = couponCode;
    if (desktopInput) desktopInput.value = couponCode;
    if (cartInput) cartInput.value = couponCode;
    if (checkoutInput) checkoutInput.value = couponCode;
    if (mobileInput) mobileInput.value = couponCode;
    if (mobCheckoutInput) mobCheckoutInput.value = couponCode;

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const currentApplied = this.appliedCoupon ? this.appliedCoupon.code : null;

    try {
      const res = await window.api.applyCoupon(couponCode, subtotal, currentApplied);
      if (res && res.success) {
        this.appliedCoupon = res.coupon;
        this.saveCartToSession();

        // Step 9 Requirement: Update the order total immediately after applying a valid coupon
        this.calculateCartBill();
        this.renderDesktopCart();
        this.updateAppliedCouponUI();

        // If on checkout, update checkout immediately
        const checkoutScreen = document.getElementById('screen-checkout');
        if (checkoutScreen && checkoutScreen.classList.contains('active')) {
          this.renderCheckout();
        }

        // Update hero apply button UI feedback
        const heroBtn = document.getElementById('hero-combo-apply-btn');
        if (heroBtn) {
          heroBtn.textContent = '✓ Active';
          heroBtn.style.background = 'linear-gradient(135deg, #10B981, #059669)';
          setTimeout(() => {
            if (heroBtn) {
              heroBtn.textContent = 'Apply Code';
              heroBtn.style.background = 'linear-gradient(135deg, var(--primary), #6366F1)';
            }
          }, 3500);
        }

        App.showToast(res.message || `Coupon ${couponCode} applied successfully!`, 'success');
      } else {
        App.showToast((res && res.message) || `Invalid coupon code. Try CAMPUS20`, 'error');
      }
    } catch (err) {
      const errorMsg = (err.data && err.data.message) || err.message || 'Invalid coupon code. Try CAMPUS20 for 20% OFF.';
      App.showToast(errorMsg, 'error');
    }
  },

  removeCoupon() {
    if (!this.appliedCoupon) return;
    const removedCode = this.appliedCoupon.code;
    this.appliedCoupon = null;
    this.saveCartToSession();

    // Step 9 Requirement: Immediately update order total upon removal
    this.calculateCartBill();
    this.renderDesktopCart();
    this.updateAppliedCouponUI();

    const checkoutScreen = document.getElementById('screen-checkout');
    if (checkoutScreen && checkoutScreen.classList.contains('active')) {
      this.renderCheckout();
    }

    // Reset input fields
    const inputs = [
      'cart-coupon-field', 'coupon-input-field',
      'checkout-coupon-field',
      'mob-cart-coupon-field', 'coupon-input',
      'mob-checkout-coupon-field', 'mob-checkout-coupon-input',
      'hero-combo-coupon-input', 'desktop-sidebar-coupon-input'
    ];
    inputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });

    App.showToast(`Coupon ${removedCode} removed. Order total updated.`, 'info');
  },

  updateAppliedCouponUI() {
    const isApplied = !!this.appliedCoupon;
    
    // Update Cart pill
    const cartPill = document.getElementById('cart-applied-coupon-pill');
    if (cartPill) {
      if (isApplied) {
        cartPill.style.display = 'flex';
        const label = document.getElementById('cart-applied-coupon-name');
        if (label) label.textContent = `${this.appliedCoupon.code} (${this.appliedCoupon.discount_type === 'percentage' ? this.appliedCoupon.discount_value + '% OFF' : '₹' + this.appliedCoupon.discount_value + ' OFF'})`;
      } else {
        cartPill.style.display = 'none';
      }
    }

    // Update Mobile Cart pill
    const mobCartPill = document.getElementById('mob-cart-applied-coupon-pill');
    if (mobCartPill) {
      if (isApplied) {
        mobCartPill.style.display = 'flex';
        const label = document.getElementById('mob-cart-applied-coupon-name');
        if (label) label.textContent = `${this.appliedCoupon.code} (${this.appliedCoupon.discount_type === 'percentage' ? this.appliedCoupon.discount_value + '% OFF' : '₹' + this.appliedCoupon.discount_value + ' OFF'})`;
      } else {
        mobCartPill.style.display = 'none';
      }
    }

    // Update Checkout pill
    const chkPill = document.getElementById('checkout-applied-coupon-pill');
    if (chkPill) {
      if (isApplied) {
        chkPill.style.display = 'flex';
        const label = document.getElementById('checkout-applied-coupon-name');
        if (label) label.textContent = `${this.appliedCoupon.code} (${this.appliedCoupon.discount_type === 'percentage' ? this.appliedCoupon.discount_value + '% OFF' : '₹' + this.appliedCoupon.discount_value + ' OFF'})`;
      } else {
        chkPill.style.display = 'none';
      }
    }
  },

  toggleLoyaltyRedeem(checked) {
    this.redeemLoyalty = checked;
    this.saveCartToSession();
    this.calculateCartBill();
  },

  proceedToCheckout() {
    // Step 8 & 9 Requirement: Do not allow checkout with an empty cart
    if (!this.cart || !this.cart.length) {
      App.showToast('Your cart is empty! Please add items before proceeding to checkout.', 'warning');
      return false;
    }
    this.navigateTo('checkout');
    return true;
  },

  // ==========================================
  // Step 9: Checkout Screen & Payment Methods
  // ==========================================
  selectPickupSlot(slot) {
    if (!slot) return;
    this.selectedPickupSlot = slot;
    
    // Update desktop slot pills
    document.querySelectorAll('.pickup-slot-grid .slot-pill').forEach(pill => {
      const pSlot = pill.dataset.slot || '';
      const isMatch = pSlot === slot || 
        pSlot.replace(/[–—]/g, '-').trim() === slot.replace(/[–—]/g, '-').trim();
      pill.classList.toggle('active', isMatch);
    });

    // Update mobile pickup slot radios
    document.querySelectorAll('.pickup-slot-radio').forEach(radio => {
      const input = radio.querySelector('input');
      const val = input ? input.value : '';
      const isMatch = val === slot || val.replace(/[–—]/g, '-').trim() === slot.replace(/[–—]/g, '-').trim();
      radio.classList.toggle('active', isMatch);
      if (input) input.checked = isMatch;
    });

    // Update summary text
    const summarySlotEl = document.getElementById('checkout-slot-summary-text');
    if (summarySlotEl) summarySlotEl.textContent = slot;
  },

  selectPaymentMethod(method) {
    if (!method) return;
    this.selectedPaymentMethod = method;

    // Update desktop payment options
    document.querySelectorAll('.payment-options-list .payment-method-card').forEach(card => {
      card.classList.toggle('active', card.dataset.method === method);
    });

    // Update mobile payment options
    document.querySelectorAll('#screen-checkout .payment-method-card').forEach(card => {
      const input = card.querySelector('input');
      const val = input ? input.value : card.dataset.method;
      const isMatch = val === method;
      card.classList.toggle('active', isMatch);
      if (input) input.checked = isMatch;
    });

    // Update summary text
    const summaryModeEl = document.getElementById('checkout-mode-summary-text');
    if (summaryModeEl) {
      const labels = {
        'UPI': 'Simulated UPI',
        'Wallet': 'CampusPay Wallet',
        'Cash': 'Pay Cash at Counter',
        'Card': 'Smart RFID / Card'
      };
      summaryModeEl.textContent = labels[method] || method;
    }
  },

  renderCheckout() {
    // Empty cart protection
    if (!this.cart || !this.cart.length) {
      App.showToast('Your cart is empty! Please select items first.', 'warning');
      this.navigateTo('menu');
      return;
    }

    const { subtotal, discount, couponDiscount, loyaltyDiscount, facultyDiscount, total } = this.calculateCartBill();

    // Render Order Review items list (Desktop)
    const reviewContainer = document.getElementById('checkout-review-items-list');
    if (reviewContainer) {
      reviewContainer.innerHTML = this.cart.map(item => `
        <div class="checkout-review-item-row">
          <div>
            <div class="checkout-review-item-title">${item.name}</div>
            <div class="checkout-review-item-meta">₹${item.price} × ${item.quantity}</div>
          </div>
          <div class="checkout-review-item-price">₹${item.price * item.quantity}</div>
        </div>
      `).join('');
    }

    // Render Order Review items list (Mobile)
    const mobReviewContainer = document.getElementById('mob-checkout-review-items');
    if (mobReviewContainer) {
      mobReviewContainer.innerHTML = this.cart.map(item => `
        <div style="display:flex;justify-content:space-between;align-items:center;background:#F8FAFC;padding:7px 10px;border-radius:10px;font-size:12px;">
          <div>
            <strong style="color:var(--text-primary);">${item.name}</strong>
            <div style="font-size:10.5px;color:#64748B;">₹${item.price} × ${item.quantity}</div>
          </div>
          <strong style="color:var(--text-primary);">₹${item.price * item.quantity}</strong>
        </div>
      `).join('');
    }

    // Update Items Count Badges
    const totalItemsCount = this.cart.reduce((sum, i) => sum + i.quantity, 0);
    const countBadge = document.getElementById('checkout-items-count-badge');
    if (countBadge) countBadge.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'Item' : 'Items'}`;
    const mobCountBadge = document.getElementById('mob-checkout-items-count-badge');
    if (mobCountBadge) mobCountBadge.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'Item' : 'Items'}`;

    // Update Subtotal (Desktop & Mobile)
    const subtotalEl = document.getElementById('checkout-subtotal-val');
    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    const mobSubtotalEl = document.getElementById('mob-checkout-subtotal-val');
    if (mobSubtotalEl) mobSubtotalEl.textContent = `₹${subtotal}`;

    // Update Discounts
    const discountRow = document.getElementById('checkout-discount-row');
    const discountVal = document.getElementById('checkout-discount-val');
    if (discountRow && discountVal) {
      if (discount > 0) {
        discountRow.style.display = 'flex';
        discountVal.textContent = `-₹${discount}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    // Coupon discount row (Desktop & Mobile)
    const couponRow = document.getElementById('checkout-coupon-row');
    const couponVal = document.getElementById('checkout-coupon-val');
    const couponLabel = document.getElementById('checkout-coupon-code-label');
    if (couponRow && couponVal) {
      if (couponDiscount > 0 && this.appliedCoupon) {
        couponRow.style.display = 'flex';
        couponVal.textContent = `-₹${couponDiscount}`;
        if (couponLabel) couponLabel.textContent = this.appliedCoupon.code;
      } else {
        couponRow.style.display = 'none';
      }
    }

    const mobCouponRow = document.getElementById('mob-checkout-coupon-row');
    const mobCouponVal = document.getElementById('mob-checkout-coupon-val');
    const mobCouponCode = document.getElementById('mob-checkout-coupon-code');
    if (mobCouponRow && mobCouponVal) {
      if (couponDiscount > 0 && this.appliedCoupon) {
        mobCouponRow.style.display = 'flex';
        mobCouponVal.textContent = `-₹${couponDiscount}`;
        if (mobCouponCode) mobCouponCode.textContent = this.appliedCoupon.code;
      } else {
        mobCouponRow.style.display = 'none';
      }
    }

    // Loyalty discount row
    const loyaltyRow = document.getElementById('checkout-loyalty-row');
    const loyaltyVal = document.getElementById('checkout-loyalty-val');
    if (loyaltyRow && loyaltyVal) {
      if (loyaltyDiscount > 0) {
        loyaltyRow.style.display = 'flex';
        loyaltyVal.textContent = `-₹${loyaltyDiscount}`;
      } else {
        loyaltyRow.style.display = 'none';
      }
    }

    // Faculty discount row
    const facultyRow = document.getElementById('checkout-faculty-row');
    const facultyVal = document.getElementById('checkout-faculty-val');
    if (facultyRow && facultyVal) {
      if (facultyDiscount > 0) {
        facultyRow.style.display = 'flex';
        facultyVal.textContent = `-₹${facultyDiscount}`;
      } else {
        facultyRow.style.display = 'none';
      }
    }

    // Total Payable
    const totalEl = document.getElementById('checkout-total-val');
    if (totalEl) totalEl.textContent = `₹${total}`;
    const mobTotalEl = document.getElementById('mob-checkout-total-val');
    if (mobTotalEl) mobTotalEl.textContent = `₹${total}`;
    const btnAmt = document.getElementById('checkout-btn-amount');
    if (btnAmt) btnAmt.textContent = `₹${total}`;

    // Customer Identity & Wallet Info
    if (this.currentUser) {
      const nameEl = document.getElementById('checkout-customer-name');
      if (nameEl) nameEl.textContent = this.currentUser.name;
      const deptEl = document.getElementById('checkout-customer-dept');
      if (deptEl) deptEl.textContent = this.currentUser.department || 'CSBS';
      const walletHint = document.getElementById('checkout-wallet-balance-hint');
      if (walletHint) walletHint.textContent = `Balance: ₹${this.currentUser.wallet_balance || 0}`;
    }

    // Sync active slot and payment UI
    this.selectPickupSlot(this.selectedPickupSlot);
    this.selectPaymentMethod(this.selectedPaymentMethod);
  },

  // Alias for mobile & callers
  async placeOrder() {
    return await this.executePaymentAndPlaceOrder();
  },

  async executePaymentAndPlaceOrder() {
    // Step 10 Requirement: Validate required information before continuing
    if (!this.cart || !this.cart.length) {
      App.showToast('Your cart is empty! Please add items before placing order.', 'warning');
      this.navigateTo('menu');
      return;
    }

    if (!this.selectedPickupSlot) {
      App.showToast('Please select a scheduled pickup time slot.', 'warning');
      return;
    }

    if (!this.selectedPaymentMethod) {
      App.showToast('Please select a payment method.', 'warning');
      return;
    }

    // Step 10 Requirement: Do not create duplicate orders
    if (this.isPlacingOrder) {
      App.showToast('Your order is already being processed. Please wait...', 'info');
      return;
    }

    const { total } = this.calculateCartBill();

    if (this.selectedPaymentMethod === 'UPI') {
      this.showUpiSimulationModal(total);
    } else if (this.selectedPaymentMethod === 'Card') {
      this.showCardSimulationModal(total);
    } else if (this.selectedPaymentMethod === 'Cash' || this.selectedPaymentMethod === 'Pay at Counter') {
      // Step 11 Requirement: For Pay at Counter / Cash: Mark payment as PENDING
      await this.finalizeOrderPlacement({ 
        payment_method: 'Cash', 
        payment_status: 'PENDING' 
      });
    } else if (this.selectedPaymentMethod === 'Wallet') {
      if (this.currentUser.wallet_balance < total) {
        App.showToast(`Insufficient CampusPay balance (₹${this.currentUser.wallet_balance}). Required: ₹${total}. Please top-up.`, 'warning');
        this.navigateTo('wallet');
        return;
      }
      this.currentUser.wallet_balance -= total;
      this.updateWalletUI();
      App.showToast(`Deducted ₹${total} from CampusPay Wallet!`, 'success');
      await this.finalizeOrderPlacement({ 
        payment_method: 'Wallet', 
        payment_status: 'PAID' 
      });
    } else {
      await this.finalizeOrderPlacement({ 
        payment_method: this.selectedPaymentMethod, 
        payment_status: 'PAID' 
      });
    }
  },

  // ==========================================
  // Step 11: Simulated Payment System
  // Academic prototype — No real money or APIs
  // ==========================================
  showUpiSimulationModal(amount) {
    const formattedAmt = Number(amount || 0).toFixed(2);
    
    // Desktop modal amount
    const amtEl = document.getElementById('upi-modal-amount');
    if (amtEl) amtEl.textContent = `₹${formattedAmt}`;

    // Mobile modal amount
    const mobAmtEl = document.getElementById('mob-upi-modal-amount');
    if (mobAmtEl) mobAmtEl.textContent = `₹${formattedAmt}`;

    // Default student UPI ID
    const upiInput = document.getElementById('upi-id-input');
    if (upiInput && !upiInput.value) {
      upiInput.value = 'student@okaxis';
    }
    const mobUpiInput = document.getElementById('mob-upi-id-input');
    if (mobUpiInput && !mobUpiInput.value) {
      mobUpiInput.value = 'student@okaxis';
    }

    // QR Render
    if (window.CampusUPI) {
      window.CampusUPI.openUpiModal(amount, 'CB' + Math.floor(1000 + Math.random() * 9000));
    } else {
      App.openModal('upi-payment-modal');
    }
  },

  async confirmUpiPayment(simulateFailure = false) {
    if (simulateFailure) {
      // Step 11 Requirement: Payment status FAILED simulation
      App.closeModal('upi-payment-modal');
      App.showToast('Simulated UPI Payment FAILED / Declined. Payment status: FAILED', 'error');
      return;
    }

    // Read UPI ID input (Desktop or Mobile)
    const upiInput = document.getElementById('upi-id-input');
    const mobUpiInput = document.getElementById('mob-upi-id-input');
    const upiId = (upiInput ? upiInput.value : (mobUpiInput ? mobUpiInput.value : '')) || 'student@okaxis';

    if (!upiId.trim() || !upiId.includes('@')) {
      App.showToast('Please enter a valid UPI ID (e.g. student@okaxis)', 'warning');
      return;
    }

    App.closeModal('upi-payment-modal');
    App.showToast(`Simulated UPI Payment Approved for ${upiId}! (Status: PAID)`, 'success');

    // Create the order with PAID status
    await this.finalizeOrderPlacement({
      payment_method: 'UPI',
      payment_status: 'PAID',
      upi_id: upiId.trim()
    });
  },

  confirmUpiSuccess() {
    return this.confirmUpiPayment(false);
  },

  showCardSimulationModal(amount) {
    const formattedAmt = Number(amount || 0).toFixed(2);

    const amtEl = document.getElementById('card-modal-amount');
    if (amtEl) amtEl.textContent = `₹${formattedAmt}`;

    const mobAmtEl = document.getElementById('mob-card-modal-amount');
    if (mobAmtEl) mobAmtEl.textContent = `₹${formattedAmt}`;

    // Pre-fill student name
    const nameInput = document.getElementById('card-name-input');
    if (nameInput && this.currentUser) {
      nameInput.value = this.currentUser.name;
      const previewName = document.getElementById('card-preview-name');
      if (previewName) previewName.textContent = this.currentUser.name.toUpperCase();
    }

    App.openModal('card-payment-modal');
  },

  formatCardNumberInput(input) {
    if (!input) return;
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val;
    input.value = formatted;

    // Update virtual card preview (Masked sensitive digits)
    const preview = document.getElementById('card-preview-number');
    if (preview) {
      const last4 = val.slice(-4) || '8821';
      preview.textContent = `•••• •••• •••• ${last4}`;
    }
  },

  formatCardExpiryInput(input) {
    if (!input) return;
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }
    input.value = val;

    const preview = document.getElementById('card-preview-expiry');
    if (preview) {
      preview.textContent = val || '12/28';
    }
  },

  async confirmCardPayment(simulateFailure = false) {
    if (simulateFailure) {
      // Step 11 Requirement: Payment status FAILED simulation
      App.closeModal('card-payment-modal');
      App.showToast('Simulated Card Payment Declined by Test Bank. Payment status: FAILED', 'error');
      return;
    }

    // Read card inputs
    const cardNumEl = document.getElementById('card-number-input') || document.getElementById('mob-card-number-input');
    const expiryEl = document.getElementById('card-expiry-input') || document.getElementById('mob-card-expiry-input');
    const cvvEl = document.getElementById('card-cvv-input') || document.getElementById('mob-card-cvv-input');

    const rawNum = cardNumEl ? cardNumEl.value.replace(/\D/g, '') : '4532892012348821';
    const expiry = expiryEl ? expiryEl.value.trim() : '12/28';
    const cvv = cvvEl ? cvvEl.value.trim() : '429';

    if (rawNum.length < 13 || rawNum.length > 19) {
      App.showToast('Please enter a valid card number (13-19 digits)', 'warning');
      return;
    }

    if (expiry.length < 4 || !expiry.includes('/')) {
      App.showToast('Please enter a valid expiry date (MM/YY)', 'warning');
      return;
    }

    if (cvv.length < 3) {
      App.showToast('Please enter a valid 3-digit CVV', 'warning');
      return;
    }

    // Step 11 Security Requirement: Do not store sensitive card information in plaintext
    // Mask sensitive details (CVV is discarded completely)
    const last4 = rawNum.slice(-4) || '8821';
    const maskedCard = `•••• •••• •••• ${last4}`;
    const brand = rawNum.startsWith('4') ? 'Visa' : (rawNum.startsWith('5') ? 'Mastercard' : 'RuPay');

    App.closeModal('card-payment-modal');
    App.showToast(`Simulated Card Payment Authorized! (${brand} ${maskedCard}) • Status: PAID`, 'success');

    // Create order with PAID status & masked card
    await this.finalizeOrderPlacement({
      payment_method: 'Card',
      payment_status: 'PAID',
      card_masked: maskedCard,
      card_brand: brand
    });
  },

  async finalizeOrderPlacement(paymentOptions = {}) {
    // Step 10 Requirement: Do not create duplicate orders
    if (this.isPlacingOrder) {
      App.showToast('Order is already being placed...', 'info');
      return;
    }
    this.isPlacingOrder = true;

    const notesEl = document.getElementById('checkout-instructions-input') || 
                    document.getElementById('mob-checkout-instructions-input');
    const instructions = notesEl ? notesEl.value.trim() : '';

    const resolvedMethod = paymentOptions.payment_method || this.selectedPaymentMethod || 'UPI';
    const resolvedStatus = paymentOptions.payment_status || (resolvedMethod === 'Cash' ? 'PENDING' : 'PAID');

    const orderPayload = {
      user_id: this.currentUser.id,
      customer_name: this.currentUser.name,
      customer_phone: this.currentUser.phone,
      items: this.cart.map(c => ({ product_id: c.productId, name: c.name, price: c.price, quantity: c.quantity })),
      coupon_code: this.appliedCoupon ? this.appliedCoupon.code : null,
      payment_method: resolvedMethod,
      payment_status: resolvedStatus,
      upi_id: paymentOptions.upi_id || (resolvedMethod === 'UPI' ? 'student@okaxis' : null),
      card_masked: paymentOptions.card_masked || null,
      card_brand: paymentOptions.card_brand || null,
      pickup_slot: this.selectedPickupSlot,
      redeem_loyalty_points: this.redeemLoyalty,
      special_instructions: instructions
    };

    try {
      const res = await window.api.createOrder(orderPayload);
      if (res && res.is_duplicate) {
        // Handled duplicate order gracefully
        this.cart = [];
        this.appliedCoupon = null;
        this.saveCartToSession();
        this.updateCartBadge();
        this.showOrderConfirmation(res.order);
        App.showToast('Order already confirmed! Showing your token CB-Express.', 'info');
        return;
      }

      if (res && res.success && res.order) {
        const order = res.order;
        this.currentTrackOrderId = order.id;

        this.cart = [];
        this.appliedCoupon = null;
        this.redeemLoyalty = false;
        this.saveCartToSession();
        this.updateCartBadge();
        if (notesEl) notesEl.value = '';

        await this.refreshUserLoyalty();
        this.showOrderConfirmation(order);

        if (window.AdminApp) {
          window.AdminApp.loadOrders();
          window.AdminApp.loadKPIsAndAnalytics();
        }

        const statusMsg = order.payment_status === 'PENDING' ? 'Payment: PENDING (Pay at Counter)' : 'Payment: PAID';
        App.showToast(`Order #${order.id} placed into MongoDB! ${statusMsg}`, 'success');
      } else {
        App.showToast((res && res.message) || 'Failed to place order.', 'error');
      }
    } catch (e) {
      App.showToast('Failed to place order. Please try again.', 'error');
    } finally {
      this.isPlacingOrder = false;
    }
  },

  // ==========================================
  // Step 10: Order Confirmation & Token Generator
  // ==========================================
  // ==========================================
  // Step 12: Professional Order Confirmation Screen
  // Displays: Order ID, Order items, Total amount, Payment status, 
  // Pickup slot, Order date/time, Estimated preparation time
  // Buttons: TRACK ORDER, VIEW ORDER HISTORY, BACK TO HOME
  // ==========================================
  showOrderConfirmation(order) {
    if (!order) return;

    this.currentTrackOrderId = order.id;

    // Save in session storage for persistence
    try {
      sessionStorage.setItem('campusbite_last_order', JSON.stringify(order));
    } catch (e) {}

    // 1. Order ID (e.g. Order #CB1024)
    const tokenDisplay = `#${order.id}`;
    const fullOrderLabel = `Order #${order.id}`;
    
    const tokenEl = document.getElementById('conf-order-id');
    if (tokenEl) tokenEl.textContent = tokenDisplay;
    const orderIdLabel = document.getElementById('conf-order-id-label');
    if (orderIdLabel) orderIdLabel.textContent = fullOrderLabel;
    
    const mobTokenEl = document.getElementById('confirm-token-number');
    if (mobTokenEl) mobTokenEl.textContent = tokenDisplay;
    const mobOrderIdLabel = document.getElementById('mob-confirm-order-id-label');
    if (mobOrderIdLabel) mobOrderIdLabel.textContent = fullOrderLabel;

    // 2. Pickup Counter
    const counterText = `Counter ${order.pickup_counter || 2} Express`;
    const counterEl = document.getElementById('conf-pickup-counter');
    if (counterEl) counterEl.textContent = counterText;
    const counterVal = document.getElementById('conf-counter-val');
    if (counterVal) counterVal.textContent = counterText;
    const mobCounterEl = document.getElementById('confirm-counter-badge');
    if (mobCounterEl) mobCounterEl.textContent = counterText;

    // 3. Pickup Slot (e.g. Pickup: 12:30 PM – 12:45 PM)
    const rawSlot = order.pickup_slot || this.selectedPickupSlot || '12:30 PM – 12:45 PM';
    const pickupSlotText = `Pickup: ${rawSlot}`;

    const slotEl = document.getElementById('conf-pickup-slot');
    if (slotEl) slotEl.textContent = pickupSlotText;
    const slotLabel = document.getElementById('conf-pickup-slot-label');
    if (slotLabel) slotLabel.textContent = pickupSlotText;

    const mobSlotEl = document.getElementById('confirm-slot-time');
    if (mobSlotEl) mobSlotEl.textContent = pickupSlotText;
    const mobSlotDetail = document.getElementById('confirm-slot-detail');
    if (mobSlotDetail) mobSlotDetail.textContent = rawSlot;

    // 4. Payment Status (e.g. Payment: Paid or Payment: Pending)
    const isPaid = String(order.payment_status).toUpperCase() === 'PAID' || 
                   (order.payment_status !== 'PENDING' && order.payment_method !== 'Cash');
    const paymentStatusText = isPaid ? 'Payment: Paid' : 'Payment: Pending';

    // Desktop Payment Status Badges & Labels
    const paymentBadge = document.getElementById('conf-payment-status-badge');
    if (paymentBadge) {
      paymentBadge.textContent = paymentStatusText;
      paymentBadge.style.background = isPaid ? '#DCFCE7' : '#FEF3C7';
      paymentBadge.style.color = isPaid ? '#15803D' : '#B45309';
      paymentBadge.style.borderColor = isPaid ? '#86EFAC' : '#FDE68A';
    }

    const receiptStatusPill = document.getElementById('conf-receipt-status-pill');
    if (receiptStatusPill) {
      receiptStatusPill.textContent = paymentStatusText;
      receiptStatusPill.style.background = isPaid ? '#DCFCE7' : '#FEF3C7';
      receiptStatusPill.style.color = isPaid ? '#15803D' : '#B45309';
    }

    const paymentModeEl = document.getElementById('conf-payment-method');
    if (paymentModeEl) {
      if (!isPaid) {
        paymentModeEl.innerHTML = `<span style="color:#D97706;font-weight:700;">Payment: Pending</span> <span style="font-size:11.5px;color:#64748B;">(Pay at Counter)</span>`;
      } else if (order.payment_method === 'Card') {
        const masked = order.card_masked || '•••• 8821';
        paymentModeEl.innerHTML = `<span style="color:#10B981;font-weight:700;">Payment: Paid</span> <span style="font-size:11.5px;color:#64748B;">(Card: ${masked})</span>`;
      } else if (order.payment_method === 'UPI') {
        const vpa = order.upi_id || 'student@okaxis';
        paymentModeEl.innerHTML = `<span style="color:#10B981;font-weight:700;">Payment: Paid</span> <span style="font-size:11.5px;color:#64748B;">(UPI: ${vpa})</span>`;
      } else {
        paymentModeEl.innerHTML = `<span style="color:#10B981;font-weight:700;">Payment: Paid</span> <span style="font-size:11.5px;color:#64748B;">(${order.payment_method || 'Wallet'})</span>`;
      }
    }

    // Mobile Payment Status Badges & Labels
    const mobPaymentBadge = document.getElementById('confirm-payment-badge-mob');
    if (mobPaymentBadge) {
      mobPaymentBadge.textContent = paymentStatusText;
      mobPaymentBadge.style.background = isPaid ? '#DCFCE7' : '#FEF3C7';
      mobPaymentBadge.style.color = isPaid ? '#15803D' : '#B45309';
      mobPaymentBadge.style.borderColor = isPaid ? '#86EFAC' : '#FDE68A';
    }

    const mobPaymentDetail = document.getElementById('confirm-payment-status-detail');
    if (mobPaymentDetail) {
      mobPaymentDetail.textContent = paymentStatusText;
      mobPaymentDetail.style.color = isPaid ? '#10B981' : '#D97706';
    }

    const mobPaymentStatusEl = document.getElementById('confirm-payment-status-mob');
    if (mobPaymentStatusEl) {
      mobPaymentStatusEl.textContent = paymentStatusText;
      mobPaymentStatusEl.style.color = isPaid ? '#10B981' : '#D97706';
    }

    // Customer Name
    const nameEl = document.getElementById('conf-customer-name');
    if (nameEl) nameEl.textContent = order.customer_name || (this.currentUser ? this.currentUser.name : 'Jaswant Karun');

    // 5. Order Date / Time (e.g. 09 Oct 2026, 12:30 PM)
    const d = order.created_at ? new Date(order.created_at) : new Date();
    const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullDateTime = `${formattedDate}, ${formattedTime}`;

    const timeEl = document.getElementById('conf-timestamp');
    if (timeEl) timeEl.textContent = fullDateTime;
    const mobDateTimeEl = document.getElementById('confirm-order-datetime-mob');
    if (mobDateTimeEl) mobDateTimeEl.textContent = `${formattedDate}, ${formattedTime}`;

    // 6. Estimated Preparation Time (e.g. ~8–12 mins)
    const totalItemsCount = (order.items || []).reduce((sum, i) => sum + (i.quantity || 1), 0);
    const basePrep = Math.min(20, Math.max(8, 6 + (totalItemsCount * 2)));
    const prepEstimateText = `⏱ ~${basePrep - 2}–${basePrep + 2} mins`;

    const prepEl = document.getElementById('conf-prep-time');
    if (prepEl) prepEl.textContent = prepEstimateText;
    const mobPrepEl = document.getElementById('confirm-prep-time-mob');
    if (mobPrepEl) mobPrepEl.textContent = prepEstimateText;

    // 7. Total Amount (e.g. ₹180)
    const totalText = `₹${order.total_amount}`;
    const totalEl = document.getElementById('conf-total-amount');
    if (totalEl) totalEl.textContent = totalText;
    const mobTotalEl = document.getElementById('confirm-total-amount-mob');
    if (mobTotalEl) mobTotalEl.textContent = totalText;

    // 8. Loyalty Points Earned (10% Cashback)
    const points = order.loyalty_points_earned !== undefined ? order.loyalty_points_earned : Math.floor(order.total_amount / 10);
    const pointsText = `+${points} Points`;
    const pointsEl = document.getElementById('conf-points-earned');
    if (pointsEl) pointsEl.textContent = pointsText;
    const mobPointsEl = document.getElementById('confirm-loyalty-points-mob');
    if (mobPointsEl) mobPointsEl.textContent = pointsText;

    // 9. Order Items List Breakdown (Desktop)
    const itemsListEl = document.getElementById('conf-items-list');
    if (itemsListEl && order.items && order.items.length) {
      itemsListEl.innerHTML = order.items.map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 0;border-bottom:1px solid #F1F5F9;font-size:12.5px;">
          <div>
            <strong style="color:var(--text-primary);">${i.name}</strong>
            <span style="color:#64748B;font-size:11px;margin-left:6px;">₹${i.price} × ${i.quantity}</span>
          </div>
          <span style="font-weight:700;color:var(--text-primary);">₹${i.price * i.quantity}</span>
        </div>
      `).join('');
    }

    // 10. Order Items List Breakdown (Mobile)
    const mobItemsListEl = document.getElementById('confirm-items-list-mob');
    const mobItemsCountBadge = document.getElementById('confirm-items-count-badge-mob');
    if (mobItemsCountBadge) {
      mobItemsCountBadge.textContent = `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'}`;
    }
    if (mobItemsListEl && order.items && order.items.length) {
      mobItemsListEl.innerHTML = order.items.map(i => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#334155;padding:2px 0;">
          <div>
            <strong>${i.name}</strong>
            <span style="color:#64748B;font-size:11px;"> × ${i.quantity}</span>
          </div>
          <strong style="color:#0F172A;">₹${i.price * i.quantity}</strong>
        </div>
      `).join('');
    }

    // 11. Contactless QR Code Generation
    const qrData = `CAMPUSBITE:${order.id}:${order.customer_name || 'Student'}:${order.total_amount}`;
    if (window.CampusQR) {
      window.CampusQR.renderTo('conf-pickup-qr', qrData, 78);
      window.CampusQR.renderTo('confirm-token-qr-mob', qrData, 64);
    }

    this.navigateTo('confirmation');
  },

  viewOrderHistory() {
    this.navigateTo('profile');
    setTimeout(() => {
      const historyEl = document.getElementById('profile-order-history-list') || 
                        document.getElementById('screen-profile');
      if (historyEl) {
        historyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  },

  async renderTracking(orderId) {
    const targetId = orderId || this.currentTrackOrderId || 'CB1024';
    try {
      const res = await window.api.getOrder(targetId);
      if (res.success && res.order) {
        const o = res.order;
        this.currentTrackOrderId = o.id;

        document.getElementById('track-order-id-badge').textContent = `ORDER #${o.id}`;
        document.getElementById('track-counter-num').textContent = `Counter ${o.pickup_counter}`;
        document.getElementById('track-slot-text').textContent = o.pickup_slot;

        const itemsText = o.items.map(i => `${i.name} × ${i.quantity}`).join(', ');
        document.getElementById('track-items-summary').textContent = itemsText;
        document.getElementById('track-total-paid').textContent = `₹${o.total_amount} (${o.payment_method})`;

        const stages = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Completed'];
        const currentIdx = stages.indexOf(o.order_status);

        stages.forEach((stage, idx) => {
          const stepElem = document.getElementById(`track-step-${stage.toLowerCase()}`);
          if (stepElem) {
            stepElem.classList.remove('completed', 'current');
            if (idx < currentIdx) {
              stepElem.classList.add('completed');
            } else if (idx === currentIdx) {
              stepElem.classList.add('current');
            }
          }
        });

        const readyAlert = document.getElementById('order-ready-banner-alert');
        if (readyAlert) {
          readyAlert.style.display = o.order_status === 'Ready' ? 'block' : 'none';
        }

        // Render Contactless Pickup QR Code
        if (window.CampusQR) {
          window.CampusQR.renderTo('tracking-qr-container', `CAMPUSBITE:${o.id}:${o.customer_name}:${o.total_amount}`, 150);
        }
      }
    } catch (e) {
      console.warn("Could not load tracking order", e);
    }
  },

  // ==========================================
  // CampusPay Digital Wallet
  // ==========================================
  updateWalletUI() {
    const balanceElem = document.getElementById('wallet-balance-display');
    if (balanceElem) {
      balanceElem.textContent = `₹${this.currentUser.wallet_balance}`;
    }
    const nameEl = document.getElementById('wallet-student-name');
    if (nameEl) nameEl.textContent = this.currentUser.name.toUpperCase();
    const idEl = document.getElementById('wallet-student-id');
    if (idEl) idEl.textContent = this.currentUser.studentId;
  },

  topUpWallet(amount) {
    const num = Number(amount) || 100;
    this.currentUser.wallet_balance += num;
    this.updateWalletUI();
    App.showToast(`Successfully added ₹${num} to your CampusPay Wallet!`, 'success');
  },

  // Profile & History
  async renderProfile() {
    await this.refreshUserLoyalty();

    const nameEl = document.getElementById('profile-user-name') || document.getElementById('profile-name-display');
    if (nameEl) nameEl.textContent = this.currentUser.name || 'Campus Student';

    const idEl = document.getElementById('profile-user-id') || document.getElementById('profile-id-display');
    if (idEl) idEl.textContent = `${this.currentUser.studentId || 'CB-2024-2028'} • ${this.currentUser.department || 'Computer Science'}`;

    const phoneEl = document.getElementById('profile-user-phone') || document.getElementById('profile-phone-display');
    if (phoneEl) phoneEl.textContent = `${this.currentUser.phone || '87541 59344'}`;

    const ptsEl = document.getElementById('profile-loyalty-pts');
    if (ptsEl) ptsEl.textContent = `${this.currentUser.loyalty_points || 0} Pts`;

    const avatarEl = document.getElementById('profile-avatar-display');
    if (avatarEl) {
      const parts = (this.currentUser.name || 'ST').split(' ');
      avatarEl.textContent = (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
    }

    try {
      const data = await window.api.getOrders({ user_id: this.currentUser.id });
      const historyContainer = document.getElementById('profile-order-history-list');
      if (historyContainer && data.orders) {
        if (!data.orders.length) {
          historyContainer.innerHTML = '<p style="font-size:12px;color:#94A3B8;">No past orders yet</p>';
          return;
        }

        historyContainer.innerHTML = data.orders.map(o => `
          <div style="background:white;border:1px solid #E2E8F0;border-radius:12px;padding:12px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="font-weight:700;font-size:13px;color:#0F172A;">#${o.id}</span>
              <span style="font-size:11px;font-weight:700;color:${o.order_status === 'Ready' ? '#10B981' : '#64748B'};">${o.order_status}</span>
            </div>
            <div style="font-size:12px;color:#64748B;margin:4px 0;">
              ${o.items.map(i => `${i.name} × ${i.quantity}`).join(', ')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;border-top:1px dashed #E2E8F0;padding-top:6px;">
              <span style="font-weight:800;font-size:13px;color:#0F172A;">₹${o.total_amount}</span>
              <button class="add-mini-btn" style="width:auto;padding:3px 10px;" onclick="StudentApp.reorderPastItems('${o.id}')">
                Reorder
              </button>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn("Failed to load history", e);
    }
  },

  async reorderPastItems(orderId) {
    try {
      const res = await window.api.getOrder(orderId);
      if (res.success && res.order) {
        res.order.items.forEach(i => {
          for (let q = 0; q < i.quantity; q++) {
            this.addToCart(i.product_id);
          }
        });
        this.navigateTo('cart');
        App.showToast(`Loaded items from #${orderId} into cart!`, 'success');
      }
    } catch (e) {
      App.showToast('Reorder failed', 'error');
    }
  },

  async refreshUserLoyalty() {
    try {
      const res = await window.api.getLoyalty(this.currentUser.id);
      if (res.success) {
        this.currentUser.loyalty_points = res.loyalty_points;
        const chip = document.getElementById('home-loyalty-chip-pts');
        if (chip) chip.textContent = `${res.loyalty_points} pts`;
      }
    } catch (e) {}
  },

  openReviewModal() {
    App.openModal('customer-review-modal');
  },

  async submitCustomerReview() {
    const rating = document.getElementById('review-rating-select').value;
    const comment = document.getElementById('review-comment-input').value;

    try {
      const res = await window.api.submitReview({
        order_id: this.currentTrackOrderId || 'CB1024',
        user_name: this.currentUser.name,
        rating: Number(rating),
        food_quality: 5,
        service_speed: 5,
        app_experience: 5,
        comment: comment || 'Awesome food and zero queue!'
      });

      if (res.success) {
        App.closeModal('customer-review-modal');
        App.showToast('Review submitted to MongoDB! Thank you.', 'success');
      }
    } catch (e) {
      App.showToast('Review submission failed', 'error');
    }
  },

  /* Kinetic Video-Motion Typography Cycler */
  initKineticTypography() {
    const el = document.getElementById('hero-kinetic-text');
    if (!el) return;
    if (this.kineticTimer) clearInterval(this.kineticTimer);

    this.kineticTimer = setInterval(() => {
      this.kineticIndex = (this.kineticIndex + 1) % this.kineticWords.length;
      el.classList.add('transitioning');
      setTimeout(() => {
        el.textContent = this.kineticWords[this.kineticIndex];
        el.classList.remove('transitioning');
      }, 250);
    }, 2800);
  },

  /* Unique Feature 1: Study-Group Bench Food Pooling */
  openGroupPoolModal() {
    this.renderGroupPoolMembers();
    App.openModal('group-pool-modal');
  },

  openVsComparisonModal() {
    App.openModal('vs-comparison-modal');
  },

  copyBenchCode() {
    const code = document.getElementById('group-pool-code')?.textContent || '#LAB-CSBS-B4';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    App.showToast(`Bench Code ${code} copied! Share with your lab table.`, 'success');
  },

  addItemToGroupPool() {
    const sel = document.getElementById('group-pool-quick-select');
    if (!sel) return;
    const selectedText = sel.options[sel.selectedIndex]?.text || '';
    const match = selectedText.match(/₹(\d+)/);
    const price = match ? parseInt(match[1]) : 70;
    const cleanName = selectedText.replace(/\(₹\d+\)/, '').trim();

    this.groupPoolMembers.push({
      name: `${this.currentUser.name} (Added item)`,
      avatar: this.currentUser.avatar || 'JK',
      item: cleanName,
      price: price
    });

    this.renderGroupPoolMembers();
    App.showToast(`Added ${cleanName} to Bench Pool Tray!`, 'success');
  },

  renderGroupPoolMembers() {
    const container = document.getElementById('group-pool-members-list');
    const totalEl = document.getElementById('group-pool-total-val');
    const splitEl = document.getElementById('group-pool-split-val');
    if (!container) return;

    let total = 0;
    container.innerHTML = this.groupPoolMembers.map(m => {
      total += m.price;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-elevated);border:1px solid var(--border-subtle);border-radius:10px;padding:8px 12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span>${m.avatar}</span>
            <div>
              <strong style="font-size:12.5px;color:var(--text-primary);">${m.name}</strong>
              <div style="font-size:11px;color:var(--text-muted);">Added: ${m.item} (₹${m.price})</div>
            </div>
          </div>
          <span style="font-size:12.5px;font-weight:800;color:var(--text-primary);">₹${m.price}</span>
        </div>
      `;
    }).join('');

    const count = Math.max(1, this.groupPoolMembers.length);
    const split = Math.round(total / count);

    if (totalEl) totalEl.textContent = `₹${total}`;
    if (splitEl) splitEl.textContent = `₹${split} / person (${count} friends)`;
  },

  confirmGroupPoolOrder() {
    const total = this.groupPoolMembers.reduce((sum, m) => sum + m.price, 0);
    const split = Math.round(total / Math.max(1, this.groupPoolMembers.length));

    App.closeModal('group-pool-modal');
    App.showToast(`Group Bench Order Placed: Token #T-BENCH-402 ready at Counter 2. Share ₹${split} paid.`, 'success');

    if (window.NotificationHandler) {
      window.NotificationHandler.showLocalNotification(
        'Bench Pool Order Confirmed',
        `Token #T-BENCH-402 ready for lab group at Counter 2. 1 person picks up for all.`
      );
    }
  }
};

window.StudentApp = StudentApp;

// Global helper functions for Step 9 Coupon System
function applyCouponCode(code) { return StudentApp.applyCouponCode(code); }
function removeCoupon() { return StudentApp.removeCoupon(); }
function updateAppliedCouponUI() { return StudentApp.updateAppliedCouponUI(); }
function calculateCartBill() { return StudentApp.calculateCartBill(); }

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { StudentApp, applyCouponCode, removeCoupon, updateAppliedCouponUI, calculateCartBill };
}
