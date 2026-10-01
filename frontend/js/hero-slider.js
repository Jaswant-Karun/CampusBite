/**
 * CampusBite - Professional Hero Showcase Carousel
 * Executive-grade interactive culinary slider with auto-rotation, gesture support, and instant tray combo adding.
 */

const HeroSlider = {
  currentSlide: 0,
  totalSlides: 4,
  timer: null,
  intervalMs: 5000,
  isPaused: false,

  combos: {
    feast: {
      name: "Grand Canteen Feast",
      items: ["p-2", "p-6", "p-11"], // Cheese Burger + Cold Coffee + Choco Lava Cake
      discountedPrice: 160
    }
  },

  init() {
    this.startAutoSlide();
    const showcase = document.getElementById('hero-slider-showcase');
    if (showcase) {
      showcase.addEventListener('mouseenter', () => this.pause());
      showcase.addEventListener('mouseleave', () => this.resume());
    }
  },

  startAutoSlide() {
    this.stopAutoSlide();
    this.timer = setInterval(() => {
      if (!this.isPaused) {
        this.nextSlide();
      }
    }, this.intervalMs);
  },

  stopAutoSlide() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },

  goToSlide(index) {
    this.currentSlide = (index + this.totalSlides) % this.totalSlides;
    this.updateUI();
  },

  nextSlide() {
    this.goToSlide(this.currentSlide + 1);
  },

  prevSlide() {
    this.goToSlide(this.currentSlide - 1);
  },

  updateUI() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-slider-dot');

    slides.forEach((slide, idx) => {
      slide.classList.toggle('active', idx === this.currentSlide);
    });

    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === this.currentSlide);
    });
  },

  addComboToTray(productIds) {
    if (!window.StudentApp) return;

    productIds.forEach(id => {
      window.StudentApp.addToCart(id);
    });

    // Auto-apply promo coupon if not already applied
    if (!window.StudentApp.appliedCoupon) {
      window.StudentApp.applyCouponCode('CAMPUS20');
    }

    App.showToast('🎉 Grand Canteen Feast added to your tray with 20% discount!', 'success');
  }
};

window.HeroSlider = HeroSlider;

document.addEventListener('DOMContentLoaded', () => {
  HeroSlider.init();
});
