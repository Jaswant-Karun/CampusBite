/**
 * CampusBite - Gamified Spin the Campus Wheel & Mystery Bento
 * Interactive Canvas Wheel with realistic deceleration physics & rewards
 */

const CampusWheel = {
  prizes: [
    { label: "₹20 OFF", color: "#4F46E5", coupon: "SPIN20", desc: "₹20 Flat Voucher applied!" },
    { label: "🧀 Free Cheese", color: "#F59E0B", coupon: "CHEESE", desc: "Free Extra Cheese Added!" },
    { label: "⭐ +100 Points", color: "#10B981", points: 100, desc: "100 Loyalty Points Credited!" },
    { label: "☕ Free Chai", color: "#EC4899", coupon: "FREECHAI", desc: "Complimentary Kadak Masala Chai!" },
    { label: "🍱 Mystery Bento", color: "#8B5CF6", coupon: "BENTO30", desc: "₹30 Mystery Bento Discount!" },
    { label: "⚡ 2X Green Pts", color: "#06B6D4", points: 50, desc: "Double Eco Points Multiplier!" },
    { label: "🥪 15% OFF", color: "#F97316", coupon: "SNACK15", desc: "15% OFF on Sandwiches & Snacks!" },
    { label: "🍀 Better Luck", color: "#64748B", empty: true, desc: "Almost! Spin again tomorrow." }
  ],

  startAngle: 0,
  arc: Math.PI / 4, // 8 sectors = PI / 4 radians
  isSpinning: false,

  openWheelModal() {
    App.openModal('spin-wheel-modal');
    setTimeout(() => this.drawWheel(), 100);
  },

  drawWheel() {
    const canvas = document.getElementById('spin-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const outsideRadius = width / 2 - 10;
    const textRadius = outsideRadius - 38;
    const insideRadius = 35;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < this.prizes.length; i++) {
      const angle = this.startAngle + i * this.arc;
      ctx.fillStyle = this.prizes[i].color;

      ctx.beginPath();
      ctx.arc(width / 2, height / 2, outsideRadius, angle, angle + this.arc, false);
      ctx.arc(width / 2, height / 2, insideRadius, angle + this.arc, angle, true);
      ctx.stroke();
      ctx.fill();

      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = "bold 13px 'Segoe UI', sans-serif";
      ctx.translate(
        width / 2 + Math.cos(angle + this.arc / 2) * textRadius,
        height / 2 + Math.sin(angle + this.arc / 2) * textRadius
      );
      ctx.rotate(angle + this.arc / 2 + Math.PI / 2);
      const text = this.prizes[i].label;
      ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
      ctx.restore();
    }

    // Draw Center Peg
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#1E293B";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();

    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("🎁", width / 2 - 9, height / 2 + 6);
  },

  spin() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    const spinTimeTotal = 4000;
    const spinAngleStart = Math.random() * 10 + 25;
    let spinTime = 0;

    const btn = document.getElementById('spin-wheel-btn');
    if (btn) btn.disabled = true;

    const rotateWheel = () => {
      spinTime += 30;
      if (spinTime >= spinTimeTotal) {
        this.stopRotateWheel();
        return;
      }
      const spinAngle = spinAngleStart - this.easeOut(spinTime, 0, spinAngleStart, spinTimeTotal);
      this.startAngle += (spinAngle * Math.PI / 180);
      this.drawWheel();
      requestAnimationFrame(rotateWheel);
    };

    rotateWheel();
  },

  stopRotateWheel() {
    this.isSpinning = false;
    const btn = document.getElementById('spin-wheel-btn');
    if (btn) btn.disabled = false;

    // Calculate winning sector at Top Pointer (270 degrees = 3*PI/2)
    const degrees = this.startAngle * 180 / Math.PI + 90;
    const arcd = this.arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) / arcd) % this.prizes.length;
    const winner = this.prizes[index];

    const resultBox = document.getElementById('wheel-result-display');
    if (resultBox) {
      resultBox.innerHTML = `
        <div style="background:linear-gradient(135deg,#10B981,#059669);color:white;padding:12px;border-radius:12px;text-align:center;">
          <div style="font-size:18px;font-weight:900;">🎉 You Won: ${winner.label}!</div>
          <div style="font-size:12px;opacity:0.9;margin-top:2px;">${winner.desc}</div>
        </div>
      `;
    }

    if (winner.coupon && window.StudentApp) {
      window.StudentApp.applyCouponCode(winner.coupon);
    } else if (winner.points && window.StudentApp) {
      window.StudentApp.currentUser.loyalty_points += winner.points;
      window.StudentApp.updateUserInterfaceDetails();
    }

    App.showToast(`🎉 Congratulations! You won ${winner.label}!`, 'success');
  },

  easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  }
};

window.CampusWheel = CampusWheel;
