/**
 * CampusBite Live Notification Engine
 * Real-time SSE listener, audio synthesizer chime, floating push toast,
 * and persistent drawer with unread counter.
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

    // Request native browser notification permission gently if supported
    if ("Notification" in window && Notification.permission === "default") {
      // We will request on first bell click or user interaction
    }
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
      if (notif.type === 'ORDER_STATUS_CHANGED' || notif.type === 'ORDER_PLACED') {
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
      if (notif.type === 'NEW_ORDER' || notif.type === 'ORDER_STATUS_CHANGED') {
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
    if (notif.type === 'ORDER_PLACED' || notif.title.includes('Ready')) toastTypeClass = 'success';
    if (notif.type === 'LOW_STOCK') toastTypeClass = 'alert';
    if (notif.type === 'PROMO') toastTypeClass = 'warning';

    toast.className = `live-notif-toast ${toastTypeClass}`;
    toast.innerHTML = `
      <div class="live-notif-icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></div>
      <div class="live-notif-content">
        <div class="live-notif-title">
          <span>${notif.title}</span>
          <span class="live-notif-time">Just now</span>
        </div>
        <div class="live-notif-msg">${notif.message}</div>
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
    if (this.role !== 'admin' && window.StudentApp) {
      if (notif.type === 'ORDER_STATUS_CHANGED' || notif.type === 'ORDER_PLACED') {
        window.StudentApp.navigateTo('tracking');
      } else if (notif.type === 'PROMO') {
        window.StudentApp.navigateTo('menu');
      }
    } else if (this.role === 'admin' && window.AdminApp) {
      if (notif.type === 'NEW_ORDER') {
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
      // Ask for browser notification permission on first open if needed
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
    const badge = document.getElementById('notif-unread-badge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }

  renderList() {
    const container = document.getElementById('notif-items-list');
    if (!container) return;

    if (!this.notifications.length) {
      container.innerHTML = `
        <div class="notif-empty-state">
          <div style="margin-bottom:8px;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="1.5"><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M18.63 13A17.89 17.89 0 0 1 18 8"></path><path d="M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14"></path><path d="M18 8a6 6 0 0 0-9.33-5"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg></div>
          <strong>No new notifications</strong>
          <p style="margin:4px 0 0;font-size:11px;color:#64748B;">You're all caught up with canteen updates!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.notifications.map(n => {
      const timeStr = this.formatRelativeTime(n.created_at);
      const isUnread = !n.read;
      return `
        <div class="notif-item ${isUnread ? 'unread' : ''}" onclick="CampusNotifications.markRead('${n.id}')">
          <div class="notif-item-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></div>
          <div class="notif-item-body">
            <div class="notif-item-header">
              <span class="notif-item-title">${n.title}</span>
              <span class="notif-item-time">${timeStr}</span>
            </div>
            <div class="notif-item-msg">${n.message}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  formatRelativeTime(dateString) {
    if (!dateString) return 'Just now';
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 15) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  }

  async markAllRead() {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: this.role, userId: this.userId })
      });
      this.notifications.forEach(n => n.read = true);
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
    if (item) {
      this.handleNotificationClick(item);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('campusbite_sound_notif', String(this.soundEnabled));
    const btn = document.getElementById('notif-sound-btn');
    if (btn) {
      btn.innerHTML = this.soundEnabled ? 'Audio On' : 'Muted';
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

      // Note 2: 880 Hz (A5) for high pleasant chime
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
    } catch (e) {
      // Audio autoplay may be constrained before first user tap
    }
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

  // Helper method to trigger a demo notification anytime
  async triggerDemoPush() {
    try {
      const isStudent = this.role !== 'admin';
      const sample = isStudent ? {
        title: "Kitchen Preparing Order #CB1028",
        message: "Your Masala Dosa combo is actively cooking at Counter 2. Token ready in 3 mins!",
        type: "ORDER_STATUS_CHANGED",
        target: "student",
        icon: ""
      } : {
        title: "New Order #CB1029 Arrived",
        message: "Jaswant Karun ordered Paneer Roll + Cold Coffee (₹140). Counter 1.",
        type: "NEW_ORDER",
        target: "admin",
        icon: ""
      };

      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample)
      });
    } catch (e) {
      console.warn("Error triggering demo notification", e);
    }
  }
}

const CampusNotifications = new CampusNotificationManager();
window.CampusNotifications = CampusNotifications;
