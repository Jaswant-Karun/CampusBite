/**
 * CampusBite - BiteBot AI Assistant Controller
 * Smart Conversational Campus Dining Intelligence for Laptop Website & Mobile App
 */

const BiteBot = {
  isOpen: false,
  soundEnabled: true,
  isListening: false,
  recognition: null,
  messages: [],

  init() {
    this.injectElements();
    this.bindEvents();
    this.initSpeechRecognition();

    // Auto-welcome message if no conversation exists
    if (this.messages.length === 0) {
      const userName = (typeof StudentApp !== 'undefined' && StudentApp.currentUser) 
        ? StudentApp.currentUser.name.split(' ')[0] 
        : 'there';
      
      this.addBotMessage(
        `👋 Hi **${userName}**! I'm **BiteBot**, your Campus Dining Assistant.\n\nI can help you:\n- 🍔 Recommend hot meals & snacks\n- 🟢 Filter pure veg & express items\n- 📦 Track live order prep & counter pickup\n- ⭐ Check & redeem your loyalty points\n- 🎟️ Reveal active canteen discount coupons\n\nWhat are you craving today?`,
        [],
        ["🍔 Popular Today", "🟢 Pure Veg Under ₹80", "⚡ Quick Bites (<10m)", "📍 Track My Order", "⭐ My Loyalty Points"]
      );
    }
  },

  injectElements() {
    if (document.getElementById('bitebot-container')) return;

    const container = document.createElement('div');
    container.id = 'bitebot-container';
    container.innerHTML = `
      <!-- Launcher FAB -->
      <div class="bitebot-launcher" id="bitebot-launcher" onclick="BiteBot.toggle()" title="Chat with BiteBot AI Assistant">
        <div class="bitebot-launcher-avatar">
          🤖
          <span class="bitebot-online-badge"></span>
        </div>
        <div class="bitebot-launcher-text">
          <span class="bitebot-launcher-title">BiteBot AI</span>
          <span class="bitebot-launcher-sub">Campus Assistant</span>
        </div>
      </div>

      <!-- Chatbot Window -->
      <div class="bitebot-window" id="bitebot-window">
        <!-- Header -->
        <div class="bitebot-header">
          <div class="bitebot-header-left">
            <div class="bitebot-header-avatar">🤖</div>
            <div class="bitebot-header-info">
              <div class="bitebot-header-name">
                BiteBot <span class="bitebot-ai-pill">AI Assistant</span>
              </div>
              <div class="bitebot-header-status">
                <span style="font-size:8px;">●</span> Online • Campus Kitchen Live
              </div>
            </div>
          </div>
          <div class="bitebot-header-actions">
            <button class="bitebot-icon-btn" id="bitebot-sound-btn" onclick="BiteBot.toggleSound()" title="Toggle Sound Feedback">
              🔊
            </button>
            <button class="bitebot-icon-btn" onclick="BiteBot.clearChat()" title="Clear Conversation">
              🔄
            </button>
            <button class="bitebot-icon-btn" onclick="BiteBot.close()" title="Minimize Chat">
              ✕
            </button>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="bitebot-messages" id="bitebot-messages"></div>

        <!-- Quick Reply Chips -->
        <div class="bitebot-quick-chips" id="bitebot-quick-chips"></div>

        <!-- Input Bar -->
        <div class="bitebot-input-area">
          <div class="bitebot-input-box">
            <input type="text" id="bitebot-input" placeholder="Ask: 'Recommend lunch under ₹100'..." autocomplete="off">
            <button class="bitebot-mic-btn" id="bitebot-mic-btn" onclick="BiteBot.toggleSpeech()" title="Speak with Voice">
              🎤
            </button>
          </div>
          <button class="bitebot-send-btn" id="bitebot-send-btn" onclick="BiteBot.handleSend()" title="Send Message">
            ➤
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  },

  bindEvents() {
    const input = document.getElementById('bitebot-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleSend();
        }
      });
    }
  },

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  },

  open() {
    const win = document.getElementById('bitebot-window');
    if (!win) return;
    win.classList.add('open');
    this.isOpen = true;
    this.scrollToBottom();

    // Auto-focus input on desktop
    if (window.innerWidth > 768) {
      setTimeout(() => {
        const input = document.getElementById('bitebot-input');
        if (input) input.focus();
      }, 300);
    }
  },

  close() {
    const win = document.getElementById('bitebot-window');
    if (!win) return;
    win.classList.remove('open');
    this.isOpen = false;
  },

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('bitebot-sound-btn');
    if (btn) {
      btn.innerText = this.soundEnabled ? '🔊' : '🔇';
      btn.title = this.soundEnabled ? 'Sound On' : 'Sound Off';
    }
    if (this.soundEnabled) {
      this.playChime(660, 0.1);
    }
  },

  playChime(freq = 520, duration = 0.12) {
    if (!this.soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + duration);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  },

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.lang = 'en-IN';
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        const mic = document.getElementById('bitebot-mic-btn');
        if (mic) mic.classList.add('listening');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('bitebot-input');
        if (input) {
          input.value = transcript;
          this.handleSend();
        }
      };

      this.recognition.onerror = () => {
        this.isListening = false;
        const mic = document.getElementById('bitebot-mic-btn');
        if (mic) mic.classList.remove('listening');
      };

      this.recognition.onend = () => {
        this.isListening = false;
        const mic = document.getElementById('bitebot-mic-btn');
        if (mic) mic.classList.remove('listening');
      };
    } catch (e) {
      console.warn("Speech recognition initialization error", e);
    }
  },

  toggleSpeech() {
    if (!this.recognition) {
      if (typeof StudentApp !== 'undefined' && StudentApp.showToast) {
        StudentApp.showToast('Voice input is not supported in this browser version. Type below!');
      } else {
        alert('Voice input is not supported in this browser version. Type below!');
      }
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch (err) {
        console.warn("Speech start error:", err);
      }
    }
  },

  async handleSend() {
    const input = document.getElementById('bitebot-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.addUserMessage(text);
    this.playChime(440, 0.08);

    // Show typing indicator
    this.showTyping();

    // Prepare user context from StudentApp
    const userContext = (typeof StudentApp !== 'undefined' && StudentApp.currentUser) 
      ? StudentApp.currentUser 
      : { name: 'Jaswant Karun', loyalty_points: 420, wallet_balance: 850 };

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userContext })
      });

      const data = await response.json();
      this.hideTyping();

      if (data && data.success) {
        this.addBotMessage(data.reply, data.items || [], data.quickReplies || [], data.action);
        this.playChime(680, 0.12);

        // Execute action triggers if requested
        if (data.action) {
          this.executeAction(data.action);
        }
      } else {
        this.fallbackLocalResponse(text);
      }
    } catch (err) {
      console.warn("Chatbot API unreachable, using intelligent local engine:", err);
      this.hideTyping();
      this.fallbackLocalResponse(text);
    }
  },

  fallbackLocalResponse(text) {
    const q = text.toLowerCase();
    const products = (typeof StudentApp !== 'undefined' && StudentApp.products && StudentApp.products.length)
      ? StudentApp.products
      : [
          { id: 'p-1', name: 'Classic Burger', price: 80, rating: 4.8, is_veg: false, image_emoji: '🍔', prep_time: '8 mins' },
          { id: 'p-3', name: 'Veg Grilled Sandwich', price: 60, rating: 4.6, is_veg: true, image_emoji: '🥪', prep_time: '6 mins' },
          { id: 'p-4', name: 'Cold Brew Coffee', price: 70, rating: 4.7, is_veg: true, image_emoji: '🥤', prep_time: '3 mins' }
        ];

    let reply = "";
    let items = [];
    let quickReplies = ["🍔 Popular Today", "🟢 Pure Veg", "⚡ Quick Bites", "📍 Track Order"];

    if (q.includes('veg')) {
      items = products.filter(p => p.is_veg).slice(0, 3);
      reply = "🌱 Here are our most ordered **100% Pure Veg** items from the campus kitchen:";
    } else if (q.includes('fast') || q.includes('quick')) {
      items = products.filter(p => (parseInt(p.prep_time) || 8) <= 8).slice(0, 3);
      reply = "⚡ Here are rapid prep meals ready in **under 8 minutes**:";
    } else if (q.includes('track') || q.includes('order')) {
      reply = "📦 **Order Tracking (#CB1024)** is currently **Ready for Pickup** at Counter 2!";
      quickReplies = ["View Live Radar", "Order More"];
    } else {
      items = products.slice(0, 3);
      reply = "Here are our top campus favorites freshly prepped today:";
    }

    this.addBotMessage(reply, items, quickReplies);
    this.playChime(680, 0.12);
  },

  addUserMessage(text) {
    const messagesEl = document.getElementById('bitebot-messages');
    if (!messagesEl) return;

    const timeStr = this.getFormattedTime();
    const div = document.createElement('div');
    div.className = 'bitebot-msg user';
    div.innerHTML = `
      <div class="bitebot-msg-content">
        <p>${this.escapeHtml(text)}</p>
        <span class="bitebot-msg-time">${timeStr}</span>
      </div>
    `;

    messagesEl.appendChild(div);
    this.messages.push({ role: 'user', text, time: timeStr });
    this.scrollToBottom();
  },

  addBotMessage(markdownText, items = [], quickReplies = [], action = null) {
    const messagesEl = document.getElementById('bitebot-messages');
    if (!messagesEl) return;

    const timeStr = this.getFormattedTime();
    const formattedHtml = this.formatMarkdown(markdownText);

    let itemsHtml = '';
    if (items && items.length > 0) {
      itemsHtml = `
        <div class="bitebot-card-list">
          ${items.map(item => `
            <div class="bitebot-food-card">
              <div class="bitebot-food-left">
                <div class="bitebot-food-emoji">${item.image_emoji || '🍽️'}</div>
                <div>
                  <span class="bitebot-food-title">${item.name}</span>
                  <div class="bitebot-food-meta">
                    <span class="bitebot-food-price">₹${item.price}</span> • 
                    <span>${item.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span> • 
                    <span>★ ${item.rating || 4.7}</span>
                  </div>
                </div>
              </div>
              <button class="bitebot-add-cart-btn" onclick="BiteBot.addToCart('${item.id}')">
                + Add
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Action button if applicable
    let actionBtnHtml = '';
    if (action) {
      if (action.type === 'navigate' && action.target === 'tracking') {
        actionBtnHtml = `<button class="bitebot-action-trigger" onclick="BiteBot.openTracking()">📍 View Live Order Tracking →</button>`;
      } else if (action.type === 'openModal' && action.modal === 'rewardsStore') {
        actionBtnHtml = `<button class="bitebot-action-trigger" onclick="BiteBot.openRewardsStore()">🏆 Open Loyalty Voucher Store →</button>`;
      } else if (action.type === 'applyCoupon') {
        actionBtnHtml = `<button class="bitebot-action-trigger" onclick="BiteBot.applyCoupon('${action.code}')">🎟️ Apply Coupon ${action.code} →</button>`;
      } else if (action.type === 'openModal' && action.modal === 'feedback') {
        actionBtnHtml = `<button class="bitebot-action-trigger" onclick="BiteBot.openFeedback()">⭐ Open Feedback Portal →</button>`;
      }
    }

    const div = document.createElement('div');
    div.className = 'bitebot-msg bot';
    div.innerHTML = `
      <div class="bitebot-msg-avatar">🤖</div>
      <div class="bitebot-msg-content">
        ${formattedHtml}
        ${itemsHtml}
        ${actionBtnHtml}
        <span class="bitebot-msg-time">${timeStr}</span>
      </div>
    `;

    messagesEl.appendChild(div);
    this.messages.push({ role: 'bot', text: markdownText, items, time: timeStr });
    this.renderQuickReplies(quickReplies);
    this.scrollToBottom();
  },

  renderQuickReplies(quickReplies) {
    const chipsContainer = document.getElementById('bitebot-quick-chips');
    if (!chipsContainer) return;

    if (!quickReplies || quickReplies.length === 0) {
      chipsContainer.innerHTML = '';
      chipsContainer.style.display = 'none';
      return;
    }

    chipsContainer.style.display = 'flex';
    chipsContainer.innerHTML = quickReplies.map(reply => `
      <button class="bitebot-chip" onclick="BiteBot.sendQuickReply('${this.escapeHtml(reply)}')">
        ${reply}
      </button>
    `).join('');
  },

  sendQuickReply(replyText) {
    const input = document.getElementById('bitebot-input');
    if (input) {
      input.value = replyText;
      this.handleSend();
    }
  },

  showTyping() {
    this.hideTyping();
    const messagesEl = document.getElementById('bitebot-messages');
    if (!messagesEl) return;

    const typingDiv = document.createElement('div');
    typingDiv.id = 'bitebot-typing-indicator';
    typingDiv.className = 'bitebot-msg bot';
    typingDiv.innerHTML = `
      <div class="bitebot-msg-avatar">🤖</div>
      <div class="bitebot-typing">
        <span class="bitebot-typing-dot"></span>
        <span class="bitebot-typing-dot"></span>
        <span class="bitebot-typing-dot"></span>
      </div>
    `;
    messagesEl.appendChild(typingDiv);
    this.scrollToBottom();
  },

  hideTyping() {
    const typing = document.getElementById('bitebot-typing-indicator');
    if (typing) typing.remove();
  },

  clearChat() {
    this.messages = [];
    const messagesEl = document.getElementById('bitebot-messages');
    if (messagesEl) messagesEl.innerHTML = '';
    
    const userName = (typeof StudentApp !== 'undefined' && StudentApp.currentUser) 
      ? StudentApp.currentUser.name.split(' ')[0] 
      : 'there';

    this.addBotMessage(
      `Conversation cleared! How can I assist your campus dining experience now, **${userName}**?`,
      [],
      ["🍔 Today's Bestsellers", "⚡ Quick Bites (<10m)", "📍 Track My Order", "⭐ My Loyalty Points"]
    );
  },

  addToCart(productId) {
    if (typeof StudentApp !== 'undefined' && StudentApp.addToCart) {
      StudentApp.addToCart(productId);
      this.playChime(800, 0.1);
      
      const product = (StudentApp.products || []).find(p => p.id === productId);
      const name = product ? product.name : 'Item';
      
      if (StudentApp.showToast) {
        StudentApp.showToast(`🛒 ${name} added to your tray!`);
      }
    } else {
      alert(`Item added to cart!`);
    }
  },

  openTracking() {
    if (typeof StudentApp !== 'undefined' && StudentApp.navigateTo) {
      StudentApp.navigateTo('tracking');
      if (window.innerWidth <= 768) {
        this.close();
      }
    }
  },

  openRewardsStore() {
    if (typeof StudentApp !== 'undefined' && StudentApp.openRewardsStoreModal) {
      StudentApp.openRewardsStoreModal();
    }
  },

  openFeedback() {
    if (typeof StudentApp !== 'undefined' && StudentApp.openFeedbackModal) {
      StudentApp.openFeedbackModal();
    }
  },

  applyCoupon(code) {
    if (typeof StudentApp !== 'undefined' && StudentApp.applyCoupon) {
      StudentApp.applyCoupon(code);
      if (StudentApp.showToast) {
        StudentApp.showToast(`🎉 Coupon ${code} applied successfully!`);
      }
    }
  },

  executeAction(action) {
    if (!action) return;
    if (action.type === 'filter' && typeof StudentApp !== 'undefined' && StudentApp.filterDiet) {
      StudentApp.filterDiet(action.filter);
    }
  },

  scrollToBottom() {
    const messagesEl = document.getElementById('bitebot-messages');
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  },

  getFormattedTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = this.escapeHtml(text);
    // Bold **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Bullet points
    html = html.split('\n').map(line => {
      if (line.trim().startsWith('- ')) {
        return `<div style="padding-left:10px;margin-bottom:3px;">• ${line.trim().substring(2)}</div>`;
      }
      return `<p>${line}</p>`;
    }).join('');
    return html;
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => BiteBot.init());
} else {
  BiteBot.init();
}
