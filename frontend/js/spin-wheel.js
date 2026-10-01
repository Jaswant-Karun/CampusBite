/**
 * CampusBite - Gamified Spin the Campus Wheel & Mystery Bento
 * Interactive Canvas Wheel with realistic deceleration physics & rewards
 */

const CampusWheel = {
  prizes: [
    { label: "₹20 OFF", color: "#4F46E5", coupon: "SPIN20", desc: "₹20 Flat Voucher applied to your cart." },
    { label: "Free Cheese", color: "#D97706", coupon: "CHEESE", desc: "Free Extra Cheese Upgrade applied." },
    { label: "+100 Points", color: "#059669", points: 100, desc: "100 Loyalty Points credited to your account." },
    { label: "Free Chai", color: "#DB2777", coupon: "FREECHAI", desc: "Complimentary Masala Chai applied." },
    { label: "Mystery Bento", color: "#7C3AED", coupon: "BENTO30", desc: "₹30 Bento discount voucher applied." },
    { label: "2X Points", color: "#0891B2", points: 50, desc: "Double Eco Points credited." },
    { label: "15% OFF", color: "#EA580C", coupon: "SNACK15", desc: "15% discount on Sandwiches & Snacks applied." },
    { label: "Next Time", color: "#475569", empty: true, desc: "Spin again tomorrow for daily perks." }
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

    ctx.fillStyle = "#38BDF8";
    ctx.font = "bold 13px 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SPIN", width / 2, height / 2);
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
        <div style="background:linear-gradient(135deg,#0F766E,#047857);color:white;padding:12px;border-radius:12px;text-align:center;">
          <div style="font-size:16px;font-weight:800;">Winner: ${winner.label}</div>
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

    App.showToast(`Reward Unlocked: ${winner.label}`, 'success');
  },

  easeOut(t, b, c, d) {
    const ts = (t /= d) * t;
    const tc = ts * t;
    return b + c * (tc + -3 * ts + 3 * t);
  }
};

window.CampusWheel = CampusWheel;
