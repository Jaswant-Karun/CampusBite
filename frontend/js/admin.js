/**
 * CampusBite - Admin Dashboard & Business Intelligence Controller
 */

const AdminApp = {
  currentTab: 'dashboard',
  currentDashboardChartView: 'weekly',
  ordersViewMode: 'table',
  searchOrderId: '',
  searchCustomer: '',
  searchStatus: 'All',
  searchDate: '',
  orders: [],
  products: [],
  customers: [],
  analyticsData: null,
  demandData: null,
  activeOrderFilter: 'All',

  async init() {
    const hasAccess = await this.checkAccess();
    if (!hasAccess) return;
    this.bindEvents();
    this.switchTab('dashboard');
    this.loadAllData();
  },

  async checkAccess() {
    let user = null;
    try {
      user = JSON.parse(localStorage.getItem('campusbite_user') || 'null');
    } catch (e) {}
    const token = localStorage.getItem('campusbite_token');

    // 1. Client-side role check
    if (!user || (user.role !== 'admin' && user.role !== 'staff') || !token) {
      alert('Access Denied: You must be logged in as an Admin or Kitchen Staff to view the Admin Operations Hub.');
      window.location.href = '/#login';
      return false;
    }

    // 2. Server-side token and role verification
    try {
      const res = await window.api.checkAdmin();
      if (!res || !res.success) {
        alert('Access Denied: Admin session invalid or expired.');
        window.location.href = '/#login';
        return false;
      }
      this.updateAdminHeaderUI(res.user);
      return true;
    } catch (err) {
      console.warn("Admin backend verification failed:", err);
      alert('Access Denied: Admin privileges required.');
      window.location.href = '/#login';
      return false;
    }
  },

  updateAdminHeaderUI(user) {
    if (!user) return;
    const nameEl = document.querySelector('.header-actions strong');
    if (nameEl) nameEl.textContent = user.name;
    const roleEl = document.querySelector('.header-actions span[style*="font-size:10.5px"]');
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Canteen Manager' : 'Kitchen Staff';
  },

  async logout() {
    try {
      if (window.api && window.api.logout) {
        await window.api.logout();
      }
    } catch (e) {}
    localStorage.removeItem('campusbite_token');
    localStorage.removeItem('campusbite_user');
    alert('Logged out of Admin Operations.');
    window.location.href = '/#login';
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
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const st = btn.dataset.status || 'All';
        this.activeOrderFilter = st;
        const statusSelect = document.getElementById('order-filter-status');
        if (statusSelect) {
          statusSelect.value = st;
        }
        this.handleOrderFilterChange();
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

    // Dynamic header titles
    const headingEl = document.getElementById('admin-main-heading');
    const subheadingEl = document.getElementById('admin-main-subheading');
    const tabHeaders = {
      dashboard: { title: "Canteen Operations Dashboard", sub: "Live order dispatch, telemetry & business intelligence" },
      orders: { title: "Orders Management & Kitchen Queue", sub: "Live ticket management, status transitions & token dispatch" },
      products: { title: "Canteen Menu & Food Catalog", sub: "Manage food items, pricing, prep times, and live availability" },
      inventory: { title: "Real-Time Inventory & Stock Management", sub: "Instant inline price updates, stock adjustment, and replenishment alerts" },
      customers: { title: "Campus Diners & Customer CRM", sub: "Registered students, faculty, dining spend & loyalty balances" },
      coupons: { title: "Digital Marketing & Coupon Offers", sub: "Publish discounts, monitor campaigns & active promotions" },
      reviews: { title: "Customer Reviews & Quality Ratings", sub: "Verified post-pickup feedback on food quality, speed & service" },
      analytics: { title: "Sales & Business Intelligence Analytics", sub: "Revenue velocity, peak rush traffic & bestsellers analysis" },
      settings: { title: "Canteen Operational Settings", sub: "Express pickup counters, database status & diagnostics" }
    };
    if (tabHeaders[tabId]) {
      if (headingEl) headingEl.textContent = tabHeaders[tabId].title;
      if (subheadingEl) subheadingEl.textContent = tabHeaders[tabId].sub;
    }

    if (tabId === 'dashboard') {
      this.loadKPIsAndAnalytics();
      this.renderRecentOrdersTable();
      this.renderDashboardSalesChart();
      this.renderOrderStatusOverview();
    } else if (tabId === 'orders') {
      this.loadOrders();
    } else if (tabId === 'products') {
      this.loadProducts();
    } else if (tabId === 'inventory') {
      this.renderInventoryTable();
    } else if (tabId === 'customers') {
      this.loadCustomers();
    } else if (tabId === 'coupons' || tabId === 'marketing') {
      this.loadCoupons();
    } else if (tabId === 'reviews') {
      this.loadReviews();
    } else if (tabId === 'analytics') {
      this.renderAnalyticsCharts();
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
        const kpis = data.kpis || {};
        
        // 1. Today's Sales KPI
        const salesVal = kpis.today_sales !== undefined ? kpis.today_sales : (kpis.today_revenue || 0);
        const salesEl = document.getElementById('kpi-sales');
        if (salesEl) salesEl.textContent = `₹${salesVal.toLocaleString()}`;
        const revEl = document.getElementById('kpi-revenue');
        if (revEl) revEl.textContent = `₹${salesVal.toLocaleString()}`;
        const salesTrendEl = document.getElementById('kpi-sales-trend');
        if (salesTrendEl) {
          salesTrendEl.innerHTML = `<strong>↑ ₹${salesVal.toLocaleString()}</strong> from real canteen order book`;
        }

        // 2. Today's Orders KPI
        const ordersEl = document.getElementById('kpi-orders');
        if (ordersEl) ordersEl.textContent = kpis.today_orders || 0;
        const ordersTrendEl = document.getElementById('kpi-orders-trend');
        if (ordersTrendEl) {
          ordersTrendEl.innerHTML = `<strong>${kpis.today_orders || 0} total orders</strong> in database`;
        }

        // 3. Active Customers KPI
        const custEl = document.getElementById('kpi-customers');
        const activeCustCount = kpis.active_customers || kpis.total_customers || 0;
        if (custEl) custEl.textContent = activeCustCount;
        const custSubEl = document.getElementById('kpi-customers-sub');
        if (custSubEl) {
          custSubEl.innerHTML = `<strong>${activeCustCount} verified diners</strong> logged in database`;
        }

        // 4. Pending Orders KPI
        const pendingEl = document.getElementById('kpi-pending');
        if (pendingEl) pendingEl.textContent = kpis.pending_orders || 0;
        const pendingSubEl = document.getElementById('kpi-pending-sub') || document.querySelector('.saas-kpi-card.pending .saas-kpi-sub');
        if (pendingSubEl) {
          if (kpis.pending_orders > 0) {
            pendingSubEl.innerHTML = `<strong style="color:#D97706;">${kpis.pending_orders} in kitchen prep</strong> & pickup`;
          } else {
            pendingSubEl.innerHTML = `<strong style="color:#10B981;">All fulfilled</strong> • No current queue`;
          }
        }

        // 5. Average Rating KPI
        const ratingEl = document.getElementById('kpi-rating');
        if (ratingEl) ratingEl.textContent = `${kpis.avg_rating || 4.8} / 5.0`;
        const ratingSubEl = document.getElementById('kpi-rating-sub');
        if (ratingSubEl) {
          ratingSubEl.innerHTML = `From <strong>${kpis.total_reviews || 0}</strong> verified student reviews`;
        }

        // Sidebar Badges
        const pendingBadge = document.getElementById('sidebar-pending-badge');
        if (pendingBadge) {
          pendingBadge.textContent = kpis.pending_orders || 0;
          pendingBadge.style.display = (kpis.pending_orders || 0) > 0 ? 'inline-block' : 'none';
        }

        const lowStock = kpis.low_stock_count || 0;
        const stockBadge = document.getElementById('sidebar-stock-badge');
        if (stockBadge) {
          stockBadge.textContent = lowStock;
          stockBadge.style.display = lowStock > 0 ? 'inline-block' : 'none';
        }

        const lowStockKpi = document.getElementById('kpi-low-stock');
        if (lowStockKpi) lowStockKpi.textContent = lowStock;

        // Render Dashboard Visual Components
        this.renderDashboardSalesChart();
        this.renderOrderStatusOverview();
        this.renderRecentOrdersTable();

        if (this.currentTab === 'analytics') {
          this.renderAnalyticsCharts();
        }
      }
    } catch (e) {
      console.warn("Analytics fetch error:", e);
    }
  },

  switchDashboardChartView(view) {
    this.currentDashboardChartView = view;
    const weeklyBtn = document.getElementById('btn-chart-view-weekly');
    const hourlyBtn = document.getElementById('btn-chart-view-hourly');
    if (weeklyBtn) weeklyBtn.classList.toggle('active', view === 'weekly');
    if (hourlyBtn) hourlyBtn.classList.toggle('active', view === 'hourly');
    this.renderDashboardSalesChart();
  },

  renderDashboardSalesChart() {
    const container = document.getElementById('dashboard-sales-chart');
    if (!container || !this.analyticsData) return;

    if (this.currentDashboardChartView === 'hourly') {
      const hourlyData = this.analyticsData.orders_by_hour || [];
      if (window.CampusCharts && typeof window.CampusCharts.renderHourlyDemand === 'function') {
        window.CampusCharts.renderHourlyDemand('dashboard-sales-chart', hourlyData);
      }
    } else {
      const weeklyData = this.analyticsData.weekly_revenue || [];
      if (window.CampusCharts && typeof window.CampusCharts.renderWeeklyRevenue === 'function') {
        window.CampusCharts.renderWeeklyRevenue('dashboard-sales-chart', weeklyData);
      }
    }

    // Update total catalog revenue tag
    const totalTag = document.getElementById('dashboard-total-revenue-tag');
    if (totalTag) {
      const weeklyList = this.analyticsData.weekly_revenue || [];
      const totalRev = weeklyList.reduce((sum, item) => sum + (item.revenue || 0), 0);
      totalTag.textContent = `₹${totalRev.toLocaleString()}`;
    }
  },

  renderOrderStatusOverview() {
    const container = document.getElementById('dashboard-order-status-breakdown');
    if (!container) return;

    const breakdown = this.analyticsData?.order_status_overview || {
      'Order Placed': 0,
      'Confirmed': 0,
      'Preparing': 0,
      'Ready for Pickup': 0,
      'Completed': 0,
      'Cancelled': 0
    };

    const statusConfig = [
      { key: 'Order Placed', label: 'Order Placed', color: '#4F46E5', count: breakdown['Order Placed'] || 0 },
      { key: 'Confirmed', label: 'Confirmed', color: '#2563EB', count: breakdown['Confirmed'] || 0 },
      { key: 'Preparing', label: 'Preparing in Kitchen', color: '#D97706', count: breakdown['Preparing'] || 0 },
      { key: 'Ready for Pickup', label: 'Ready for Pickup', color: '#10B981', count: breakdown['Ready for Pickup'] || 0 },
      { key: 'Completed', label: 'Completed & Picked Up', color: '#059669', count: breakdown['Completed'] || 0 },
      { key: 'Cancelled', label: 'Cancelled', color: '#EF4444', count: breakdown['Cancelled'] || 0 }
    ];

    const totalOrders = Object.values(breakdown).reduce((sum, c) => sum + c, 0) || this.orders.length || 0;

    const totalPill = document.getElementById('dashboard-total-orders-pill');
    if (totalPill) {
      totalPill.textContent = `${totalOrders} Total Orders`;
    }

    container.innerHTML = statusConfig.map(st => {
      const pct = totalOrders > 0 ? Math.round((st.count / totalOrders) * 100) : 0;
      return `
        <div class="status-bar-row">
          <div class="status-bar-meta">
            <div class="status-bar-meta-left">
              <span class="status-bar-dot" style="background:${st.color};"></span>
              <span>${st.label}</span>
            </div>
            <div class="status-bar-meta-right">
              <strong>${st.count}</strong> <span style="font-size:11px;color:#94A3B8;">(${pct}%)</span>
            </div>
          </div>
          <div class="status-track">
            <div class="status-fill" style="width: ${pct}%; background:${st.color};"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderRecentOrdersTable() {
    const tbody = document.getElementById('dashboard-recent-orders-tbody');
    if (!tbody) return;

    const recentOrders = this.analyticsData?.recent_orders?.length
      ? this.analyticsData.recent_orders
      : (this.orders || []).slice(0, 8);

    if (!recentOrders.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:32px;color:#94A3B8;">
            No orders placed yet today. Orders from students will stream here in real-time.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = recentOrders.map(order => {
      const rawStatus = (order.order_status || 'Order Placed').toLowerCase();
      let statusClass = 'placed';
      if (rawStatus === 'confirmed') statusClass = 'confirmed';
      else if (rawStatus === 'preparing') statusClass = 'preparing';
      else if (rawStatus === 'ready' || rawStatus === 'ready for pickup') statusClass = 'ready';
      else if (rawStatus === 'completed') statusClass = 'completed';
      else if (rawStatus === 'cancelled') statusClass = 'cancelled';

      const itemsList = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(', ') || 'Canteen Meal';
      const itemsTooltip = (order.items || []).map(i => `${i.name} × ${i.quantity} (₹${(i.price || 0) * (i.quantity || 1)})`).join('\n');
      
      const timeStr = order.created_at
        ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Just now';

      let quickActionHtml = '';
      if (rawStatus === 'order placed' || rawStatus === 'placed') {
        quickActionHtml = `<button class="btn-primary" style="padding:4px 9px;font-size:11px;font-weight:700;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Confirmed')" title="Confirm order">Confirm →</button>`;
      } else if (rawStatus === 'confirmed') {
        quickActionHtml = `<button class="btn-primary" style="padding:4px 9px;font-size:11px;font-weight:700;background:#D97706;border-color:#D97706;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Preparing')" title="Start kitchen preparation">Start Prep →</button>`;
      } else if (rawStatus === 'preparing') {
        quickActionHtml = `<button class="btn-primary" style="padding:4px 9px;font-size:11px;font-weight:700;background:#10B981;border-color:#10B981;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Ready for Pickup')" title="Mark ready for student pickup">Ready →</button>`;
      } else if (rawStatus === 'ready' || rawStatus === 'ready for pickup') {
        quickActionHtml = `<button class="btn-primary" style="padding:4px 9px;font-size:11px;font-weight:700;background:#059669;border-color:#059669;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Completed')" title="Hand over tray and complete">Complete ✓</button>`;
      } else {
        quickActionHtml = `<span style="font-size:11px;font-weight:700;color:#059669;">✓ Fulfilled</span>`;
      }

      const isPaid = (order.payment_status || 'Paid').toLowerCase().includes('paid');

      return `
        <tr>
          <td>
            <span class="order-token-pill">#${order.id}</span>
          </td>
          <td>
            <strong style="color:#0F172A;font-size:13px;">${order.customer_name || 'Campus Student'}</strong>
            <div style="font-size:11px;color:#64748B;">${order.customer_phone || 'Student'} • Counter ${order.pickup_counter || 2}</div>
          </td>
          <td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${itemsTooltip}">
            <span style="font-size:12px;color:#334155;">${itemsList}</span>
          </td>
          <td>
            <strong style="font-size:13px;color:#0F172A;">₹${order.total_amount}</strong>
          </td>
          <td>
            <span class="payment-method-pill ${isPaid ? 'paid' : 'pending'}">
              ${order.payment_method || 'UPI'}
            </span>
          </td>
          <td>
            <span class="status-badge-saas ${statusClass}">${order.order_status}</span>
          </td>
          <td>
            <span style="font-size:12px;color:#64748B;">${timeStr}</span>
          </td>
          <td style="text-align:right;">
            ${quickActionHtml}
          </td>
        </tr>
      `;
    }).join('');
  },

  async loadOrders() {
    try {
      const data = await window.api.getOrders();
      if (data && data.orders) {
        this.orders = data.orders;
        this.renderOrders();
        this.renderRecentOrdersTable();
      }
    } catch (e) {
      console.warn("Orders fetch error:", e);
    }
  },

  switchOrdersView(mode) {
    this.ordersViewMode = mode;
    const tableBtn = document.getElementById('btn-view-table');
    const cardsBtn = document.getElementById('btn-view-cards');
    const tableView = document.getElementById('admin-orders-table-view');
    const cardsView = document.getElementById('admin-orders-cards-view');

    if (tableBtn) tableBtn.classList.toggle('active', mode === 'table');
    if (cardsBtn) cardsBtn.classList.toggle('active', mode === 'cards');

    if (tableView) tableView.style.display = mode === 'table' ? 'block' : 'none';
    if (cardsView) cardsView.style.display = mode === 'cards' ? 'block' : 'none';
  },

  handleOrderFilterChange() {
    const idInput = document.getElementById('order-search-id');
    const custInput = document.getElementById('order-search-customer');
    const statusSelect = document.getElementById('order-filter-status');
    const dateInput = document.getElementById('order-filter-date');

    this.searchOrderId = idInput ? idInput.value.trim() : '';
    this.searchCustomer = custInput ? custInput.value.trim() : '';
    this.searchStatus = statusSelect ? statusSelect.value : 'All';
    this.activeOrderFilter = this.searchStatus;
    this.searchDate = dateInput ? dateInput.value : '';

    // Synchronize chips active state
    document.querySelectorAll('.order-filter-btn').forEach(b => {
      const bStatus = (b.dataset.status || '').toLowerCase();
      const sStatus = (this.searchStatus || '').toLowerCase();
      if (bStatus === sStatus || (sStatus === 'all' && bStatus === 'all')) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    this.renderOrders();
  },

  clearOrderFilters() {
    const idInput = document.getElementById('order-search-id');
    const custInput = document.getElementById('order-search-customer');
    const statusSelect = document.getElementById('order-filter-status');
    const dateInput = document.getElementById('order-filter-date');

    if (idInput) idInput.value = '';
    if (custInput) custInput.value = '';
    if (statusSelect) statusSelect.value = 'All';
    if (dateInput) dateInput.value = '';

    this.searchOrderId = '';
    this.searchCustomer = '';
    this.searchStatus = 'All';
    this.activeOrderFilter = 'All';
    this.searchDate = '';

    document.querySelectorAll('.order-filter-btn').forEach(b => {
      b.classList.toggle('active', (b.dataset.status || '').toLowerCase() === 'all');
    });

    this.renderOrders();
  },

  getFilteredOrders() {
    let list = [...this.orders];

    // Filter by Order ID
    if (this.searchOrderId) {
      const qId = this.searchOrderId.toLowerCase().replace('#', '');
      list = list.filter(o => (o.id || '').toLowerCase().includes(qId));
    }

    // Filter by Customer
    if (this.searchCustomer) {
      const qCust = this.searchCustomer.toLowerCase();
      list = list.filter(o => 
        (o.customer_name || '').toLowerCase().includes(qCust) ||
        (o.customer_phone || '').toLowerCase().includes(qCust) ||
        (o.user_id || '').toLowerCase().includes(qCust)
      );
    }

    // Filter by Status
    if (this.searchStatus && this.searchStatus !== 'All') {
      const targetStatus = this.searchStatus.toLowerCase();
      list = list.filter(o => {
        const os = (o.order_status || '').toLowerCase();
        if (targetStatus === 'order placed' || targetStatus === 'placed' || targetStatus === 'pending') {
          return os === 'order placed' || os === 'placed' || os === 'pending';
        }
        if (targetStatus === 'ready for pickup' || targetStatus === 'ready') {
          return os === 'ready for pickup' || os === 'ready';
        }
        return os === targetStatus;
      });
    }

    // Filter by Date
    if (this.searchDate) {
      list = list.filter(o => {
        if (!o.created_at) return false;
        try {
          const orderDateStr = new Date(o.created_at).toISOString().slice(0, 10);
          return orderDateStr === this.searchDate;
        } catch (e) {
          return false;
        }
      });
    }

    return list;
  },

  renderOrders() {
    const filtered = this.getFilteredOrders();

    // Update summary counts & volume tags
    const countTag = document.getElementById('orders-matching-count-tag');
    if (countTag) {
      countTag.innerHTML = `Showing <strong>${filtered.length}</strong> of <strong>${this.orders.length}</strong> orders`;
    }

    const volumeTag = document.getElementById('orders-matching-volume-tag');
    if (volumeTag) {
      const totalVolume = filtered.reduce((sum, o) => sum + (o.total_amount || 0), 0);
      volumeTag.innerHTML = `Filtered Volume: <strong>₹${totalVolume.toLocaleString()}</strong>`;
    }

    // Render Table View (Step 19 Primary View)
    this.renderOrdersTable(filtered);

    // Render Cards View
    this.renderOrdersCards(filtered);
  },

  renderOrdersTable(filtered) {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    if (!filtered.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:48px 20px;color:#94A3B8;">
            <div style="font-size:32px;margin-bottom:8px;">📋</div>
            <strong style="font-size:14px;color:#334155;display:block;">No orders matching search & filter criteria</strong>
            <p style="font-size:12px;margin:4px 0 12px;color:#64748B;">Try clearing search terms or selecting a different status/date.</p>
            <button type="button" class="btn-outline" onclick="AdminApp.clearOrderFilters()" style="padding:5px 14px;font-size:12px;">Clear All Filters</button>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(order => {
      const rawStatus = (order.order_status || 'Order Placed').toLowerCase();
      let statusClass = 'placed';
      if (rawStatus === 'confirmed') statusClass = 'confirmed';
      else if (rawStatus === 'preparing') statusClass = 'preparing';
      else if (rawStatus === 'ready' || rawStatus === 'ready for pickup') statusClass = 'ready';
      else if (rawStatus === 'completed') statusClass = 'completed';
      else if (rawStatus === 'cancelled') statusClass = 'cancelled';

      const isPlaced = rawStatus === 'placed' || rawStatus === 'order placed' || rawStatus === 'pending';
      const isConfirmed = rawStatus === 'confirmed';
      const isPreparing = rawStatus === 'preparing';
      const isReady = rawStatus === 'ready' || rawStatus === 'ready for pickup';
      const isCompleted = rawStatus === 'completed';
      const isCancelled = rawStatus === 'cancelled';

      const itemsList = (order.items || []).map(i => `${i.name} × ${i.quantity}`).join(', ') || 'Canteen Meal';
      const itemsTooltip = (order.items || []).map(i => `${i.name} × ${i.quantity} (₹${(i.price || 0) * (i.quantity || 1)})`).join('\n');

      const isPaid = (order.payment_status || 'Paid').toLowerCase().includes('paid');

      const dateObj = order.created_at ? new Date(order.created_at) : new Date();
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

      // Stage progression button (PENDING → CONFIRMED → PREPARING → READY → COMPLETED)
      let stageAdvanceBtn = '';
      if (isPlaced) {
        stageAdvanceBtn = `
          <button class="btn-primary" style="padding:4px 10px;font-size:11px;font-weight:700;white-space:nowrap;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Confirmed')" title="Advance order to Confirmed">
            Confirm →
          </button>
        `;
      } else if (isConfirmed) {
        stageAdvanceBtn = `
          <button class="btn-primary" style="padding:4px 10px;font-size:11px;font-weight:700;background:#D97706;border-color:#D97706;white-space:nowrap;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Preparing')" title="Advance order to Preparing in Kitchen">
            Start Prep →
          </button>
        `;
      } else if (isPreparing) {
        stageAdvanceBtn = `
          <button class="btn-primary" style="padding:4px 10px;font-size:11px;font-weight:700;background:#10B981;border-color:#10B981;white-space:nowrap;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Ready for Pickup')" title="Advance order to Ready for Pickup">
            Mark Ready →
          </button>
        `;
      } else if (isReady) {
        stageAdvanceBtn = `
          <button class="btn-primary" style="padding:4px 10px;font-size:11px;font-weight:700;background:#059669;border-color:#059669;white-space:nowrap;" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Completed')" title="Complete order handover to student">
            Complete ✓
          </button>
        `;
      } else if (isCompleted) {
        stageAdvanceBtn = `<span style="font-size:11px;font-weight:700;color:#059669;background:#ECFDF5;padding:3px 8px;border-radius:999px;">✓ Fulfilled</span>`;
      } else if (isCancelled) {
        stageAdvanceBtn = `<span style="font-size:11px;font-weight:700;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:999px;">✗ Cancelled</span>`;
      }

      // Status dropdown allowing direct selection
      const statusSelect = `
        <select class="admin-status-dropdown" onchange="AdminApp.handleStatusSelectChange('${order.id}', this.value, '${order.customer_name ? order.customer_name.replace(/'/g, "\\'") : 'Customer'}')" style="padding:3px 6px;font-size:11px;font-weight:700;border-radius:6px;border:1px solid #CBD5E1;background:white;color:#0F172A;cursor:pointer;">
          <option value="Order Placed" ${isPlaced ? 'selected' : ''}>1. PENDING</option>
          <option value="Confirmed" ${isConfirmed ? 'selected' : ''}>2. CONFIRMED</option>
          <option value="Preparing" ${isPreparing ? 'selected' : ''}>3. PREPARING</option>
          <option value="Ready for Pickup" ${isReady ? 'selected' : ''}>4. READY</option>
          <option value="Completed" ${isCompleted ? 'selected' : ''}>5. COMPLETED</option>
          <option value="Cancelled" ${isCancelled ? 'selected' : ''}>6. CANCELLED</option>
        </select>
      `;

      // Cancel button with confirmation (destructive action requirement)
      const cancelBtn = (!isCompleted && !isCancelled) ? `
        <button class="btn-cancel-destructive" onclick="AdminApp.confirmCancelOrder('${order.id}', '${order.customer_name ? order.customer_name.replace(/'/g, "\\'") : 'Student'}')" title="Cancel Order #${order.id}">
          Cancel
        </button>
      ` : '';

      return `
        <tr>
          <td>
            <span class="order-token-pill">#${order.id}</span>
          </td>
          <td>
            <strong style="color:#0F172A;font-size:13px;">${order.customer_name || 'Campus Student'}</strong>
            <div style="font-size:11px;color:#64748B;">${order.customer_phone || 'Student'}</div>
          </td>
          <td style="max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${itemsTooltip}">
            <span style="font-size:12px;color:#334155;">${itemsList}</span>
          </td>
          <td>
            <strong style="font-size:13.5px;color:#0F172A;">₹${order.total_amount}</strong>
          </td>
          <td>
            <span class="payment-method-pill ${isPaid ? 'paid' : 'pending'}">
              ${order.payment_method || 'UPI'} • ${order.payment_status || 'Paid'}
            </span>
          </td>
          <td>
            <strong style="font-size:12px;color:#334155;">${order.pickup_slot || 'Express'}</strong>
            <div style="font-size:11px;color:#64748B;">Counter ${order.pickup_counter || 1}</div>
          </td>
          <td>
            <span class="status-badge-saas ${statusClass}">${order.order_status}</span>
          </td>
          <td>
            <span style="font-size:12px;color:#334155;font-weight:600;">${timeStr}</span>
            <div style="font-size:10.5px;color:#64748B;">${dateStr}</div>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;align-items:center;gap:6px;justify-content:flex-end;">
              ${statusSelect}
              ${stageAdvanceBtn}
              ${cancelBtn}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderOrdersCards(filtered) {
    const container = document.getElementById('admin-orders-grid');
    if (!container) return;

    if (!filtered.length) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding:50px; background:var(--bg-card); border-radius:16px; border:1px solid var(--border-subtle); color:var(--text-muted);">
          <div style="margin-bottom:10px;"><svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>
          <h4>No orders matching search & filter criteria</h4>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(order => {
      const rawStatus = (order.order_status || 'Order Placed').toLowerCase();
      let statusClass = 'placed';
      if (rawStatus === 'confirmed') statusClass = 'confirmed';
      else if (rawStatus === 'preparing') statusClass = 'preparing';
      else if (rawStatus === 'ready' || rawStatus === 'ready for pickup') statusClass = 'ready';
      else if (rawStatus === 'completed') statusClass = 'completed';
      else if (rawStatus === 'cancelled') statusClass = 'cancelled';

      const isCompleted = rawStatus === 'completed';
      const isCancelled = rawStatus === 'cancelled';

      const cancelBtn = (!isCompleted && !isCancelled) ? `
        <button class="btn-cancel-destructive" onclick="AdminApp.confirmCancelOrder('${order.id}', '${order.customer_name ? order.customer_name.replace(/'/g, "\\'") : 'Student'}')" title="Cancel Order">
          Cancel
        </button>
      ` : '';

      return `
        <div class="admin-order-card">
          <div class="admin-order-top">
            <div>
              <div class="order-id-title">
                <span>#${order.id}</span>
                <span class="order-status-badge ${statusClass}">${order.order_status}</span>
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
                ${new Date(order.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ${new Date(order.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
            <div style="text-align:right;">
              <span style="font-size:15px;font-weight:800;color:var(--primary);">₹${order.total_amount}</span>
              <div style="font-size:10px;color:var(--text-muted);">${order.payment_method || 'UPI'} • ${order.payment_status || 'Paid'}</div>
            </div>
          </div>

          <div class="order-meta-info">
            <div><strong>${order.customer_name}</strong> (${order.customer_phone || 'Student'})</div>
            <div>Pickup: <strong>Counter ${order.pickup_counter || 1}</strong> • Slot: <strong>${order.pickup_slot || 'Express'}</strong></div>
            <div style="margin-top:4px;color:var(--primary);font-weight:600;font-size:11.5px;">
              ⏱ Est. Prep: <strong>${order.estimated_prep_time || '10–12 mins'}</strong>
            </div>
          </div>

          <div class="order-items-box">
            ${(order.items || []).map(item => `
              <div class="order-item-line">
                <span>${item.name} × ${item.quantity}</span>
                <span>₹${(item.price || 0) * (item.quantity || 1)}</span>
              </div>
            `).join('')}
          </div>

          <div class="order-actions-row">
            <span style="font-size:11.5px;color:var(--text-muted);">Status:</span>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
              ${this.renderOrderActionButtons(order)}
              ${cancelBtn}
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  renderOrderActionButtons(order) {
    const rawStatus = (order.order_status || '').toLowerCase();
    const isPlaced = rawStatus === 'placed' || rawStatus === 'order placed' || rawStatus === 'pending';
    const isConfirmed = rawStatus === 'confirmed';
    const isPreparing = rawStatus === 'preparing';
    const isReady = rawStatus === 'ready' || rawStatus === 'ready for pickup';
    const isCompleted = rawStatus === 'completed';
    const isCancelled = rawStatus === 'cancelled';

    let advanceBtn = '';
    if (isPlaced) {
      advanceBtn = `
        <button class="stage-advance-btn btn-confirm" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Confirmed')" title="Advance to Confirmed">
          Confirm →
        </button>
      `;
    } else if (isConfirmed) {
      advanceBtn = `
        <button class="stage-advance-btn btn-preparing" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Preparing')" title="Advance to Preparing">
          Start Prep →
        </button>
      `;
    } else if (isPreparing) {
      advanceBtn = `
        <button class="stage-advance-btn btn-ready" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Ready for Pickup')" title="Advance to Ready for Pickup">
          Mark Ready →
        </button>
      `;
    } else if (isReady) {
      advanceBtn = `
        <button class="stage-advance-btn btn-complete" onclick="AdminApp.advanceOrderStatus('${order.id}', 'Completed')" title="Mark as Completed">
          Complete Pickup ✓
        </button>
      `;
    } else if (isCompleted) {
      advanceBtn = `<span style="font-size:11px;font-weight:700;color:var(--accent-emerald);background:#DCFCE7;padding:3px 8px;border-radius:999px;">✓ Fulfilled</span>`;
    } else if (isCancelled) {
      advanceBtn = `<span style="font-size:11px;font-weight:700;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:999px;">✗ Cancelled</span>`;
    }

    const selectDropdown = `
      <select class="admin-status-dropdown" onchange="AdminApp.handleStatusSelectChange('${order.id}', this.value, '${order.customer_name ? order.customer_name.replace(/'/g, "\\'") : 'Customer'}')" style="padding:4px 8px;font-size:11.5px;font-weight:700;border-radius:8px;border:1px solid #CBD5E1;background:white;color:#1E293B;cursor:pointer;">
        <option value="Order Placed" ${isPlaced ? 'selected' : ''}>1. PENDING</option>
        <option value="Confirmed" ${isConfirmed ? 'selected' : ''}>2. CONFIRMED</option>
        <option value="Preparing" ${isPreparing ? 'selected' : ''}>3. PREPARING</option>
        <option value="Ready for Pickup" ${isReady ? 'selected' : ''}>4. READY</option>
        <option value="Completed" ${isCompleted ? 'selected' : ''}>5. COMPLETED</option>
        <option value="Cancelled" ${isCancelled ? 'selected' : ''}>6. CANCELLED</option>
      </select>
    `;

    return `
      <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
        ${selectDropdown}
        ${advanceBtn}
      </div>
    `;
  },

  async handleStatusSelectChange(orderId, newStatus, customerName) {
    if (newStatus === 'Cancelled') {
      this.confirmCancelOrder(orderId, customerName);
      return;
    }
    if (newStatus === 'Completed') {
      if (!confirm(`Mark Order #${orderId} for ${customerName} as COMPLETED and fulfilled?`)) {
        await this.loadOrders();
        return;
      }
    }
    await this.advanceOrderStatus(orderId, newStatus);
  },

  async confirmCancelOrder(orderId, customerName) {
    const isConfirmed = confirm(
      `⚠️ CANCEL ORDER #${orderId}\n\n` +
      `Are you sure you want to cancel the order for ${customerName}?\n\n` +
      `This will mark the dining token Cancelled, restock the items to canteen inventory, and alert the customer.`
    );
    if (!isConfirmed) {
      await this.loadOrders();
      return;
    }
    await this.advanceOrderStatus(orderId, 'Cancelled');
  },

  async advanceOrderStatus(orderId, newStatus) {
    try {
      const res = await window.api.updateOrderStatus(orderId, newStatus);
      if (res && res.success) {
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast(`Order #${orderId} marked as ${newStatus}!`, 'success');
        }

        // Cross-window and real-time student tracking sync (Requirement: student's order tracking must update)
        try {
          localStorage.setItem('campusbite_order_update', JSON.stringify({
            orderId,
            status: newStatus,
            timestamp: Date.now()
          }));
          window.dispatchEvent(new CustomEvent('campusbite:order_updated', {
            detail: { orderId, status: newStatus }
          }));
        } catch (e) {}

        // If student is tracking this order or student view is loaded, trigger immediate live tracking refresh
        if (window.StudentApp) {
          if (typeof window.StudentApp.renderTracking === 'function') {
            window.StudentApp.renderTracking(orderId);
          }
          if (typeof window.StudentApp.renderTrackingView === 'function') {
            window.StudentApp.renderTrackingView(orderId);
          }
          if (typeof window.StudentApp.loadActiveOrders === 'function') {
            window.StudentApp.loadActiveOrders();
          }
        }

        await this.loadOrders();
        await this.loadKPIsAndAnalytics();
      } else {
        if (window.App && typeof window.App.showToast === 'function') {
          window.App.showToast(res?.message || 'Failed to update order status', 'error');
        } else {
          alert(res?.message || 'Failed to update order status');
        }
      }
    } catch (e) {
      if (window.App && typeof window.App.showToast === 'function') {
        window.App.showToast('Failed to update order status: ' + (e.message || ''), 'error');
      } else {
        alert('Failed to update order status: ' + (e.message || ''));
      }
    }
  },

  async loadProducts() {
    try {
      const data = await window.api.getProducts();
      if (data && data.products) {
        this.products = data.products;
        this.renderProductsTable();
        this.renderInventoryTable();
      }
    } catch (e) {
      console.warn("Products error:", e);
    }
  },

  renderProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (!this.products.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;padding:32px;color:#94A3B8;">
            No food products registered in canteen menu.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.products.map(p => {
      const photoSrc = p.image || p.image_url || '';
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              ${photoSrc ? `
                <img src="${photoSrc}" alt="${p.name}" style="width:38px;height:38px;border-radius:8px;object-fit:cover;border:1px solid #CBD5E1;flex-shrink:0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <span class="avatar-monogram sm" style="display:none;width:38px;height:38px;font-size:11px;flex-shrink:0;">${(p.image_emoji || p.name).substring(0, 2).toUpperCase()}</span>
              ` : `
                <span class="avatar-monogram sm" style="width:38px;height:38px;font-size:11px;flex-shrink:0;">${(p.image_emoji || p.name).substring(0, 2).toUpperCase()}</span>
              `}
              <div>
                <strong style="color:var(--text-primary);font-size:13.5px;display:block;">${p.name}</strong>
                <div style="font-size:11px;color:var(--text-muted);max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${p.description || 'Campus Canteen Specialty'}
                </div>
              </div>
            </div>
          </td>
          <td>
            <span style="background:#F1F5F9;color:#334155;padding:3px 8px;border-radius:6px;font-size:11.5px;font-weight:600;">${p.category}</span>
          </td>
          <td>
            <span style="font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;background:${p.is_veg ? '#ECFDF5' : '#FEF2F2'};color:${p.is_veg ? '#059669' : '#DC2626'};">
              ${p.is_veg ? '● Pure Veg' : '▲ Non-Veg'}
            </span>
          </td>
          <td>
            <strong style="font-size:14.5px;color:#4F46E5;">₹${p.price}</strong>
          </td>
          <td>
            <span style="font-size:12px;color:#64748B;">${p.prep_time || '5-8 mins'}</span>
          </td>
          <td>
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <button type="button" onclick="AdminApp.adjustStock('${p.id}', -1)" style="width:20px;height:20px;border-radius:4px;border:1px solid #CBD5E1;background:#F8FAFC;font-size:11px;font-weight:700;cursor:pointer;" title="Decrease stock">-</button>
              <span style="font-weight:700;font-size:13px;min-width:48px;text-align:center;color:${p.stock <= 5 ? '#DC2626' : '#10B981'};">${p.stock} pcs</span>
              <button type="button" onclick="AdminApp.adjustStock('${p.id}', 1)" style="width:20px;height:20px;border-radius:4px;border:1px solid #CBD5E1;background:#F8FAFC;font-size:11px;font-weight:700;cursor:pointer;" title="Increase stock">+</button>
            </div>
          </td>
          <td>
            <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
              <input type="checkbox" ${p.is_available ? 'checked' : ''} onchange="AdminApp.toggleAvailability('${p.id}', this.checked)" style="accent-color:#10B981;cursor:pointer;">
              <span style="font-weight:700;font-size:11.5px;color:${p.is_available ? '#059669' : '#94A3B8'};">${p.is_available ? '● Active' : '○ Deactivated'}</span>
            </label>
          </td>
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:6px;">
              <button class="btn-outline" onclick="AdminApp.openEditProductModal('${p.id}')" style="padding:4px 10px;font-size:11.5px;border-radius:6px;font-weight:600;" title="Edit Product">Edit</button>
              <button class="btn-outline" onclick="AdminApp.deleteProduct('${p.id}')" style="padding:4px 8px;font-size:11.5px;border-radius:6px;color:#DC2626;border-color:rgba(220,38,38,0.3);" title="Delete Product">Delete</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  async loadCustomers() {
    try {
      const res = await window.api.getCustomers();
      if (res && res.success && res.customers) {
        this.customers = res.customers;
        this.renderCustomersTable();
      }
    } catch (e) {
      console.warn("Failed to load customers:", e);
    }
  },

  renderCustomersTable() {
    const tbody = document.getElementById('admin-customers-tbody');
    if (!tbody) return;

    if (!this.customers.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align:center;padding:32px;color:#94A3B8;">
            No campus diners recorded in database.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.customers.map(c => `
      <tr>
        <td>
          <span class="order-token-pill">${c.student_id || c.id.toUpperCase()}</span>
        </td>
        <td>
          <strong style="color:#0F172A;font-size:13.5px;">${c.name}</strong>
          <span style="display:inline-block;margin-left:4px;font-size:10px;padding:1px 6px;border-radius:4px;background:#F1F5F9;color:#64748B;font-weight:600;">${c.role}</span>
        </td>
        <td>
          <div style="font-size:12px;color:#334155;font-weight:600;">${c.phone}</div>
          <div style="font-size:11px;color:#64748B;">${c.email}</div>
        </td>
        <td>
          <span style="font-size:12px;color:#475569;font-weight:600;">${c.department || 'Campus'}</span>
        </td>
        <td>
          <strong style="color:#059669;font-size:13px;">₹${c.wallet_balance || 0}</strong>
        </td>
        <td>
          <span style="color:#D97706;font-weight:700;font-size:12px;">★ ${c.loyalty_points || 0}</span>
        </td>
        <td>
          <strong style="font-size:13px;color:#0F172A;">${c.total_orders || 0}</strong>
        </td>
        <td>
          <strong style="color:#4F46E5;font-size:13px;">₹${(c.total_spent || 0).toLocaleString()}</strong>
        </td>
        <td>
          <span class="status-badge-saas ready">${c.status || 'Active Verified'}</span>
        </td>
      </tr>
    `).join('');
  },

  async resetDemoDatabase() {
    if (!confirm('Reset database to clean demo scenario state? This will reinitialize orders, inventory, and reviews.')) {
      return;
    }
    try {
      const res = await window.api.resetDemo();
      if (res && res.success) {
        if (window.App && window.App.showToast) {
          window.App.showToast('Database reset to default demo scenario state.', 'success');
        } else {
          alert('Database reset to default demo scenario state.');
        }
        await this.loadAllData();
      } else {
        alert(res?.message || 'Failed to reset demo');
      }
    } catch (e) {
      alert('Database reset error: ' + (e.message || ''));
    }
  },

  renderInventoryTable() {
    const tbody = document.getElementById('admin-inventory-tbody');
    if (!tbody) return;

    // 1. Calculate & Update KPI Stat Badges
    const totalCount = this.products.length;
    const lowCount = this.products.filter(p => p.stock > 0 && p.stock <= 10).length;
    const outCount = this.products.filter(p => p.stock <= 0).length;
    const optimalCount = this.products.filter(p => p.stock > 10).length;

    const elTotal = document.getElementById('inv-stat-total');
    const elLow = document.getElementById('inv-stat-low');
    const elOut = document.getElementById('inv-stat-out');
    const elOptimal = document.getElementById('inv-stat-optimal');
    if (elTotal) elTotal.textContent = totalCount;
    if (elLow) elLow.textContent = lowCount;
    if (elOut) elOut.textContent = outCount;
    if (elOptimal) elOptimal.textContent = optimalCount;

    // 2. Render Low-Stock Warning Alert Banner (Step 21 Requirement)
    this.renderInventoryLowStockWarning();

    // 3. Render Table Rows
    if (!this.products.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;padding:40px;color:#94A3B8;">
            No inventory items registered in canteen.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.products.map(p => {
      const isZero = p.stock <= 0;
      const isLow = p.stock > 0 && p.stock <= 10;
      
      let badgeClass = 'available';
      let badgeText = 'IN STOCK';
      if (isZero) {
        badgeClass = 'critical';
        badgeText = 'OUT OF STOCK';
      } else if (isLow) {
        badgeClass = 'low';
        badgeText = 'LOW STOCK';
      }

      const photoSrc = p.image || p.image_url || '';

      return `
        <tr>
          <!-- 1. Product -->
          <td>
            <div style="display:flex;align-items:center;gap:12px;">
              ${photoSrc ? `
                <img src="${photoSrc}" alt="${p.name}" style="width:36px;height:36px;border-radius:8px;object-fit:cover;border:1px solid #CBD5E1;flex-shrink:0;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <span class="avatar-monogram sm" style="display:none;width:36px;height:36px;font-size:11px;flex-shrink:0;">${p.name.substring(0, 2).toUpperCase()}</span>
              ` : `
                <span class="avatar-monogram sm" style="width:36px;height:36px;font-size:11px;flex-shrink:0;">${p.name.substring(0, 2).toUpperCase()}</span>
              `}
              <div>
                <strong style="color:var(--text-primary);font-size:13.5px;display:block;">${p.name}</strong>
                <div style="font-size:11px;color:var(--text-muted);">${p.category} • ₹${p.price} ${p.is_veg ? '• Pure Veg' : '• Non-Veg'}</div>
              </div>
            </div>
          </td>

          <!-- 2. Current Stock -->
          <td>
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <button class="stock-ctrl-btn" onclick="AdminApp.adjustStock('${p.id}', -1)" title="Decrease stock by 1">-</button>
              <strong class="stock-count-number" style="font-size:14px;min-width:36px;text-align:center;color:${isZero ? '#DC2626' : (isLow ? '#D97706' : '#0F172A')};">
                ${p.stock}
              </strong>
              <button class="stock-ctrl-btn" onclick="AdminApp.adjustStock('${p.id}', 1)" title="Increase stock by 1">+</button>
              <span style="font-size:11px;color:#64748B;">units</span>
            </div>
          </td>

          <!-- 3. Low-Stock Status (Example: Burger | Stock: 8 | Status: LOW STOCK) -->
          <td>
            <span class="stock-badge-pill ${badgeClass}">
              ${isZero ? '🚫' : (isLow ? '⚠️' : '✓')} ${badgeText}
            </span>
          </td>

          <!-- 4. Availability (Auto-marked unavailable when stock is 0) -->
          <td>
            ${isZero ? `
              <span style="display:inline-flex;align-items:center;gap:4px;font-size:11.5px;font-weight:700;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:6px;border:1px solid #FECACA;">
                <span>✕</span> Unavailable (Stock 0)
              </span>
            ` : `
              <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;">
                <input type="checkbox" ${p.is_available ? 'checked' : ''} onchange="AdminApp.toggleAvailability('${p.id}', this.checked)" style="accent-color:#10B981;cursor:pointer;">
                <span style="font-weight:700;font-size:11.5px;color:${p.is_available ? '#059669' : '#94A3B8'};">
                  ${p.is_available ? '● Available' : '○ Disabled'}
                </span>
              </label>
            `}
          </td>

          <!-- 5. Actions (Quick Restock & Edit) -->
          <td style="text-align:right;">
            <div style="display:inline-flex;gap:6px;">
              <button class="btn-primary" onclick="AdminApp.adjustStock('${p.id}', 10)" style="padding:4px 10px;font-size:11px;font-weight:700;background:#0EA5E9;border-color:#0EA5E9;" title="Quick restock 10 units">
                +10 Restock
              </button>
              <button class="btn-outline" onclick="AdminApp.openEditProductModal('${p.id}')" style="padding:4px 10px;font-size:11.5px;border-radius:6px;font-weight:600;" title="Edit Product Details">
                Edit
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  /* Low-Stock Warning Alert Banner (Step 21 Requirement) */
  renderInventoryLowStockWarning() {
    const container = document.getElementById('inventory-low-stock-alert-container');
    if (!container) return;

    const lowStockItems = this.products.filter(p => p.stock <= 10);
    if (!lowStockItems.length) {
      container.innerHTML = `
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:12px;padding:12px 18px;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:#047857;font-size:13px;font-weight:600;">
          <span style="font-size:18px;">✓</span>
          <span>All canteen inventory levels are healthy. Zero items below threshold.</span>
        </div>
      `;
      return;
    }

    const itemsSummary = lowStockItems.map(p => {
      const statusLabel = p.stock === 0 ? 'OUT OF STOCK' : 'LOW STOCK';
      const color = p.stock === 0 ? '#DC2626' : '#B45309';
      return `<strong style="color:${color};">${p.name}</strong> (Stock: ${p.stock} • ${statusLabel})`;
    }).join(', ');

    container.innerHTML = `
      <div class="inventory-low-stock-banner" style="background:#FFFBEB;border:1.5px solid #F59E0B;border-radius:12px;padding:14px 18px;margin-bottom:16px;display:flex;align-items:flex-start;gap:14px;box-shadow:0 2px 8px rgba(245,158,11,0.1);">
        <span style="font-size:24px;line-height:1;margin-top:2px;">⚠️</span>
        <div style="flex:1;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;">
            <strong style="color:#B45309;font-size:14px;text-transform:uppercase;letter-spacing:0.3px;">LOW STOCK WARNING</strong>
            <span style="font-size:11.5px;color:#92400E;background:#FEF3C7;padding:2px 8px;border-radius:999px;font-weight:700;">${lowStockItems.length} Items At Risk</span>
          </div>
          <p style="margin:5px 0 10px;font-size:12.5px;color:#92400E;line-height:1.5;">
            The following dishes are running critically low on inventory: ${itemsSummary}. Items reaching 0 stock are automatically marked unavailable in the student catalogue.
          </p>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn-primary" onclick="AdminApp.restockAllLowItems(10)" style="padding:5px 14px;font-size:11.5px;font-weight:700;background:#D97706;border-color:#D97706;">
              ⚡ Restock All (${lowStockItems.length} items) +10 Units
            </button>
            <button type="button" class="btn-outline" onclick="AdminApp.loadProducts()" style="padding:5px 12px;font-size:11.5px;border-color:#F59E0B;color:#B45309;">
              Refresh Inventory
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /* Bulk Restock All Low-Stock Items */
  async restockAllLowItems(units = 10) {
    const lowStockItems = this.products.filter(p => p.stock <= 10);
    if (!lowStockItems.length) {
      App.showToast('No items currently need restocking!', 'info');
      return;
    }

    try {
      for (const item of lowStockItems) {
        await window.api.updateProduct(item.id, {
          stock: item.stock + units,
          is_available: true
        });
      }
      App.showToast(`Restocked ${lowStockItems.length} low-stock dishes (+${units} units each)!`, 'success');
      await this.loadProducts();
      await this.loadKPIsAndAnalytics();
      this.notifyProductCatalogChange('all', 'bulk_restocked');
    } catch (e) {
      App.showToast('Failed to complete bulk restock', 'error');
    }
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
        App.showToast(`Price for ${product ? product.name : 'dish'} updated: ₹${oldPrice} to ₹${newPrice}.`, 'success');
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

  /* Live Image Preview Helper */
  handleImagePreview(inputId, previewContainerId) {
    const input = document.getElementById(inputId);
    const container = document.getElementById(previewContainerId);
    if (!container) return;
    const url = input ? input.value.trim() : '';
    if (url) {
      container.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:22px;\\'>🍱</span>'" />`;
    } else {
      container.innerHTML = `<span style="font-size:22px;">🍱</span>`;
    }
  },

  /* File upload to DataURL helper */
  handleImageFileUpload(event, targetInputId, previewContainerId) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const input = document.getElementById(targetInputId);
      if (input) input.value = dataUrl;
      this.handleImagePreview(targetInputId, previewContainerId);
    };
    reader.readAsDataURL(file);
  },

  /* Broadcast Product Change for Live Student Catalogue Update */
  notifyProductCatalogChange(productId, actionType) {
    try {
      localStorage.setItem('campusbite_product_update', JSON.stringify({
        productId,
        type: actionType,
        timestamp: Date.now()
      }));
      window.dispatchEvent(new CustomEvent('campusbite:product_updated', {
        detail: { productId, type: actionType }
      }));
    } catch (e) {}

    if (window.StudentApp && typeof window.StudentApp.loadProducts === 'function') {
      window.StudentApp.loadProducts();
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
    document.getElementById('edit-prod-category').value = p.category;
    document.getElementById('edit-prod-price').value = p.price;
    document.getElementById('edit-prod-stock').value = p.stock !== undefined ? p.stock : 25;
    document.getElementById('edit-prod-prep').value = p.prep_time || '5-8 mins';
    document.getElementById('edit-prod-is-veg').value = String(p.is_veg !== false);
    document.getElementById('edit-prod-desc').value = p.description || '';
    document.getElementById('edit-prod-available').checked = Boolean(p.is_available !== false);

    const imgUrlInput = document.getElementById('edit-prod-image-url');
    if (imgUrlInput) {
      imgUrlInput.value = p.image || p.image_url || '';
      this.handleImagePreview('edit-prod-image-url', 'edit-prod-image-preview');
    }

    App.openModal('edit-product-modal');
  },

  /* Submit Full Edit Modal */
  async handleEditProductSubmit(event) {
    if (event) event.preventDefault();

    const productId = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('edit-prod-name').value.trim();
    const category = document.getElementById('edit-prod-category').value;
    const price = Number(document.getElementById('edit-prod-price').value);
    const stock = Number(document.getElementById('edit-prod-stock').value);
    const prep_time = document.getElementById('edit-prod-prep').value.trim() || '5-8 mins';
    const is_veg = document.getElementById('edit-prod-is-veg').value === 'true';
    const description = document.getElementById('edit-prod-desc').value.trim();
    const is_available = document.getElementById('edit-prod-available').checked;
    const imageUrl = document.getElementById('edit-prod-image-url')?.value?.trim() || '';

    // Validation
    if (!name || name.length < 2) {
      App.showToast('Product name is required (minimum 2 characters)', 'warning');
      return;
    }
    if (isNaN(price) || price <= 0) {
      App.showToast('Please enter a valid price greater than ₹0', 'warning');
      return;
    }
    if (!category) {
      App.showToast('Please select a valid food category', 'warning');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      App.showToast('Stock count cannot be negative', 'warning');
      return;
    }

    try {
      const res = await window.api.updateProduct(productId, {
        name,
        category,
        price,
        stock,
        prep_time,
        is_veg,
        description,
        is_available,
        image: imageUrl,
        image_url: imageUrl
      });

      if (res && res.success) {
        App.closeModal('edit-product-modal');
        App.showToast(`Updated "${name}" (₹${price}, Stock: ${stock}).`, 'success');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        this.notifyProductCatalogChange(productId, 'updated');
      } else {
        App.showToast(res.message || 'Update failed', 'error');
      }
    } catch (e) {
      App.showToast(e.message || 'Failed to update product details', 'error');
    }
  },

  async adjustStock(productId, delta) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    const newStock = Math.max(0, product.stock + delta);
    try {
      const res = await window.api.updateProduct(productId, { stock: newStock });
      if (res && res.success) {
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        this.notifyProductCatalogChange(productId, 'stock_updated');
        App.showToast(`Stock updated: ${product.name} is now ${newStock} pcs.`, 'info');
      }
    } catch (e) {
      App.showToast('Stock update failed', 'error');
    }
  },

  async toggleAvailability(productId, isAvailable) {
    const product = this.products.find(p => p.id === productId);
    const prodName = product ? product.name : 'Product';
    try {
      const res = await window.api.updateProduct(productId, { is_available: isAvailable });
      if (res && res.success) {
        await this.loadProducts();
        this.notifyProductCatalogChange(productId, isAvailable ? 'activated' : 'deactivated');
        App.showToast(`"${prodName}" is now ${isAvailable ? 'Active on Student Menu' : 'Disabled / Sold Out'}`, 'success');
      }
    } catch (e) {
      App.showToast('Failed to update availability', 'error');
    }
  },

  openAddProductModal() {
    const form = document.getElementById('add-product-form');
    if (form) form.reset();
    const preview = document.getElementById('add-prod-image-preview');
    if (preview) preview.innerHTML = `<span style="font-size:22px;">🍱</span>`;
    App.openModal('add-product-modal');
  },

  async handleProductSubmit(event) {
    if (event) event.preventDefault();

    const name = document.getElementById('prod-name').value.trim();
    const price = Number(document.getElementById('prod-price').value);
    const category = document.getElementById('prod-category').value;
    const stock = Number(document.getElementById('prod-stock').value) || 25;
    const isVeg = document.getElementById('prod-is-veg').value === 'true';
    const isAvailable = document.getElementById('prod-available').checked;
    const prep = document.getElementById('prod-prep')?.value?.trim() || '5-8 mins';
    const desc = document.getElementById('prod-desc')?.value?.trim() || 'Freshly prepared at Campus Canteen';
    const imageUrl = document.getElementById('prod-image-url')?.value?.trim() || '';

    // Validation
    if (!name || name.length < 2) {
      App.showToast('Product name is required (minimum 2 characters)', 'warning');
      return;
    }
    if (isNaN(price) || price <= 0) {
      App.showToast('Price must be a valid number greater than ₹0', 'warning');
      return;
    }
    if (!category) {
      App.showToast('Product category is required', 'warning');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      App.showToast('Stock must be 0 or higher', 'warning');
      return;
    }

    try {
      const res = await window.api.createProduct({
        name,
        price,
        category,
        stock,
        is_veg: isVeg,
        is_available: isAvailable,
        prep_time: prep,
        description: desc,
        image: imageUrl,
        image_url: imageUrl
      });

      if (res && res.success) {
        App.closeModal('add-product-modal');
        document.getElementById('add-product-form')?.reset();
        App.showToast(`Added "${res.product.name}" (₹${res.product.price}) to menu!`, 'success');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        this.notifyProductCatalogChange(res.product.id, 'created');
      } else {
        App.showToast(res.message || 'Failed to add product', 'error');
      }
    } catch (e) {
      App.showToast(e.message || 'Error adding product', 'error');
    }
  },

  async deleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    const name = product ? product.name : 'this item';
    if (!confirm(`⚠️ DELETE PRODUCT\n\nAre you sure you want to permanently delete "${name}" from the canteen menu?\n\nStudents will no longer see this dish in the catalogue.`)) {
      return;
    }

    try {
      const res = await window.api.deleteProduct(productId);
      if (res && res.success) {
        App.showToast(`Permanently deleted "${name}" from canteen menu.`, 'info');
        await this.loadProducts();
        await this.loadKPIsAndAnalytics();
        this.notifyProductCatalogChange(productId, 'deleted');
      } else {
        App.showToast(res.message || 'Failed to delete product', 'error');
      }
    } catch (e) {
      App.showToast(e.message || 'Failed to delete product', 'error');
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
              
              <span><strong>Recommendation:</strong> ${pred.actionText}</span>
            </div>

            <p style="font-size:11.5px;color:var(--text-secondary);margin-top:8px;line-height:1.4;">
              Key Driver: <em>${pred.keyDriver}</em>
            </p>
          </div>

          ${isDeficit ? `
            <button class="apply-prep-btn" onclick="AdminApp.applyDemandPrepPlan('${pred.productId}', ${pred.recommendedPrep})">
              Accept Recommendation (+${pred.recommendedPrep} to Kitchen Sheet)
            </button>
          ` : `
            <div style="text-align:center;font-size:12px;color:var(--accent-emerald);font-weight:700;padding:6px;">
              Stock Optimized
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
      if (!res || !res.success) return;

      const avg = Number(res.avg_rating) || 4.8;
      const count = Number(res.count) || (res.reviews || []).length;
      const subs = res.sub_averages || { food_quality: 4.8, service_speed: 4.7, app_experience: 4.9 };

      const avgEl = document.getElementById('admin-review-score-avg');
      if (avgEl) avgEl.textContent = `${avg.toFixed(1)} / 5.0`;

      const foodEl = document.getElementById('admin-review-score-food');
      if (foodEl) foodEl.textContent = `${subs.food_quality} / 5.0`;

      const speedEl = document.getElementById('admin-review-score-speed');
      if (speedEl) speedEl.textContent = `${subs.service_speed} / 5.0`;

      const appEl = document.getElementById('admin-review-score-app');
      if (appEl) appEl.textContent = `${subs.app_experience} / 5.0`;

      const badgeEl = document.getElementById('admin-review-total-badge');
      if (badgeEl) badgeEl.textContent = `Real customer ratings collected post-order pickup (${count} total reviews)`;

      const container = document.getElementById('admin-reviews-list');
      if (container && res.reviews) {
        if (res.reviews.length === 0) {
          container.innerHTML = `
            <div style="text-align:center;padding:32px;color:var(--text-muted);grid-column:1/-1;">
              <div style="font-size:32px;margin-bottom:8px;">📝</div>
              <strong>No customer reviews yet</strong>
              <p style="margin:4px 0 0;font-size:12px;">Reviews submitted by students after completing orders will appear here.</p>
            </div>
          `;
          return;
        }

        container.innerHTML = res.reviews.map(r => `
          <div class="review-card-item">
            <div class="review-author-row" style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div>
                <strong style="color:var(--text-primary);">${r.user_name || 'Campus Student'}</strong>
                <span style="font-size:11px;color:var(--text-muted);margin-left:6px;">Order #${r.order_id}</span>
                ${r.product_name ? `<div style="font-size:11px;color:#059669;font-weight:600;margin-top:2px;">${r.product_name}</div>` : ''}
              </div>
              <div class="review-stars" style="font-weight:700;font-size:12px;color:#F59E0B;background:#FEF3C7;padding:3px 8px;border-radius:12px;">
                ${'★'.repeat(r.rating || 5)} ${r.rating} / 5
              </div>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.4;margin:8px 0;">"${r.comment}"</p>
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
      document.getElementById('scanned-order-items').textContent = `${itemsText} (Total: ₹${order.total_amount})`;
      
      const btn = document.getElementById('scanned-handover-btn');
      if (btn) {
        if (order.order_status === 'Completed') {
          btn.textContent = 'Already Picked Up / Completed';
          btn.disabled = true;
          btn.style.opacity = '0.6';
        } else {
          btn.textContent = 'Hand Over Tray & Complete Order';
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
        App.showToast(`Order #${orderId} handed over and marked Completed.`, 'success');
        await this.loadOrders();
        await this.loadKPIsAndAnalytics();
      }
    } catch (e) {
      App.showToast('Failed to complete order', 'error');
    }
  }
};

window.AdminApp = AdminApp;
