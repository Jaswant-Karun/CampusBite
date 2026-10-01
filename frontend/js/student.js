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
    avatar: "👨🎓"
  },

  selectedAuthRole: 'student',
  currentAuthTab: 'signin',
  cart: [],
  appliedCoupon: null,
  redeemLoyalty: false,
  selectedPickupSlot: "12:30 PM – 12:40 PM",
  selectedPaymentMethod: "UPI",
  currentTrackOrderId: "CB1024",
  products: [],
  customizingProduct: null,

  init() {
    this.bindEvents();
    this.loadProducts();
    this.updateCartBadge();
    this.refreshUserLoyalty();
    this.updateWalletUI();
  },

  bindEvents() {
    // Bottom nav tabs
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
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

    // Search input
    const searchInput = document.getElementById('student-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
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

  navigateTo(screenId) {
    document.querySelectorAll('.mob-screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add('active');
    }

    // Update bottom nav highlighting
    document.querySelectorAll('.mobile-bottom-nav .nav-item').forEach(btn => {
      if (btn.dataset.screen === screenId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Bottom nav visibility: hide on motion-splash and login
    const bottomNav = document.querySelector('.mobile-bottom-nav');
    if (bottomNav) {
      if (['motion-splash', 'login'].includes(screenId)) {
        bottomNav.style.display = 'none';
      } else {
        bottomNav.style.display = 'flex';
      }
    }

    if (screenId === 'cart') {
      this.renderCart();
    } else if (screenId === 'profile') {
      this.renderProfile();
    } else if (screenId === 'tracking') {
      this.renderTracking(this.currentTrackOrderId);
    } else if (screenId === 'wallet') {
      this.updateWalletUI();
    }
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
      if (submitBtn) submitBtn.textContent = 'Create Student Account →';
      if (registerFields) registerFields.style.display = 'block';
    } else {
      if (submitBtn) submitBtn.textContent = 'Sign In to CampusBite →';
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
        if (icon) icon.textContent = '🙈';
      } else {
        pwdInput.type = 'password';
        if (icon) icon.textContent = '👁️';
      }
    }
  },

  async handleAuthSubmit() {
    const email = document.getElementById('auth-email-input').value;
    if (!email) {
      App.showToast('Please enter your campus email or phone', 'warning');
      return;
    }

    try {
      const res = await window.api.login({
        email,
        role: this.selectedAuthRole
      });

      if (res.success && res.user) {
        this.currentUser = {
          ...this.currentUser,
          ...res.user
        };

        App.showToast(`Welcome ${res.user.name}! Authenticated with MongoDB.`, 'success');

        if (this.selectedAuthRole === 'admin') {
          App.switchViewMode('admin');
        } else {
          this.navigateTo('home');
        }
      }
    } catch (e) {
      App.showToast('Sign in processed', 'info');
      this.navigateTo('home');
    }
  },

  quickLogin(role, email) {
    this.selectAuthRole(role);
    const emailInput = document.getElementById('auth-email-input');
    if (emailInput) emailInput.value = email;

    if (role === 'admin') {
      App.showToast('Logged in as Ramesh (Canteen Manager)', 'success');
      App.switchViewMode('admin');
    } else {
      App.showToast(`Logged in as ${role === 'staff' ? 'Chef Raju (Kitchen)' : 'Jaswant (Student)'}`, 'success');
      this.navigateTo('home');
    }
  },

  // ==========================================
  // Product Catalog & Customization
  // ==========================================
  async loadProducts() {
    try {
      const data = await window.api.getProducts();
      if (data && data.products) {
        this.products = data.products;
        this.renderPopularItems();
        this.renderMenuList(this.products);
      }
    } catch (e) {
      console.warn("Using cached products", e);
    }
  },

  renderPopularItems() {
    const container = document.getElementById('home-popular-container');
    if (!container) return;

    const popular = this.products.filter(p => p.popular).slice(0, 5);
    container.innerHTML = popular.map(item => `
      <div class="popular-food-card" onclick="StudentApp.openCustomizationModal('${item.id}')">
        <div class="popular-card-emoji">${item.image_emoji}</div>
        <div class="popular-card-name">${item.name}</div>
        <div class="popular-card-price">₹${item.price}</div>
        <button class="add-mini-btn" onclick="event.stopPropagation(); StudentApp.openCustomizationModal('${item.id}')">
          + Add
        </button>
      </div>
    `).join('');
  },

  renderMenuList(itemsToRender) {
    const container = document.getElementById('menu-items-container');
    if (!container) return;

    if (!itemsToRender.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:#94A3B8;">
          <div style="font-size:36px;margin-bottom:8px;">🔍</div>
          <p style="font-weight:600;">No delicious items match your search</p>
        </div>
      `;
      return;
    }

    container.innerHTML = itemsToRender.map(item => {
      const inCart = this.cart.find(c => c.productId === item.id);
      const qty = inCart ? inCart.quantity : 0;

      return `
        <div class="food-card-row" onclick="StudentApp.openCustomizationModal('${item.id}')">
          <div class="food-emoji-wrap">
            <span class="${item.is_veg ? 'veg-indicator' : 'non-veg-indicator'}"></span>
            ${item.image_emoji}
          </div>
          <div class="food-info-col">
            <div class="food-title">
              <span>${item.name}</span>
              <span style="font-size:11px;color:#F59E0B;font-weight:700;">★ ${item.rating}</span>
            </div>
            <div class="food-desc">${item.description}</div>
            <div class="food-bottom-row">
              <span class="food-price">₹${item.price}</span>
              <div class="food-action-stepper" onclick="event.stopPropagation();">
                ${qty > 0 ? `
                  <button class="stepper-btn" onclick="StudentApp.decrementCart('${item.id}')">-</button>
                  <span class="stepper-qty">${qty}</span>
                  <button class="stepper-btn" onclick="StudentApp.addToCart('${item.id}')">+</button>
                ` : `
                  <button class="add-mini-btn" style="padding:4px 12px;font-size:11.5px;" onclick="StudentApp.openCustomizationModal('${item.id}')">
                    + Add
                  </button>
                `}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  filterProducts(category) {
    if (!category || category === 'All') {
      this.renderMenuList(this.products);
    } else {
      const filtered = this.products.filter(p => p.category.toLowerCase() === category.toLowerCase());
      this.renderMenuList(filtered);
    }
  },

  searchProducts(query) {
    if (!query) {
      this.renderMenuList(this.products);
      return;
    }
    const q = query.toLowerCase();
    const filtered = this.products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    );
    this.renderMenuList(filtered);
  },

  toggleVegFilter(isVegOnly) {
    if (!isVegOnly) {
      this.renderMenuList(this.products);
    } else {
      const filtered = this.products.filter(p => p.is_veg);
      this.renderMenuList(filtered);
    }
  },

  // Customization Modal
  openCustomizationModal(productId) {
    const item = this.products.find(p => p.id === productId);
    if (!item) return;

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
            <input type="radio" name="cust-spice" value="Mild" checked> 🟢 Mild
          </label>
          <label style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:10px;text-align:center;font-size:11.5px;cursor:pointer;">
            <input type="radio" name="cust-spice" value="Medium"> 🟡 Medium
          </label>
          <label style="flex:1;padding:8px;background:rgba(255,255,255,0.06);border-radius:10px;text-align:center;font-size:11.5px;cursor:pointer;">
            <input type="radio" name="cust-spice" value="Spicy"> 🔴 Spicy 🔥
          </label>
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <label style="font-size:12px;font-weight:700;color:#CBD5E1;display:block;margin-bottom:6px;">Add-Ons & Extras:</label>
        <label style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(255,255,255,0.04);border-radius:10px;margin-bottom:6px;font-size:12.5px;cursor:pointer;">
          <span>🧀 Extra Melted Cheese Slice</span>
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
    App.closeModal('customization-modal');
    App.showToast(`Added ${this.customizingProduct.name} to cart!`, 'success');
  },

  addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const existing = this.cart.find(c => c.productId === productId);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image_emoji: product.image_emoji,
        quantity: 1
      });
    }

    this.updateCartBadge();
    this.renderMenuList(this.products);
    App.showToast(`Added ${product.name} to cart!`, 'success');
  },

  decrementCart(productId) {
    const index = this.cart.findIndex(c => c.productId === productId);
    if (index === -1) return;

    this.cart[index].quantity -= 1;
    if (this.cart[index].quantity <= 0) {
      this.cart.splice(index, 1);
    }

    this.updateCartBadge();
    this.renderMenuList(this.products);
    if (document.getElementById('screen-cart').classList.contains('active')) {
      this.renderCart();
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

    if (!this.cart.length) {
      if (emptyState) emptyState.style.display = 'block';
      if (fullState) fullState.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (fullState) fullState.style.display = 'block';

    itemsContainer.innerHTML = this.cart.map(item => `
      <div class="cart-item-card">
        <div class="cart-item-left">
          <div style="font-size:24px;">${item.image_emoji}</div>
          <div>
            <div class="cart-item-name">${item.name}</div>
            <div class="cart-item-price">₹${item.price} × ${item.quantity} = ₹${item.price * item.quantity}</div>
          </div>
        </div>
        <div class="food-action-stepper">
          <button class="stepper-btn" onclick="StudentApp.decrementCart('${item.productId}')">-</button>
          <span class="stepper-qty">${item.quantity}</span>
          <button class="stepper-btn" onclick="StudentApp.addToCart('${item.productId}')">+</button>
        </div>
      </div>
    `).join('');

    this.calculateCartBill();
  },

  calculateCartBill() {
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Coupon discount
    let couponDiscount = 0;
    if (this.appliedCoupon) {
      if (this.appliedCoupon.discount_type === 'percentage') {
        couponDiscount = Math.min(Math.round((subtotal * this.appliedCoupon.discount_value) / 100), this.appliedCoupon.max_discount || 100);
      } else {
        couponDiscount = Math.min(this.appliedCoupon.discount_value, subtotal);
      }
    }

    // Loyalty discount
    let loyaltyDiscount = 0;
    if (this.redeemLoyalty && this.currentUser.loyalty_points >= 100) {
      loyaltyDiscount = Math.min(Math.floor(this.currentUser.loyalty_points / 100) * 10, subtotal - couponDiscount);
    }

    const total = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);

    document.getElementById('cart-subtotal-val').textContent = `₹${subtotal}`;
    
    const couponRow = document.getElementById('cart-coupon-row');
    if (couponDiscount > 0) {
      couponRow.style.display = 'flex';
      document.getElementById('cart-coupon-val').textContent = `-₹${couponDiscount}`;
    } else {
      couponRow.style.display = 'none';
    }

    const loyaltyRow = document.getElementById('cart-loyalty-row');
    if (loyaltyDiscount > 0) {
      loyaltyRow.style.display = 'flex';
      document.getElementById('cart-loyalty-val').textContent = `-₹${loyaltyDiscount}`;
    } else {
      loyaltyRow.style.display = 'none';
    }

    document.getElementById('cart-total-val').textContent = `₹${total}`;
    document.getElementById('checkout-action-btn-text').textContent = `Pay ₹${total} & Place Order`;

    return { subtotal, couponDiscount, loyaltyDiscount, total };
  },

  async applyCouponCode(code) {
    const input = document.getElementById('coupon-input-field');
    const couponCode = (code || (input ? input.value : '')).trim();

    if (!couponCode) {
      App.showToast('Please enter a coupon code', 'warning');
      return;
    }

    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    try {
      const res = await window.api.applyCoupon(couponCode, subtotal);
      if (res.success) {
        this.appliedCoupon = res.coupon;
        this.calculateCartBill();
        App.showToast(res.message, 'success');
        if (input) input.value = res.coupon.code;
      }
    } catch (e) {
      App.showToast('Invalid coupon code or minimum order not met', 'error');
    }
  },

  toggleLoyaltyRedeem(checked) {
    this.redeemLoyalty = checked;
    this.calculateCartBill();
  },

  proceedToCheckout() {
    if (!this.cart.length) {
      App.showToast('Your cart is empty', 'warning');
      return;
    }
    this.navigateTo('checkout');
  },

  async executePaymentAndPlaceOrder() {
    const { subtotal, couponDiscount, loyaltyDiscount, total } = this.calculateCartBill();

    if (this.selectedPaymentMethod === 'UPI') {
      this.showUpiSimulationModal(total);
    } else if (this.selectedPaymentMethod === 'Wallet') {
      if (this.currentUser.wallet_balance < total) {
        App.showToast(`Insufficient CampusPay balance (₹${this.currentUser.wallet_balance}). Please top-up.`, 'warning');
        this.navigateTo('wallet');
        return;
      }
      this.currentUser.wallet_balance -= total;
      this.updateWalletUI();
      App.showToast(`Deducted ₹${total} from CampusPay Wallet!`, 'success');
      await this.finalizeOrderPlacement();
    } else {
      await this.finalizeOrderPlacement();
    }
  },

  showUpiSimulationModal(amount) {
    document.getElementById('upi-modal-amount').textContent = `₹${amount}`;
    App.openModal('upi-simulation-modal');
  },

  async confirmUpiSuccess() {
    App.closeModal('upi-simulation-modal');
    App.showToast('UPI Payment Approved! Verifying with MongoDB...', 'success');
    await this.finalizeOrderPlacement();
  },

  async finalizeOrderPlacement() {
    const orderPayload = {
      user_id: this.currentUser.id,
      customer_name: this.currentUser.name,
      customer_phone: this.currentUser.phone,
      items: this.cart.map(c => ({ product_id: c.productId, name: c.name, price: c.price, quantity: c.quantity })),
      coupon_code: this.appliedCoupon ? this.appliedCoupon.code : null,
      payment_method: this.selectedPaymentMethod,
      pickup_slot: this.selectedPickupSlot,
      redeem_loyalty_points: this.redeemLoyalty
    };

    try {
      const res = await window.api.createOrder(orderPayload);
      if (res.success && res.order) {
        const order = res.order;
        this.currentTrackOrderId = order.id;

        this.cart = [];
        this.appliedCoupon = null;
        this.redeemLoyalty = false;
        this.updateCartBadge();

        await this.refreshUserLoyalty();
        this.showOrderConfirmation(order);

        if (window.AdminApp) {
          window.AdminApp.loadOrders();
          window.AdminApp.loadKPIsAndAnalytics();
        }

        App.showToast(`Order #${order.id} placed into MongoDB! Token ready.`, 'success');
      }
    } catch (e) {
      App.showToast('Failed to place order. Please try again.', 'error');
    }
  },

  showOrderConfirmation(order) {
    document.getElementById('conf-order-id').textContent = `#${order.id}`;
    document.getElementById('conf-pickup-counter').textContent = `Counter ${order.pickup_counter}`;
    document.getElementById('conf-pickup-slot').textContent = order.pickup_slot;
    document.getElementById('conf-total-amount').textContent = `₹${order.total_amount}`;
    document.getElementById('conf-points-earned').textContent = `+${order.loyalty_points_earned} Points`;

    this.navigateTo('confirmation');
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

    document.getElementById('profile-user-name').textContent = this.currentUser.name;
    document.getElementById('profile-user-id').textContent = `${this.currentUser.studentId} • ${this.currentUser.department}`;
    const phoneEl = document.getElementById('profile-user-phone');
    if (phoneEl) {
      phoneEl.textContent = `📱 ${this.currentUser.phone}`;
    }
    document.getElementById('profile-loyalty-pts').textContent = this.currentUser.loyalty_points;

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
                🔄 Reorder
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
  }
};

window.StudentApp = StudentApp;
