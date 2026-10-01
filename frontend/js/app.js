/**
 * CampusBite - Master Application Coordinator
 */

const App = {
  currentView: 'student', // 'student' | 'admin'

  init() {
    this.bindGlobalEvents();
    this.handleInitialRoute();

    // Initialize sub-controllers
    if (window.StudentApp) window.StudentApp.init();
    if (window.AdminApp) window.AdminApp.init();

    console.log("🚀 CampusBite E-Business Platform Initialized!");
  },

  bindGlobalEvents() {
    // Top bar view mode buttons
    document.querySelectorAll('.mode-switch-container .mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode) {
          this.switchViewMode(mode);
        }
      });
    });

    // Close modal on click outside or close button
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    document.querySelectorAll('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('open');
      });
    });

    // Hash change handler for direct links (#student, #admin)
    window.addEventListener('hashchange', () => {
      this.handleInitialRoute();
    });
  },

  handleInitialRoute() {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#admin') {
      window.location.href = '/admin';
      return;
    }
    if (hash === '#mobile') {
      window.location.href = '/mobile';
      return;
    }
    this.switchViewMode('student');
  },

  switchViewMode(mode) {
    if (mode === 'admin') {
      window.location.href = '/admin';
      return;
    }
    if (mode === 'mobile') {
      window.location.href = '/mobile';
      return;
    }

    this.currentView = 'student';
    const studentContainer = document.getElementById('student-viewport-section');
    if (studentContainer) {
      studentContainer.style.display = 'flex';
      studentContainer.classList.add('desktop-mode');
    }
    if (window.StudentApp) {
      window.StudentApp.syncActiveView();
    }
  },

  // Modal helpers
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('open');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('open');
  },

  // Toast Notifications
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'warning') icon = '⚠️';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  // Reset Demo to initial pristine state
  async resetDemoScenario() {
    if (confirm("Reset demo scenario data back to initial showcase values?")) {
      try {
        await window.api.resetDemo();
        this.showToast("Demo scenario successfully reset to pristine baseline!", "success");
        setTimeout(() => window.location.reload(), 800);
      } catch (e) {
        this.showToast("Reset failed", "error");
      }
    }
  },

  // Automated 5-Minute Guided Demo Script Walkthrough
  async runAutomatedDemoWalkthrough() {
    this.showToast("🎬 Starting CampusBite 5-Minute Live Presentation Flow...", "info");

    // 1. Switch to Student view
    this.switchViewMode('student');
    StudentApp.navigateTo('home');

    setTimeout(() => {
      // 2. Add Classic Burger & Lemon Juice
      this.showToast("🍔 Step 1: Student adds Classic Burger + Lemon Juice to cart", "info");
      StudentApp.cart = [];
      StudentApp.addToCart('p-1'); // Classic Burger
      StudentApp.addToCart('p-5'); // Lemon Juice

      setTimeout(() => {
        // 3. Open Cart & Apply CAMPUS20
        this.showToast("🏷️ Step 2: Applying promo coupon CAMPUS20 for 20% discount", "info");
        StudentApp.navigateTo('cart');
        StudentApp.applyCouponCode('CAMPUS20');

        setTimeout(() => {
          // 4. Open Checkout
          this.showToast("💳 Step 3: Proceeding to Checkout with Simulated UPI payment", "info");
          StudentApp.navigateTo('checkout');

          setTimeout(() => {
            // 5. Open UPI modal and confirm
            StudentApp.executePaymentAndPlaceOrder();

            setTimeout(() => {
              StudentApp.confirmUpiSuccess();

              setTimeout(() => {
                // 6. Switch to Live Order Tracking
                this.showToast("📍 Step 4: Order Placed! Live pickup token generated.", "success");
                StudentApp.navigateTo('tracking');

                setTimeout(() => {
                  // 7. Transition to Admin Dashboard
                  this.showToast("👨💼 Step 5: Transitioning to Canteen Executive Admin...", "info");
                  this.switchViewMode('admin');
                  AdminApp.switchTab('orders');

                  setTimeout(() => {
                    // 8. Show Analytics
                    this.showToast("📊 Step 6: Viewing Sales Analytics & Rush-Hour Surge...", "info");
                    AdminApp.switchTab('analytics');

                    setTimeout(() => {
                      // 9. Show Core Innovation: AI Demand Prediction
                      this.showToast("🤖 Step 7: Core Innovation — AI Demand Prediction & Kitchen Prep Sheet", "success");
                      AdminApp.switchTab('demand');
                    }, 4000);
                  }, 4000);
                }, 4000);
              }, 2500);
            }, 2500);
          }, 2500);
        }, 2500);
      }, 2500);
    }, 1500);
  }
};

window.App = App;

// Bootstrap on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
