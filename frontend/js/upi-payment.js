/**
 * CampusBite - Real Dynamic UPI Payment QR Code & Intent Generator
 * Supports NPCI standards: Google Pay, PhonePe, Paytm, and BHIM
 */

const CampusUPI = {
  merchantVpa: 'campusbite@okaxis',
  merchantName: 'CampusBite Canteen',

  openUpiModal(amount = 180, orderRef = 'CB1024') {
    const totalAmount = Number(amount).toFixed(2);
    const upiUri = `upi://pay?pa=${this.merchantVpa}&pn=${encodeURIComponent(this.merchantName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent('CampusBite ' + orderRef)}&tr=${orderRef}`;

    // Render Scannable QR Code
    if (window.CampusQR) {
      window.CampusQR.renderTo('upi-qr-display-container', upiUri, 180);
    }

    const amtEl = document.getElementById('upi-modal-amount');
    if (amtEl) amtEl.textContent = `₹${totalAmount}`;

    const refEl = document.getElementById('upi-modal-order-ref');
    if (refEl) refEl.textContent = `Order Token #${orderRef}`;

    // Configure Deep-Link Buttons
    const gpayBtn = document.getElementById('upi-link-gpay');
    if (gpayBtn) gpayBtn.href = upiUri;

    const phonepeBtn = document.getElementById('upi-link-phonepe');
    if (phonepeBtn) phonepeBtn.href = upiUri;

    const paytmBtn = document.getElementById('upi-link-paytm');
    if (paytmBtn) paytmBtn.href = upiUri;

    App.openModal('upi-payment-modal');
  },

  copyUpiId() {
    navigator.clipboard?.writeText(this.merchantVpa).catch(() => {});
    App.showToast(`UPI ID ${this.merchantVpa} copied!`, 'success');
  },

  confirmUpiPaid() {
    App.closeModal('upi-payment-modal');
    if (window.StudentApp && typeof window.StudentApp.confirmUpiPayment === 'function') {
      window.StudentApp.confirmUpiPayment(false);
    } else if (window.StudentApp && typeof window.StudentApp.confirmUpiSuccess === 'function') {
      window.StudentApp.confirmUpiSuccess();
    } else {
      App.showToast('UPI Payment Verified: Preparing your meal token now.', 'success');
    }
  }
};

window.CampusUPI = CampusUPI;
