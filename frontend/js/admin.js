/**
 * CampusBite - Admin Dashboard & Business Intelligence Controller
 */

const AdminApp = {
  currentTab: 'orders',
  orders: [],
  products: [],
  analyticsData: null,
  demandData: null,
  activeOrderFilter: 'All',

  init() {
    this.bindEvents();
    this.loadAllData();
  },

  bindEvents() {
    // Sidebar navigation
    document.querySelectorAll('.admin-sidebar .sidebar-item-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) {
          this.switchTab(tab);
        }
      });
    });

    // Orders filter chips
    document.querySelectorAll('.orders-filter-chips .order-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.orders-filter-chips .order-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeOrderFilter = btn.dataset.status;
        this.renderOrders();
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update sidebar active state
    document.querySelectorAll('.admin-sidebar .sidebar-item-btn').forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update panels
    document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`admin-tab-${tabId}`);
    if (target) {
      target.classList.add('active');
    }

    if (tabId === 'analytics') {
      this.renderAnalyticsCharts();
    } else if (tabId === 'demand') {
      this.loadDemandPredictions();
    } else if (tabId === 'inventory') {
      this.renderInventoryTable();
    } else if (tabId === 'marketing') {
      this.loadCoupons();
    } else if (tabId === 'reviews') {
      this.loadReviews();
    }
  },

  async loadAllData() {
    await Promise.all([
      this.loadKPIsAndAnalytics(),
      this.loadOrders(),
      this.loadProducts(),
      this.loadDemandPredictions()
    ]);
  },

  async loadKPIsAndAnalytics() {
    try {
      const data = await window.api.getAnalytics();
      if (data && data.success) {
        this.analyticsData = data;
        
        // Update KPI card numbers
        document.getElementById('kpi-revenue').textContent = `₹${data.kpis.today_revenue.toLocaleString()}`;
        document.getElementById('kpi-orders').textContent = data.kpis.today_orders;
        document.getElementById('kpi-customers').textContent = data.kpis.total_customers;
        document.getElementById('kpi-pending').textContent = data.kpis.pending_orders;
        document.getElementById('kpi-rating').textContent = `${data.kpis.avg_rating} ★`;
        document.getElementById('kpi-low-stock').textContent = data.kpis.low_stock_count;

        // Update sidebar badges
        const pendingBadge = document.getElementById('sidebar-pending-badge');
        if (pendingBadge) {
          pendingBadge.textContent = data.kpis.pending_orders;
          pendingBadge.style.display = data.kpis.pending_orders > 0 ? 'inline-block' : 'none';
        }

        const stockBadge = document.getElementById('sidebar-stock-badge');
        if (stockBadge) {
          stockBadge.textContent = data.kpis.low_stock_count;
        }

        if (this.currentTab === 'analytics') {
          this.renderAnalyticsCharts();
        }
      }
    } catch (e) {
      console.warn("Analytics fetch error:", e);
    }
  },

  async loadOrders() {
    try {
      const data = await window.api.getOrders();
      if (data && data.orders) {
        this.orders = data.orders;
        this.renderOrders();
      }
    } catch (e) {
      console.warn("Orders fetch error:", e);
    }
  },

  renderOrders() {
    const container = document.getElementById('admin-orders-grid');
    if (!container) return;

    let filtered = [...this.orders];
    if (this.activeOrderFilter !== 'All') {
      filtered = filtered.filter(o => o.order_status.toLowerCase() === this.activeOrderFilter.toLowerCase());
    }

    if (!filtered.length) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:50px; background:var(--bg-card); border-radius:16px; border:1px solid var(--border-subtle); color:var(--text-muted);">
          <div style="font-size:36px; margin-bottom:10px;">📋</div>
          <h4>No orders in "${this.activeOrderFilter}" status</h4>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(order => {
      const statusClass = order.order_status.toLowerCase();

      return `
        <div class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <div class="order-id-title">
                <span>#${order.id}</span>
                <span class="order-status-badge ${statusClass}">${order.order_status}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:15px;font-weight:800;color:var(--primary);">₹${order.total_amount}</span>
              <div style="font-size:10px;color:var(--text-muted);">${order.payment_method}</div>
            </div>
          </div>

          <div class="order-meta-info">
            <div>👤 <strong>${order.customer_name}</strong> (${order.customer_phone || 'Student'})</div>
            <div>📍 Pickup: <strong>Counter ${order.pickup_counter}</strong> • Slot: <strong>${order.pickup_slot}</strong></div>
          </div>

          <div class="order-items-box">
            ${order.items.map(item => `
              <div class="order-item-line">
                <span>${item.name} × ${item.quantity}</span>
                <span>₹${item.price * item.quantity}</span>
              </div>
            `).join('')}
          </div>

          <div class="order-actions-row">
            <span style="font-size:11.5px;color:var(--text-muted);">Action:</span>
            <div style="display:flex;gap:6px;">
              ${this.renderOrderActionButtons(order)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderOrderActionButtons(order) {
    switch (order.order_status) {
      case 'Placed':
        return `
          <button class="stage-advance-btn btn-confirm" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Confirmed')">
            ✓ Confirm
          </button>
        `;
      case 'Confirmed':
        return `
          <button class="stage-advance-btn btn-preparing" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Preparing')">
            🍳 Start Preparing
          </button>
        `;
      case 'Preparing':
        return `
          <button class="stage-advance-btn btn-ready" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Ready')">
            🔔 Mark Ready
          </button>
        `;
      case 'Ready':
        return `
          <button class="stage-advance-btn btn-complete" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Completed')">
            🏁 Complete Pickup
          </button>
        `;
      default:
        return `<span style="font-size:11px;color:var(--accent-emerald);">Order Fulfilled</span>`;
    }
  },

  async advanceOrderStatus(orderId, newStatus) {
    try {
      const res = await window.api.updateOrderStatus(orderId, newStatus);
      if (res.success) {
        App.showToast(`Order #${orderId} marked as ${newStatus}!`, 'success');
        await this.loadOrders();
        await this.loadKPIsAndAnalytics();

        // If the student is tracking this order, trigger refresh in mobile view
        if (window.StudentApp && window.StudentApp.currentTrackOrderId === orderId) {
          window.StudentApp.renderTracking(orderId);
        }
      }
    } catch (e) {
      App.showToast('Failed to update order status', 'error');
    }
  },

  async loadProducts() {
    try {
      const data = await window.api.getProducts();
      if (data && data.products) {
        this.products = data.products;
        this.renderInventoryTable();
      }
    } catch (e) {
      console.warn("Products error:", e);
    }
  },

  renderInventoryTable() {
    const tbody = document.getElementById('admin-inventory-tbody');
    if (!tbody) return;

    tbody.innerHTML = this.products.map(p => {
      let badgeClass = 'available';
      let badgeText = '🟢 Available';
      if (p.stock <= 2) {
        badgeClass = 'critical';
        badgeText = '🔴 Critical';
      } else if (p.stock <= 10) {
        badgeClass = 'low';
        badgeText = '🟡 Low Stock';
      }

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:24px;">${p.image_emoji || '🍲'}</span>
              <div>
                <strong style="color:var(--text-primary);font-size:13.5px;">${p.name}</strong>
                <div style="font-size:11px;color:var(--text-muted);">${p.category} • ${p.prep_time || '5-8 mins'} ${p.is_veg ? '• 🟢 Veg' : '• 🔴 Non-Veg'}</div>
              </div>
            </div>
          </td>
          <td>
            <!-- Interactive Quick Price Edit -->
            <div style="display:inline-flex;align-items:center;gap:4px;background:var(--bg-elevated, #F8FAFC);padding:3px 6px;border-radius:8px;border:1px solid #CBD5E1;">
              <span style="font-weight:700;color:var(--text-secondary);font-size:13px;">₹</span>
              <input 
                type="number" 
                min="1" 
                max="9999" 
                value="${p.price}" 
                id="price-input-${p.id}"
                style="width:58px;padding:3px 5px;border:1px solid #CBD5E1;border-radius:6px;font-weight:800;font-size:13px;color:#0F172A;background:#FFFFFF;outline:none;"
                title="Enter new price and click Save or press Enter"
                onkeydown="if(event.key==='Enter') AdminApp.saveInlinePrice('${p.id}')"
              />
              <button 
                class="btn-primary" 
                onclick="AdminApp.saveInlinePrice('${p.id}')" 
                title="Save new price immediately"
                style="padding:3px 8px;font-size:11px;font-weight:700;border-radius:6px;min-width:auto;height:auto;"
              >
                Save
              </button>
            </div>
          </td>
          <td>
            <div class="stock-adjust-controls">
              <button class="stock-ctrl-btn" onclick="AdminApp.adjustStock('${p.id}', -1)">-</button>
              <span class="stock-count-number">${p.stock}</span>
              <button class="stock-ctrl-btn" onclick="AdminApp.adjustStock('${p.id}', 1)">+</button>
            </div>
          </td>
          <td>
            <span class="stock-badge-pill ${badgeClass}">${badgeText}</span>
          </td>
          <td>
            <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
              <input type="checkbox" ${p.is_available ? 'checked' : ''} onchange="AdminApp.toggleAvailability('${p.id}', this.checked)">
              <span style="font-weight:600;">${p.is_available ? 'Active' : 'Disabled'}</span>
            </label>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:6px;">
              <button class="btn-outline" onclick="AdminApp.openEditProductModal('${p.id}')" style="padding:4px 10px;font-size:11.5px;border-radius:6px;font-weight:600;" title="Full Dish & Price Details">
                ✏️ Edit
              </button>
              <button class="btn-outline" onclick="AdminApp.deleteProduct('${p.id}')" style="padding:4px 8px;font-size:11.5px;border-radius:6px;color:#DC2626;border-color:rgba(220,38,38,0.3);" title="Remove Dish">
                🗑️
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* 1-Click Inline Price Save */
  async saveInlinePrice(productId) {
    const input = document.getElementById(`price-input-${productId}`);
    if (!input) return;
    const newPrice = Number(input.value);

    if (isNaN(newPrice) || newPrice <= 0) {
      App.showToast('Please enter a valid price greater than 0', 'warning');
      return;
    }

    const product = this.products.find(p => p.id === productId);
    const oldPrice = product ? product.price : 0;

    try {
      const res = await window.api.updateProduct(productId, { price: newPrice });
      if (res.success) {
        if (product) product.price = newPrice;
        App.showToast(`✅ Price for ${product ? product.name : 'dish'} updated: ₹${oldPrice} ➔ ₹${newPrice}!`, 'success');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        if (window.StudentApp) window.StudentApp.loadProducts();
      } else {
        App.showToast(res.message || 'Price update failed', 'error');
      }
    } catch (e) {
      App.showToast('Failed to save price to server', 'error');
    }
  },

  /* Open Full Edit Modal */
  openEditProductModal(productId) {
    const p = this.products.find(item => item.id === productId);
    if (!p) {
      App.showToast('Product not found', 'error');
      return;
    }

    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-prod-name').value = p.name;
    document.getElementById('edit-prod-emoji').value = p.image_emoji || '🍲';
    document.getElementById('edit-prod-category').value = p.category;
    document.getElementById('edit-prod-price').value = p.price;
    document.getElementById('edit-prod-stock').value = p.stock;
    document.getElementById('edit-prod-prep').value = p.prep_time || '5-8 mins';
    document.getElementById('edit-prod-is-veg').value = String(p.is_veg);
    document.getElementById('edit-prod-desc').value = p.description || '';
    document.getElementById('edit-prod-available').checked = Boolean(p.is_available);

    App.openModal('edit-product-modal');
  },

  /* Submit Full Edit Modal */
  async handleEditProductSubmit(event) {
    if (event) event.preventDefault();

    const productId = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('edit-prod-name').value.trim();
    const emoji = document.getElementById('edit-prod-emoji').value.trim() || '🍲';
    const category = document.getElementById('edit-prod-category').value;
    const price = Number(document.getElementById('edit-prod-price').value);
    const stock = Number(document.getElementById('edit-prod-stock').value);
    const prep_time = document.getElementById('edit-prod-prep').value.trim() || '5-8 mins';
    const is_veg = document.getElementById('edit-prod-is-veg').value === 'true';
    const description = document.getElementById('edit-prod-desc').value.trim();
    const is_available = document.getElementById('edit-prod-available').checked;

    if (!name || isNaN(price) || price <= 0) {
      App.showToast('Please provide a valid dish name and price', 'warning');
      return;
    }

    try {
      const res = await window.api.updateProduct(productId, {
        name,
        image_emoji: emoji,
        category,
        price,
        stock,
        prep_time,
        is_veg,
        description,
        is_available
      });

      if (res.success) {
        App.closeModal('edit-product-modal');
        App.showToast(`💾 Successfully saved changes for ${name} (₹${price})!`, 'success');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        if (window.StudentApp) window.StudentApp.loadProducts();
      } else {
        App.showToast(res.message || 'Update failed', 'error');
      }
    } catch (e) {
      App.showToast('Failed to update product details', 'error');
    }
  },

  async adjustStock(productId, delta) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    try {
      await window.api.updateProduct(productId, { stock: newStock });
      await this.loadProducts();
      await this.loadKPIsAndAnalytics();
      if (window.StudentApp) window.StudentApp.loadProducts();
    } catch (e) {
      App.showToast('Stock update failed', 'error');
    }
  },

  async toggleAvailability(productId, isAvailable) {
    try {
      await window.api.updateProduct(productId, { is_available: isAvailable });
      await this.loadProducts();
      if (window.StudentApp) window.StudentApp.loadProducts();
      App.showToast('Availability updated', 'success');
    } catch (e) {
      App.showToast('Failed to update availability', 'error');
    }
  },

  openAddProductModal() {
    App.openModal('add-product-modal');
  },

  async handleProductSubmit(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const price = Number(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const stock = Number(document.getElementById('prod-stock').value) || 20;
    const emoji = document.getElementById('prod-emoji')?.value?.trim() || '🍲';
    const isVeg = document.getElementById('prod-is-veg').value === 'true';
    const prep = document.getElementById('prod-prep')?.value?.trim() || '5-8 mins';
    const desc = document.getElementById('prod-desc')?.value?.trim() || 'Freshly prepared at Campus Canteen';

    if (!name || isNaN(price) || price <= 0) {
      App.showToast('Valid name and price are required', 'warning');
      return;
    }

    try {
      const res = await window.api.createProduct({
        name,
        price,
        category,
        stock,
        image_emoji: emoji,
        is_veg: isVeg,
        prep_time: prep,
        description: desc
      });

      if (res.success) {
        App.closeModal('add-product-modal');
        document.getElementById('add-product-form')?.reset();
        App.showToast(`🎉 Added ${res.product.name} (₹${res.product.price}) to live menu!`, 'success');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        if (window.StudentApp) window.StudentApp.loadProducts();
      }
    } catch (e) {
      App.showToast('Error adding product', 'error');
    }
  },

  async deleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    const name = product ? product.name : 'this item';
    if (!confirm(`Are you sure you want to remove "${name}" from the canteen menu?`)) {
      return;
    }

    try {
      const res = await window.api.deleteProduct(productId);
      if (res.success) {
        App.showToast(`Removed "${name}" from menu`, 'info');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        if (window.StudentApp) window.StudentApp.loadProducts();
      }
    } catch (e) {
      App.showToast('Failed to delete product', 'error');
    }
  },

  // Analytics charts rendering
  renderAnalyticsCharts() {
    if (!this.analyticsData) return;

    window.CampusCharts.renderWeeklyRevenue('weekly-revenue-chart-canvas', this.analyticsData.weekly_revenue);
    window.CampusCharts.renderHourlyDemand('hourly-demand-chart-canvas', this.analyticsData.orders_by_hour);

    // Render Top Selling list
    const topContainer = document.getElementById('admin-top-selling-list');
    if (topContainer && this.analyticsData.top_selling) {
      const maxCount = Math.max(...this.analyticsData.top_selling.map(t => t.sales_count));
      topContainer.innerHTML = this.analyticsData.top_selling.map(item => {
        const pct = Math.round((item.sales_count / maxCount) * 100);
        return `
          <div class="leaderboard-row">
            <div class="leaderboard-meta">
              <span>${item.name}</span>
              <span style="color:var(--primary);">${item.sales_count} sold (₹${item.revenue})</span>
            </div>
            <div class="leaderboard-bar-track">
              <div class="leaderboard-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  // AI Demand Prediction Engine (Core Innovation)
  async loadDemandPredictions() {
    try {
      const res = await window.api.getDemandPrediction();
      if (res.success && res.predictions) {
        this.demandData = res;
        this.renderDemandPredictions();
      }
    } catch (e) {
      console.warn("Demand prediction error:", e);
    }
  },

  renderDemandPredictions() {
    const container = document.getElementById('ai-predictions-grid');
    if (!container || !this.demandData) return;

    container.innerHTML = this.demandData.predictions.map(pred => {
      const isDeficit = pred.recommendedPrep > 0;

      return `
        <div class="prediction-card ${pred.urgency === 'Critical' ? 'critical' : ''}">
          <div>
            <div class="prediction-item-title">
              <span>${pred.productName}</span>
              <span style="font-size:11px;padding:2px 8px;border-radius:999px;background:rgba(99,102,241,0.15);color:#818CF8;font-weight:700;">
                AI Confidence: ${pred.confidence}
              </span>
            </div>
            <div style="font-size:11.5px;color:var(--text-muted);margin:4px 0 8px;">
              ⏱️ ${pred.timeSlot}
            </div>

            <div class="prediction-stats-row">
              <div class="stat-box">
                <span class="stat-label">Expected Demand</span>
                <span class="stat-num" style="color:#60A5FA;">${pred.expectedDemand} units</span>
              </div>
              <div class="stat-box" style="text-align:right;">
                <span class="stat-label">Live Inventory</span>
                <span class="stat-num" style="color:${pred.currentStock <= 5 ? '#F87171' : '#34D399'};">${pred.currentStock} units</span>
              </div>
            </div>

            <div class="prep-recommendation-box">
              <span>⚠️</span>
              <span><strong>Recommendation:</strong> ${pred.actionText}</span>
            </div>

            <p style="font-size:11.5px;color:var(--text-secondary);margin-top:8px;line-height:1.4;">
              💡 <em>${pred.keyDriver}</em>
            </p>
          </div>

          ${isDeficit ? `
            <button class="apply-prep-btn" onclick="AdminApp.applyDemandPrepPlan('${pred.productId}', ${pred.recommendedPrep})">
              🍳 Accept Recommendation (+${pred.recommendedPrep} to Kitchen Sheet)
            </button>
          ` : `
            <div style="text-align:center;font-size:12px;color:var(--accent-emerald);font-weight:700;padding:6px;">
              ✓ Stock Optimized
            </div>
          `}
        </div>
      `;
    }).join('');
  },

  async applyDemandPrepPlan(productId, prepAmount) {
    try {
      const res = await window.api.applyDemandPrep(productId, prepAmount);
      if (res.success) {
        App.showToast(res.message, 'success');
        await this.loadProducts();
        await this.loadDemandPredictions();
        await this.loadKPIsAndAnalytics();
        if (window.StudentApp) window.StudentApp.loadProducts();
      }
    } catch (e) {
      App.showToast('Failed to apply prep plan', 'error');
    }
  },

  // Marketing & Coupons
  async loadCoupons() {
    try {
      const res = await window.api.getCoupons();
      const container = document.getElementById('admin-coupons-list');
      if (container && res.coupons) {
        container.innerHTML = res.coupons.map(c => `
          <div style="background:var(--bg-elevated);border-radius:12px;padding:14px;border:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="display:flex;align-items:center;gap:8px;">
                <strong style="color:var(--primary);font-size:15px;">${c.code}</strong>
                <span style="font-size:10px;background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;">${c.badge}</span>
              </div>
              <p style="font-size:12px;color:var(--text-secondary);margin:4px 0;">${c.description}</p>
              <div style="font-size:11px;color:var(--text-muted);">Min Order: ₹${c.minimum_order} • Valid until: ${c.expiry_date}</div>
            </div>
            <label style="cursor:pointer;font-size:12px;display:flex;align-items:center;gap:6px;">
              <input type="checkbox" ${c.is_active ? 'checked' : ''} onchange="AdminApp.toggleCouponActive('${c.id}', this.checked)">
              <span>${c.is_active ? 'Active' : 'Paused'}</span>
            </label>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn("Coupons error:", e);
    }
  },

  async createNewCouponCampaign() {
    const code = document.getElementById('new-coupon-code').value;
    const discount = document.getElementById('new-coupon-discount').value;
    const minOrder = document.getElementById('new-coupon-min').value;
    const desc = document.getElementById('new-coupon-desc').value;

    if (!code || !discount) {
      App.showToast('Coupon code and discount % are required', 'warning');
      return;
    }

    try {
      const res = await window.api.createCoupon({
        code,
        discount_value: Number(discount),
        minimum_order: Number(minOrder) || 100,
        description: desc || `${discount}% Campus Discount`
      });

      if (res.success) {
        App.showToast(res.message, 'success');
        document.getElementById('new-coupon-code').value = '';
        document.getElementById('new-coupon-discount').value = '';
        this.loadCoupons();
      }
    } catch (e) {
      App.showToast('Coupon creation failed', 'error');
    }
  },

  async toggleCouponActive(id, isActive) {
    try {
      await window.api.toggleCoupon(id, isActive);
      App.showToast('Coupon campaign status updated', 'success');
    } catch (e) {
      App.showToast('Failed to toggle coupon', 'error');
    }
  },

  // Customer Reviews & Feedback
  async loadReviews() {
    try {
      const res = await window.api.getReviews();
      const container = document.getElementById('admin-reviews-list');
      if (container && res.reviews) {
        container.innerHTML = res.reviews.map(r => `
          <div class="review-card-item">
            <div class="review-author-row">
              <div>
                <strong>${r.user_name}</strong>
                <span style="font-size:11px;color:var(--text-muted);margin-left:6px;">Order #${r.order_id}</span>
              </div>
              <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.4;">"${r.comment}"</p>
            <div style="font-size:11px;color:var(--text-muted);display:flex;gap:12px;">
              <span>Food: <strong>${r.food_quality}/5</strong></span>
              <span>Speed: <strong>${r.service_speed}/5</strong></span>
              <span>App: <strong>${r.app_experience}/5</strong></span>
            </div>
          </div>
        `).join('');
      }
    } catch (e) {
      console.warn("Reviews load error:", e);
    }
  },

  /* QR Code Scanner & Token Verification */
  scannedOrder: null,

  openQrScannerModal() {
    this.scannedOrder = null;
    const resultCard = document.getElementById('admin-scanned-result-card');
    if (resultCard) resultCard.style.display = 'none';
    const input = document.getElementById('admin-qr-token-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 150);
    }
    App.openModal('admin-qr-scanner-modal');
  },

  simulateScan(tokenCode) {
    const input = document.getElementById('admin-qr-token-input');
    if (input) {
      input.value = tokenCode;
      this.processScannedToken();
    }
  },

  async processScannedToken() {
    const input = document.getElementById('admin-qr-token-input');
    if (!input) return;
    let raw = input.value.trim().toUpperCase().replace('#', '');
    if (raw.startsWith('CAMPUSBITE:')) {
      const parts = raw.split(':');
      raw = parts[1] || raw;
    }

    if (!raw) {
      App.showToast('Please enter or scan a token code', 'warning');
      return;
    }

    let order = this.orders.find(o => o.id.toUpperCase() === raw);
    if (!order) {
      try {
        const res = await window.api.getOrder(raw);
        if (res.success && res.order) order = res.order;
      } catch (e) {}
    }

    if (!order) {
      App.showToast(`No order found for token #${raw}`, 'error');
      return;
    }

    this.scannedOrder = order;
    const resultCard = document.getElementById('admin-scanned-result-card');
    if (resultCard) {
      resultCard.style.display = 'block';
      document.getElementById('scanned-order-title').textContent = `ORDER #${order.id}`;
      document.getElementById('scanned-order-customer').textContent = `${order.customer_name} • Counter ${order.pickup_counter || 2}`;
      document.getElementById('scanned-order-status').textContent = (order.order_status || 'PLACED').toUpperCase();
      
      const itemsText = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(', ');
      document.getElementById('scanned-order-items').textContent = `🍽️ ${itemsText} (Total: ₹${order.total_amount})`;
      
      const btn = document.getElementById('scanned-handover-btn');
      if (btn) {
        if (order.order_status === 'Completed') {
          btn.textContent = '✓ Already Picked Up / Completed';
          btn.disabled = true;
          btn.style.opacity = '0.6';
        } else {
          btn.textContent = '✅ Hand Over Tray & Complete Order';
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      }
    }
    App.showToast(`Verified Order #${order.id} for ${order.customer_name}!`, 'success');
  },

  async completeScannedOrder() {
    if (!this.scannedOrder) return;
    const orderId = this.scannedOrder.id;

    try {
      const res = await window.api.updateOrderStatus(orderId, 'Completed');
      if (res.success) {
        App.closeModal('admin-qr-scanner-modal');
        App.showToast(`🎉 Order #${orderId} handed over and marked Completed!`, 'success');
        await this.loadOrders();
        await this.loadKPIsAndAnalytics();
      }
    } catch (e) {
      App.showToast('Failed to complete order', 'error');
    }
  }
};

window.AdminApp = AdminApp;
