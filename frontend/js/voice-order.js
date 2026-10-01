/**
 * CampusBite - Multilingual AI Voice Ordering Assistant
 * Supports English, Tamil (தமிழ்), and Hindi (हिंदी)
 */

const CampusVoice = {
  recognition: null,
  isListening: false,
  currentLang: 'en-IN', // 'en-IN', 'ta-IN', 'hi-IN'

  init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.updateModalUI(true, 'Listening... Speak your order naturally.');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.handleTranscript(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        console.warn('Speech recognition error:', event.error);
        this.updateModalUI(false, `Could not catch audio (${event.error}). Try again or use demo phrases.`);
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  },

  openVoiceModal() {
    this.init();
    App.openModal('voice-order-modal');
    this.updateModalUI(false, 'Select a language and tap Start Speaking');
  },

  setLanguage(langCode) {
    this.currentLang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
    document.querySelectorAll('.voice-lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === langCode);
    });

    const langNames = {
      'en-IN': 'English',
      'ta-IN': 'Tamil (தமிழ்)',
      'hi-IN': 'Hindi (हिंदी)'
    };
    App.showToast(`Switched voice engine to ${langNames[langCode]}`, 'info');
  },

  startListening() {
    if (this.recognition) {
      try {
        this.recognition.lang = this.currentLang;
        this.recognition.start();
      } catch (e) {
        console.warn('Recognition already active', e);
      }
    } else {
      this.updateModalUI(false, 'Speech recognition not supported in this browser. Try our 1-click sample phrases below!');
    }
  },

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    this.isListening = false;
    this.updateModalUI(false, 'Mic paused');
  },

  handleTranscript(transcript) {
    const textEl = document.getElementById('voice-recognized-text');
    if (textEl) {
      textEl.textContent = `"${transcript}"`;
    }

    const parsedResults = this.parseSpeech(transcript, this.currentLang);
    this.processParsedOrder(parsedResults, transcript);
  },

  parseSpeech(rawText, lang) {
    const text = rawText.toLowerCase();
    const itemsFound = [];

    // Keywords mapping
    const catalogKeywords = [
      { id: 'p-1', keywords: ['classic burger', 'veg burger', 'burger', 'bar-gar'], name: 'Classic Burger' },
      { id: 'p-2', keywords: ['cheese burger', 'double cheese', 'deluxe burger'], name: 'Cheese Burger Deluxe' },
      { id: 'p-3', keywords: ['sandwich', 'grilled sandwich', 'veg sandwich', 'bread'], name: 'Veg Grilled Sandwich' },
      { id: 'p-4', keywords: ['paneer roll', 'tikka roll', 'paneer tikka', 'roll'], name: 'Paneer Tikka Roll' },
      { id: 'p-5', keywords: ['lemon juice', 'lemonade', 'elumichai', 'nimbu pani', 'nimbu juice', 'nimbu'], name: 'Fresh Lemon Juice' },
      { id: 'p-6', keywords: ['cold coffee', 'ice coffee', 'cold kaapi', 'koffee', 'coffee'], name: 'Cold Coffee' },
      { id: 'p-7', keywords: ['chai', 'masala chai', 'tea', 'kadak chai', 'thea'], name: 'Special Masala Chai' },
      { id: 'p-8', keywords: ['thali', 'meals', 'saapaadu', 'rice meals', 'south indian thali', 'lunch thali'], name: 'South Indian Thali' },
      { id: 'p-9', keywords: ['biryani', 'chicken biryani', 'dum biryani', 'briyani'], name: 'Chicken Biryani' },
      { id: 'p-10', keywords: ['noodles', 'manchurian', 'hakka noodles', 'chinese'], name: 'Veg Hakka Noodles' },
      { id: 'p-11', keywords: ['lava cake', 'choco lava', 'chocolate cake', 'cake'], name: 'Warm Choco Lava Cake' },
      { id: 'p-12', keywords: ['gulab jamun', 'jamun', 'sweet'], name: 'Hot Gulab Jamun' },
      { id: 'p-13', keywords: ['protein shake', 'whey protein', 'gym shake', 'peanut shake'], name: 'Whey Protein Shake' },
      { id: 'p-14', keywords: ['green juice', 'detox juice', 'vitality juice', 'detox'], name: 'Detox Green Vitality Juice' },
      { id: 'p-15', keywords: ['cappuccino', 'croissant', 'caramel coffee'], name: 'Caramel Cappuccino' },
      { id: 'p-16', keywords: ['maggi', 'cheese maggi', 'noodles maggi'], name: 'Midnight Cheese Maggi' }
    ];

    // Numbers & Quantities dictionary
    let detectedQty = 1;
    if (text.includes('two') || text.includes('rendu') || text.includes('do') || text.includes('2') || text.includes('pair')) {
      detectedQty = 2;
    } else if (text.includes('three') || text.includes('moonu') || text.includes('teen') || text.includes('3')) {
      detectedQty = 3;
    } else if (text.includes('four') || text.includes('naalu') || text.includes('chaar') || text.includes('4')) {
      detectedQty = 4;
    }

    catalogKeywords.forEach(item => {
      for (const kw of item.keywords) {
        if (text.includes(kw)) {
          itemsFound.push({
            id: item.id,
            name: item.name,
            qty: detectedQty
          });
          break;
        }
      }
    });

    return itemsFound;
  },

  processParsedOrder(items, originalTranscript) {
    const feedbackBox = document.getElementById('voice-feedback-box');
    if (!feedbackBox) return;

    if (items.length === 0) {
      feedbackBox.innerHTML = `
        <div style="color:#EF4444;font-weight:700;font-size:13px;">
          ❌ Could not match any menu dish in "${originalTranscript}".
        </div>
        <p style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">
          Try saying: "Oru classic burger and cold coffee" or "2 samosa/sandwich".
        </p>
      `;
      this.speakBack("Sorry, could not find that dish on today's canteen menu. Please try again.");
      return;
    }

    // Add items to student cart
    items.forEach(item => {
      for (let i = 0; i < item.qty; i++) {
        if (window.StudentApp) {
          window.StudentApp.addToCart(item.id);
        }
      }
    });

    const itemsSummary = items.map(i => `${i.qty}x ${i.name}`).join(', ');
    feedbackBox.innerHTML = `
      <div style="color:#10B981;font-weight:800;font-size:14px;margin-bottom:6px;">
        🎉 Successfully Added to Your Tray!
      </div>
      <div style="font-size:13px;color:var(--text-primary);background:var(--bg-card);padding:8px 12px;border-radius:10px;border:1px solid var(--border-subtle);">
        🍽️ <strong>${itemsSummary}</strong>
      </div>
      <div style="margin-top:10px;">
        <button class="btn-primary" onclick="App.closeModal('voice-order-modal'); StudentApp.navigateTo('cart');" style="padding:8px 18px;font-size:12px;">
          View Tray & Checkout →
        </button>
      </div>
    `;

    // Multilingual Voice Response
    let replySpeech = `Added ${itemsSummary} to your canteen tray.`;
    if (this.currentLang === 'ta-IN') {
      replySpeech = `${itemsSummary} ungal trayil serkkappattadhu!`;
    } else if (this.currentLang === 'hi-IN') {
      replySpeech = `${itemsSummary} aapki tray mein add ho gaya hai!`;
    }

    this.speakBack(replySpeech);
    App.showToast(`🎙️ Voice Order Added: ${itemsSummary}`, 'success');
  },

  speakBack(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.currentLang;
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  },

  simulateSample(phrase, lang) {
    this.setLanguage(lang);
    const textEl = document.getElementById('voice-recognized-text');
    if (textEl) textEl.textContent = `"${phrase}"`;
    const parsed = this.parseSpeech(phrase, lang);
    this.processParsedOrder(parsed, phrase);
  },

  updateModalUI(isListening, statusText) {
    const pulseEl = document.getElementById('voice-pulse-ring');
    const statusEl = document.getElementById('voice-status-text');
    const startBtn = document.getElementById('voice-start-btn');

    if (pulseEl) pulseEl.classList.toggle('active', isListening);
    if (statusEl) statusEl.textContent = statusText;
    if (startBtn) {
      startBtn.innerHTML = isListening ? '⏹️ Stop Listening' : '🎙️ Start Speaking';
      startBtn.onclick = () => isListening ? this.stopListening() : this.startListening();
    }
  }
};

window.CampusVoice = CampusVoice;
