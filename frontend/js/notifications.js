/**
 * CampusBite Live Notification Engine (Step 17)
 * Real-time SSE listener, audio synthesizer chime, floating push toast,
 * dropdown drawer, and dedicated Notifications Screen.
 */

class CampusNotificationManager {
  constructor() {
    this.role = 'student'; // 'student' or 'admin'
    this.userId = 'u-101';
    this.eventSource = null;
    this.notifications = [];
    this.unreadCount = 0;
    this.soundEnabled = true;
    this.audioCtx = null;
    this.reconnectTimer = null;
    this.pollInterval = null;
    this.isOpen = false;
    this.activeFilter = 'all'; // 'all', 'unread', 'orders', 'offers'
  }

  init(role = 'student', userId = 'u-101') {
    this.role = role;
    this.userId = userId;

    // Load sound preference from localStorage
    const savedSound = localStorage.getItem('campusbite_sound_notif');
    if (savedSound !== null) {
      this.soundEnabled = savedSound === 'true';
    }

    // Ensure floating toast container exists
    this.ensureToastContainer();

    // Fetch initial notification list
    this.fetchHistory();

    // Connect to SSE stream
    this.connectSSE();

    // Setup global click listener to close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('notif-dropdown-panel');
      const btn = document.getElementById('notif-bell-btn');
      if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        this.closePanel();
      }
    });
  }

  ensureToastContainer() {
    if (!document.getElementById('live-notif-toast-container')) {
      const container = document.createElement('div');
      container.id = 'live-notif-toast-container';
      document.body.appendChild(container);
    }
  }

  connectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    const sseUrl = `/api/notifications/stream?role=${encodeURIComponent(this.role)}&userId=${encodeURIComponent(this.userId)}`;
    
    try {
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.updateSyncStatus(true);
        if (this.pollInterval) {
          clearInterval(this.pollInterval);
          this.pollInterval = null;
        }
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingEvent(data);
        } catch (e) {
          console.warn("Error parsing SSE notification payload", e);
        }
      };

      this.eventSource.onerror = (err) => {
        this.updateSyncStatus(false);
        this.eventSource.close();
        this.eventSource = null;

        // Fallback polling every 10s until SSE recovers
        if (!this.pollInterval) {
          this.pollInterval = setInterval(() => this.fetchHistory(true), 10000);
        }

        // Try reconnecting SSE in 5 seconds
        if (!this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connectSSE();
          }, 5000);
        }
      };
    } catch (e) {
      console.warn("EventSource unsupported or failed, using fallback polling", e);
      this.pollInterval = setInterval(() => this.fetchHistory(true), 10000);
    }
  }

  handleIncomingEvent(data) {
    if (data.type === 'CONNECTED') {
      this.unreadCount = data.unreadCount || 0;
      this.updateBadge();
      return;
    }

    if (data.type === 'NOTIFICATION' && data.notification) {
      const notif = data.notification;
      
      // Add to local list
      this.notifications.unshift(notif);
      this.unreadCount += 1;
      this.updateBadge();
      this.renderList();

      // Play audio chime
      if (this.soundEnabled) {
        this.playChime();
      }

      // Show floating push toast
      this.showPushToast(notif);

      // Trigger native browser notification if granted
      this.showBrowserNotification(notif);

      // Trigger contextual live UI updates across applications
      this.triggerContextualUpdates(notif);
    }
  }

  triggerContextualUpdates(notif) {
    // If Student Website or Mobile App:
    if (this.role !== 'admin' && window.StudentApp) {
      if (notif.type.startsWith('ORDER_') || notif.type === 'ORDER_STATUS_CHANGED' || notif.type === 'ORDER_PLACED') {
        const orderId = notif.data?.orderId || notif.data?.order?.id;
        if (typeof window.StudentApp.loadActiveOrders === 'function') {
          window.StudentApp.loadActiveOrders();
        }
        if (typeof window.StudentApp.renderTrackingView === 'function') {
          window.StudentApp.renderTrackingView(orderId);
        } else if (typeof window.StudentApp.renderTracking === 'function') {
          window.StudentApp.renderTracking(orderId);
        }
      }
      if (notif.type === 'price_updated' || notif.type === 'product_updated' || notif.type === 'product_added') {
        if (typeof window.StudentApp.loadProducts === 'function') {
          window.StudentApp.loadProducts();
        }
      }
    }

    // If Admin Hub:
    if (this.role === 'admin' && window.AdminApp) {
      if (notif.type === 'NEW_ORDER' || notif.type.startsWith('ORDER_') || notif.type === 'ORDER_STATUS_CHANGED') {
        if (typeof window.AdminApp.loadOrders === 'function') {
          window.AdminApp.loadOrders();
        }
        if (typeof window.AdminApp.loadKPIs === 'function') {
          window.AdminApp.loadKPIs();
        }
      }
      if (notif.type === 'LOW_STOCK' || notif.type === 'price_updated' || notif.type === 'product_updated' || notif.type === 'product_added') {
        if (typeof window.AdminApp.loadProducts === 'function') {
          window.AdminApp.loadProducts();
        }
      }
    }
  }

  async fetchHistory(silent = false) {
    try {
      const res = await fetch(`/api/notifications?role=${encodeURIComponent(this.role)}&userId=${encodeURIComponent(this.userId)}`);
      const data = await res.json();
      if (data.success) {
        this.notifications = data.notifications || [];
        this.unreadCount = data.unreadCount || 0;
        this.updateBadge();
        this.renderList();
      }
    } catch (e) {
      if (!silent) console.warn("Could not fetch notification history", e);
    }
  }

  showPushToast(notif) {
    this.ensureToastContainer();
    const container = document.getElementById('live-notif-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    let toastTypeClass = '';
    if (notif.type === 'ORDER_CONFIRMED' || notif.type === 'ORDER_READY' || notif.title.includes('Ready')) toastTypeClass = 'success';
    if (notif.type === 'LOW_STOCK') toastTypeClass = 'alert';
    if (notif.type === 'COUPON_AVAILABLE' || notif.type === 'PROMO' || notif.type === 'NEW_OFFER') toastTypeClass = 'warning';

    toast.className = `live-notif-toast ${toastTypeClass}`;
    toast.innerHTML = `
      <div class="live-notif-icon">${this.getTypeEmoji(notif.type)}</div>
      <div class="live-notif-content">
        <div class="live-notif-title">
          <span>${this.escapeHtml(notif.title)}</span>
          <span class="live-notif-time">Just now</span>
        </div>
        <div class="live-notif-msg">${this.escapeHtml(notif.message)}</div>
      </div>
      <button class="live-notif-close" title="Dismiss">&times;</button>
    `;

    // Click handler to view or dismiss
    toast.querySelector('.live-notif-close').onclick = (e) => {
      e.stopPropagation();
      this.dismissToast(toast);
    };

    toast.onclick = () => {
      this.dismissToast(toast);
      this.handleNotificationClick(notif);
    };

    container.prepend(toast);

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      this.dismissToast(toast);
    }, 6000);
  }

  dismissToast(toast) {
    if (!toast || toast.classList.contains('closing')) return;
    toast.classList.add('closing');
    setTimeout(() => {
      toast.remove();
    }, 250);
  }

  handleNotificationClick(notif) {
    // Automatically mark as read
    if (!notif.read) {
      this.markRead(notif.id);
    }

    if (this.role !== 'admin' && window.StudentApp) {
      if (notif.type.startsWith('ORDER_') || notif.type === 'ORDER_STATUS_CHANGED' || notif.type === 'ORDER_PLACED') {
        const orderId = notif.data?.orderId || notif.data?.order?.id;
        window.StudentApp.navigateTo('tracking');
        if (orderId && typeof window.StudentApp.renderTrackingView === 'function') {
          window.StudentApp.renderTrackingView(orderId);
        }
      } else if (notif.type === 'COUPON_AVAILABLE' || notif.type === 'PROMO' || notif.type === 'NEW_OFFER') {
        window.StudentApp.navigateTo('home');
      }
    } else if (this.role === 'admin' && window.AdminApp) {
      if (notif.type === 'NEW_ORDER' || notif.type.startsWith('ORDER_')) {
        window.AdminApp.switchTab('orders');
      } else if (notif.type === 'LOW_STOCK') {
        window.AdminApp.switchTab('inventory');
      }
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('notif-dropdown-panel');
    const btn = document.getElementById('notif-bell-btn');

    if (panel) {
      panel.classList.toggle('open', this.isOpen);
    }
    if (btn) {
      btn.classList.toggle('active', this.isOpen);
    }

    if (this.isOpen) {
      this.renderList();
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }

  closePanel() {
    this.isOpen = false;
    const panel = document.getElementById('notif-dropdown-panel');
    const btn = document.getElementById('notif-bell-btn');
    if (panel) panel.classList.remove('open');
    if (btn) btn.classList.remove('active');
  }

  updateBadge() {
    // Topbar Bell badges
    const badges = document.querySelectorAll('.notif-unread-badge, #notif-unread-badge');
    badges.forEach(badge => {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    });

    // Screen headers unread counters
    const screenBadge = document.getElementById('screen-notif-unread-count');
    if (screenBadge) {
      screenBadge.textContent = `${this.unreadCount} unread`;
    }
    const screenTotal = document.getElementById('screen-notif-total-count');
    if (screenTotal) {
      screenTotal.textContent = `${this.notifications.length} total`;
    }
  }

  getTypeEmoji(type) {
    switch (type) {
      case 'ORDER_CONFIRMED': return '✓';
      case 'ORDER_PREPARING': return '🍳';
      case 'ORDER_READY': return '🔔';
      case 'ORDER_COMPLETED': return '🎉';
      case 'COUPON_AVAILABLE':
      case 'PROMO':
      case 'NEW_OFFER': return '🏷️';
      case 'LOW_STOCK': return '⚠️';
      default: return '📢';
    }
  }

  getTypeClass(type) {
    switch (type) {
      case 'ORDER_CONFIRMED': return 'confirmed';
      case 'ORDER_PREPARING': return 'preparing';
      case 'ORDER_READY': return 'ready';
      case 'ORDER_COMPLETED': return 'completed';
      case 'COUPON_AVAILABLE':
      case 'PROMO':
      case 'NEW_OFFER': return 'coupon';
      default: return 'system';
    }
  }

  getTypeLabel(type) {
    switch (type) {
      case 'ORDER_CONFIRMED': return 'Order Confirmed';
      case 'ORDER_PREPARING': return 'Kitchen Preparing';
      case 'ORDER_READY': return 'Ready for Pickup';
      case 'ORDER_COMPLETED': return 'Order Completed';
      case 'COUPON_AVAILABLE':
      case 'PROMO':
      case 'NEW_OFFER': return 'Special Offer';
      default: return 'Canteen Notice';
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  formatTimestamp(dateString) {
    if (!dateString) {
      return { relative: 'Just now', full: 'Just now' };
    }
    const d = new Date(dateString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    let relative = 'Just now';
    if (diff >= 15 && diff < 60) relative = `${diff}s ago`;
    else if (diff >= 60 && diff < 3600) relative = `${Math.floor(diff / 60)}m ago`;
    else if (diff >= 3600 && diff < 86400) relative = `${Math.floor(diff / 3600)}h ago`;
    else if (diff >= 86400) relative = `${Math.floor(diff / 86400)}d ago`;

    const full = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return { relative, full };
  }

  renderList() {
    // 1. Render Dropdown Panel
    const container = document.getElementById('notif-items-list');
    if (container) {
      if (!this.notifications.length) {
        container.innerHTML = `
          <div class="notif-empty-state">
            <div style="margin-bottom:8px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></div>
            <strong>No notifications yet</strong>
            <p style="margin:4px 0 0;font-size:11px;color:#64748B;">You're all caught up with canteen updates!</p>
          </div>
        `;
      } else {
        container.innerHTML = this.notifications.map(n => {
          const { relative, full } = this.formatTimestamp(n.created_at);
          const isUnread = !n.read;
          const emoji = this.getTypeEmoji(n.type);

          return `
            <div class="notif-item ${isUnread ? 'unread' : 'read'}" onclick="CampusNotifications.markRead('${n.id}')" title="Received: ${full}">
              <div class="notif-item-icon" style="font-size:15px;">${emoji}</div>
              <div class="notif-item-body">
                <div class="notif-item-header">
                  <span class="notif-item-title">${this.escapeHtml(n.title)}</span>
                  <span class="notif-item-time">${relative}</span>
                </div>
                <div class="notif-item-msg">${this.escapeHtml(n.message)}</div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;">
                  <span style="font-size:9.5px;color:#94A3B8;">${full}</span>
                  <span class="notif-status-badge ${isUnread ? 'unread' : 'read'}">
                    ${isUnread ? '● Unread' : '✓ Read'}
                  </span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // 2. Render Dedicated Notifications Screen (if mounted)
    this.renderScreen();
  }

  setFilter(filterType) {
    this.activeFilter = filterType;
    document.querySelectorAll('.notif-filter-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });
    this.renderScreen();
  }

  renderScreen() {
    const screenList = document.getElementById('screen-notifications-list');
    if (!screenList) return;

    this.updateBadge();

    // Filter notifications
    let items = [...this.notifications];
    if (this.activeFilter === 'unread') {
      items = items.filter(n => !n.read);
    } else if (this.activeFilter === 'orders') {
      items = items.filter(n => n.type.startsWith('ORDER_') || n.type === 'ORDER_STATUS_CHANGED' || n.type === 'ORDER_PLACED');
    } else if (this.activeFilter === 'offers') {
      items = items.filter(n => n.type === 'COUPON_AVAILABLE' || n.type === 'PROMO' || n.type === 'NEW_OFFER');
    }

    if (!items.length) {
      screenList.innerHTML = `
        <div style="background:#FFFFFF;border:1px dashed #CBD5E1;border-radius:16px;padding:48px 20px;text-align:center;">
          <div style="font-size:42px;margin-bottom:12px;">📭</div>
          <h4 style="font-size:16px;font-weight:700;color:#0F172A;margin:0 0 6px;">No Notifications Found</h4>
          <p style="font-size:13px;color:#64748B;margin:0 0 16px;">
            ${this.activeFilter === 'unread' ? "You've read all your campus notifications!" : "There are no notifications matching this category."}
          </p>
          <button type="button" class="btn-primary" onclick="CampusNotifications.setFilter('all')" style="padding:8px 18px;font-size:12px;border-radius:999px;">
            View All Notifications
          </button>
        </div>
      `;
      return;
    }

    screenList.innerHTML = items.map(n => {
      const { relative, full } = this.formatTimestamp(n.created_at);
      const isUnread = !n.read;
      const avatarClass = this.getTypeClass(n.type);
      const emoji = this.getTypeEmoji(n.type);
      const categoryLabel = this.getTypeLabel(n.type);

      let actionBtnText = '';
      if (n.type.startsWith('ORDER_')) {
        actionBtnText = 'Track Order →';
      } else if (n.type === 'COUPON_AVAILABLE' || n.type === 'PROMO') {
        actionBtnText = 'View Menu & Apply →';
      }

      return `
        <div class="screen-notif-card ${isUnread ? 'unread' : 'read'}" onclick="CampusNotifications.handleNotificationClick(${JSON.stringify(n).replace(/"/g, '&quot;')})">
          <div class="screen-notif-avatar ${avatarClass}">
            ${emoji}
          </div>
          <div class="screen-notif-main">
            <div class="screen-notif-top">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="screen-notif-title">${this.escapeHtml(n.title)}</span>
                <span style="font-size:10.5px;font-weight:700;color:#64748B;background:#F1F5F9;padding:2px 7px;border-radius:6px;">
                  ${categoryLabel}
                </span>
              </div>
              <span class="screen-notif-status-badge ${isUnread ? 'unread' : 'read'}">
                ${isUnread ? '● Unread' : '✓ Read'}
              </span>
            </div>
            <div class="screen-notif-message">
              ${this.escapeHtml(n.message)}
            </div>
            <div class="screen-notif-footer">
              <div style="display:flex;align-items:center;gap:12px;">
                <span>🕒 <strong>${relative}</strong> (${full})</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                ${isUnread ? `
                  <button type="button" onclick="event.stopPropagation(); CampusNotifications.markRead('${n.id}')" style="background:none;border:none;color:#4F46E5;font-weight:700;font-size:11.5px;cursor:pointer;padding:0;">
                    Mark Read
                  </button>
                ` : ''}
                ${actionBtnText ? `
                  <span style="font-weight:700;color:#0F172A;font-size:11.5px;">${actionBtnText}</span>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async markAllRead() {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: this.role, userId: this.userId })
      });
      this.notifications.forEach(n => { n.read = true; });
      this.unreadCount = 0;
      this.updateBadge();
      this.renderList();
    } catch (e) {
      console.warn("Could not mark all notifications read", e);
    }
  }

  async markRead(id) {
    const item = this.notifications.find(n => n.id === id);
    if (item && !item.read) {
      item.read = true;
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.updateBadge();
      this.renderList();
      try {
        await fetch(`/api/notifications/read/${id}`, { method: 'POST' });
      } catch (e) {}
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('campusbite_sound_notif', String(this.soundEnabled));
    const btn = document.getElementById('notif-sound-btn');
    if (btn) {
      btn.innerHTML = this.soundEnabled ? 'Sound On' : 'Muted';
    }
    if (this.soundEnabled) {
      this.playChime();
    }
  }

  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1: 587.33 Hz (D5)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: 880 Hz (A5)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.15, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch (e) {}
  }

  showBrowserNotification(notif) {
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } catch (e) {}
    }
  }

  updateSyncStatus(connected) {
    const dot = document.querySelector('.live-sync-pulse-dot');
    const label = document.getElementById('notif-sync-label');
    if (dot) {
      dot.style.background = connected ? '#14B8A6' : '#EF4444';
      dot.style.boxShadow = connected ? '0 0 6px #14B8A6' : '0 0 6px #EF4444';
    }
    if (label) {
      label.textContent = connected ? 'Live' : 'Connecting...';
    }
  }

  // Trigger test notification
  async triggerDemoPush(scenario = 'confirmed') {
    let payload = {};
    if (scenario === 'confirmed') {
      payload = {
        title: "Order Confirmed: #CB1030",
        message: "Your order #CB1030 has been confirmed. Kitchen has queued preparation.",
        type: "ORDER_CONFIRMED",
        target: "student",
        userId: this.userId
      };
    } else if (scenario === 'preparing') {
      payload = {
        title: "Order Being Prepared: #CB1030",
        message: "Chef has fired your Masala Dosa combo at Counter 2. Ready in ~4 mins!",
        type: "ORDER_PREPARING",
        target: "student",
        userId: this.userId
      };
    } else if (scenario === 'ready') {
      payload = {
        title: "Order Ready for Pickup: #CB1030",
        message: "Order #CB1030 is READY for pickup at Counter 2! Token #CB1030.",
        type: "ORDER_READY",
        target: "student",
        userId: this.userId
      };
    } else if (scenario === 'completed') {
      payload = {
        title: "Order Completed: #CB1030",
        message: "Order #CB1030 picked up. Thank you for dining with CampusBite!",
        type: "ORDER_COMPLETED",
        target: "student",
        userId: this.userId
      };
    } else if (scenario === 'coupon') {
      payload = {
        title: "Coupon Available: TASTY30",
        message: "Flash sale! Get 30% OFF on all rolls and snacks with code TASTY30.",
        type: "COUPON_AVAILABLE",
        target: "student",
        userId: this.userId
      };
    } else {
      payload = {
        title: "Kitchen System Announcement",
        message: "Counter 1 & 2 express digital pickup channels are fully online.",
        type: "SYSTEM",
        target: "student",
        userId: this.userId
      };
    }

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.warn("Error triggering demo notification", e);
    }
  }
}

const CampusNotifications = new CampusNotificationManager();
window.CampusNotifications = CampusNotifications;
