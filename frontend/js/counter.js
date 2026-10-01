/**
 * CampusBite - Kitchen Display System (KDS) & Counter 2 TV Controller
 * Real-time order synchronization, bump bar, and audible bell alerts
 */

const KdsApp = {
  orders: [],
  audioEnabled: true,
  audioCtx: null,
  eventSource: null,
  pollTimer: null,

  init() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.initAudioContext();
    this.loadOrders();
    this.connectSSE();
    this.startPolling();
  },

  updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('kds-live-clock');
    if (clockEl) {
      clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    // Class Break Countdown Simulation
    const breakEl = document.getElementById('kds-break-countdown');
    if (breakEl) {
      const minutes = 10 - (now.getMinutes() % 10);
      const seconds = 60 - now.getSeconds();
      breakEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} to Next Break Bell`;
    }
  },

  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn("AudioContext not supported", e);
    }
  },

  playBellChime() {
    if (!this.audioEnabled || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // Note 1 (E5 - 659.25Hz)
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 1.2);

      // Note 2 (G#5 - 830.61Hz)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(830.61, now + 0.25);
      gain2.gain.setValueAtTime(0.45, now + 0.25);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.25);
      osc2.stop(now + 1.6);
    } catch (e) {
      console.warn("Error playing bell chime", e);
    }
  },

  toggleAudio() {
    this.audioEnabled = !this.audioEnabled;
    const btn = document.getElementById('kds-audio-btn');
    if (btn) {
      btn.innerHTML = this.audioEnabled ? 'Audio: ON' : 'Audio: OFF';
      btn.classList.toggle('active', this.audioEnabled);
    }
    if (this.audioEnabled) {
      this.playBellChime();
    }
  },

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  },

  async loadOrders() {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data && data.orders) {
        this.orders = data.orders;
        this.renderBoard();
        this.updateStats();
      }
    } catch (e) {
      console.warn("KDS order fetch error", e);
    }
  },

  updateStats() {
    const preparingCount = this.orders.filter(o => ['Placed', 'Confirmed', 'Preparing'].includes(o.order_status)).length;
    const readyCount = this.orders.filter(o => o.order_status === 'Ready').length;
    const completedToday = this.orders.filter(o => o.order_status === 'Completed').length;

    const prepStatEl = document.getElementById('kds-stat-preparing');
    if (prepStatEl) prepStatEl.textContent = preparingCount;

    const readyStatEl = document.getElementById('kds-stat-ready');
    if (readyStatEl) readyStatEl.textContent = readyCount;

    const doneStatEl = document.getElementById('kds-stat-completed');
    if (doneStatEl) doneStatEl.textContent = completedToday;

    const prepHeaderCount = document.getElementById('kds-prep-col-count');
    if (prepHeaderCount) prepHeaderCount.textContent = `${preparingCount} Orders`;

    const readyHeaderCount = document.getElementById('kds-ready-col-count');
    if (readyHeaderCount) readyHeaderCount.textContent = `${readyCount} Ready`;
  },

  renderBoard() {
    const prepContainer = document.getElementById('kds-prep-cards');
    const readyContainer = document.getElementById('kds-ready-cards');
    if (!prepContainer || !readyContainer) return;

    const preparingOrders = this.orders.filter(o => ['Placed', 'Confirmed', 'Preparing'].includes(o.order_status));
    const readyOrders = this.orders.filter(o => o.order_status === 'Ready');

    // Render Preparing Column
    if (preparingOrders.length === 0) {
      prepContainer.innerHTML = `
        <div class="kds-empty-box">
          <div class="kds-empty-icon" style="font-size:12px;font-weight:700;color:#94A3B8;">NO ACTIVE COOKING</div>
          <h3>Kitchen Queue All Clear</h3>
          <p style="font-size:13px;margin-top:4px;">No pending orders to cook. Ready for next break rush!</p>
        </div>
      `;
    } else {
      prepContainer.innerHTML = preparingOrders.map(order => this.createTicketHtml(order, 'preparing')).join('');
    }

    // Render Ready Column
    if (readyOrders.length === 0) {
      readyContainer.innerHTML = `
        <div class="kds-empty-box">
          <div class="kds-empty-icon" style="font-size:12px;font-weight:700;color:#94A3B8;">NO PENDING PICKUPS</div>
          <h3>Counter 2 Clear</h3>
          <p style="font-size:13px;margin-top:4px;">Ready meals appear here for student collection.</p>
        </div>
      `;
    } else {
      readyContainer.innerHTML = readyOrders.map(order => this.createTicketHtml(order, 'ready')).join('');
    }
  },

  createTicketHtml(order, type) {
    const isReady = type === 'ready';
    const tokenDisplay = `#${order.id}`;
    const itemsListHtml = (order.items || []).map(item => `
      <div class="kds-item-row">
        <span><span class="kds-item-qty">${item.quantity}x</span> ${item.name}</span>
        <span class="avatar-monogram sm" style="width:20px;height:20px;font-size:9px;">${(item.name || 'CB').substring(0, 2).toUpperCase()}</span>
      </div>
    `).join('');

    const actionButton = isReady 
      ? `<button class="kds-bump-btn btn-complete" onclick="KdsApp.markComplete('${order.id}')">
           Hand Over Tray (Complete)
         </button>`
      : `<button class="kds-bump-btn btn-ready" onclick="KdsApp.markReady('${order.id}')">
           Mark Ready for Pickup
         </button>`;

    return `
      <div class="kds-ticket-card ${type}" id="ticket-${order.id}">
        <div class="kds-ticket-top">
          <div>
            <div class="kds-token-num">${tokenDisplay}</div>
            <div style="font-size:13px;font-weight:700;color:#CBD5E1;margin-top:2px;">
              ${order.customer_name || 'Student'} • Counter ${order.pickup_counter || 2}
            </div>
          </div>
          <span class="kds-ticket-timer">⏱️ ${order.pickup_slot || 'ASAP'}</span>
        </div>

        <div class="kds-ticket-items">
          ${itemsListHtml}
        </div>

        ${actionButton}
      </div>
    `;
  },

  async markReady(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Ready' })
      });
      const data = await res.json();
      if (data.success) {
        this.playBellChime();
        await this.loadOrders();
      }
    } catch (e) {
      console.warn("Failed to mark order ready", e);
    }
  },

  async markComplete(orderId) {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Completed' })
      });
      const data = await res.json();
      if (data.success) {
        await this.loadOrders();
      }
    } catch (e) {
      console.warn("Failed to complete order", e);
    }
  },

  connectSSE() {
    try {
      this.eventSource = new EventSource('/api/notifications/stream?role=staff&userId=kitchen-kds');
      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'NOTIFICATION') {
            this.loadOrders();
          }
        } catch (e) {}
      };
      this.eventSource.onerror = () => {
        if (this.eventSource) this.eventSource.close();
      };
    } catch (e) {}
  },

  startPolling() {
    this.pollTimer = setInterval(() => {
      this.loadOrders();
    }, 4000);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  KdsApp.init();
});
