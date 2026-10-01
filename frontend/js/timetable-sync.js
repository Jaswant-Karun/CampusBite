/**
 * CampusBite - University Timetable Bell Sync Engine
 * Automatically coordinates meal prep with university lecture schedules
 */

const CampusTimetable = {
  schedule: [
    { period: 1, name: "Object Oriented Programming (OOP)", time: "09:00 AM – 09:50 AM", room: "LH-204", isBreak: false },
    { period: 2, name: "Database Management Systems", time: "09:55 AM – 10:45 AM", room: "Lab 4", isBreak: false },
    { period: "Break 1", name: "Morning 10-Min Snack Break", time: "10:45 AM – 10:55 AM", room: "Food Court Counter 2", isBreak: true, slot: "10:45 AM – 10:55 AM" },
    { period: 3, name: "Design & Analysis of Algorithms", time: "10:55 AM – 11:45 AM", room: "LH-204", isBreak: false },
    { period: 4, name: "Operating Systems Concepts", time: "11:50 AM – 12:40 PM", room: "LH-206", isBreak: false },
    { period: "Lunch", name: "Grand Lunch Break", time: "12:40 PM – 01:25 PM", room: "Main Food Court", isBreak: true, slot: "12:40 PM – 01:25 PM" },
    { period: 5, name: "Full Stack Software Lab", time: "01:25 PM – 03:15 PM", room: "CSBS Lab 2", isBreak: false },
    { period: "Break 2", name: "Evening Kadak Chai Break", time: "03:15 PM – 03:30 PM", room: "Library Brews & Cafe", isBreak: true, slot: "03:15 PM – 03:30 PM" }
  ],

  openTimetableModal() {
    this.renderTimetable();
    App.openModal('timetable-sync-modal');
  },

  getCurrentPeriod() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 10 * 60 + 45) {
      return { current: "Period 2: Database Systems", nextBreak: "10:45 AM Morning Break", slot: "10:45 AM – 10:55 AM" };
    } else if (totalMinutes < 12 * 60 + 40) {
      return { current: "Period 4: Operating Systems", nextBreak: "12:40 PM Lunch Break", slot: "12:40 PM – 01:25 PM" };
    } else if (totalMinutes < 15 * 60 + 15) {
      return { current: "Period 5: Full Stack Lab", nextBreak: "03:15 PM Evening Chai", slot: "03:15 PM – 03:30 PM" };
    } else {
      return { current: "Classes Ended for Today", nextBreak: "Hostel Night Canteen", slot: "08:00 PM – 10:00 PM" };
    }
  },

  renderTimetable() {
    const container = document.getElementById('timetable-periods-list');
    if (!container) return;

    const info = this.getCurrentPeriod();
    const infoHeader = document.getElementById('timetable-current-status');
    if (infoHeader) {
      infoHeader.innerHTML = `
        <div style="font-size:12px;color:var(--text-muted);">Current University Period:</div>
        <strong style="font-size:14px;color:var(--text-primary);">${info.current}</strong>
        <div style="font-size:12px;color:#10B981;font-weight:700;margin-top:2px;">
          Next Scheduled Break: ${info.nextBreak}
        </div>
      `;
    }

    container.innerHTML = this.schedule.map(item => {
      const isBreak = item.isBreak;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;background:${isBreak ? 'linear-gradient(135deg,rgba(20,184,166,0.1),rgba(79,70,229,0.08))' : 'var(--bg-elevated)'};border:1px solid ${isBreak ? '#14B8A6' : 'var(--border-subtle)'};border-radius:12px;padding:10px 14px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <div style="width:32px;height:32px;border-radius:8px;background:${isBreak ? 'rgba(20,184,166,0.2)' : 'rgba(255,255,255,0.06)'};display:flex;align-items:center;justify-content:center;color:${isBreak ? '#14B8A6' : 'var(--text-secondary)'};font-size:11px;font-weight:800;">
              ${isBreak ? 'BREAK' : 'CLASS'}
            </div>
            <div>
              <strong style="font-size:13px;color:var(--text-primary);">${item.name}</strong>
              <div style="font-size:11px;color:var(--text-muted);">${item.time} • ${item.room}</div>
            </div>
          </div>
          ${isBreak ? `
            <button class="btn-primary" onclick="CampusTimetable.selectBreakSlot('${item.slot}')" style="padding:6px 14px;font-size:11.5px;">
              Sync Pre-Order
            </button>
          ` : `
            <span style="font-size:11px;color:var(--text-muted);font-weight:600;">In Lecture</span>
          `}
        </div>
      `;
    }).join('');
  },

  selectBreakSlot(slot) {
    if (window.StudentApp) {
      window.StudentApp.selectedPickupSlot = slot;
      const slotDisplay = document.getElementById('confirm-pickup-slot');
      if (slotDisplay) slotDisplay.textContent = slot;
    }
    App.closeModal('timetable-sync-modal');
    App.showToast(`Canteen schedule synchronized: Pickup at ${slot}`, 'success');
  }
};

window.CampusTimetable = CampusTimetable;
