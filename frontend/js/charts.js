/**
 * CampusBite Custom Lightweight SVG / Canvas Charts (Step 24)
 * Professional, zero-dependency SVG visualization engine:
 * Main Brand: #4F46E5 (Indigo)
 * Accent / Success: #10B981 / #14B8A6 (Teal / Emerald)
 * Warning / Highlights: #F59E0B (Amber)
 * Negative / Peak Rush: #EF4444 (Rose / Red)
 */

const CampusCharts = {
  // 1. Revenue & Sales Velocity Chart (Bar Chart)
  renderRevenueTrend(containerId, trendData, range = '7days') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!trendData || !trendData.length) {
      container.innerHTML = '<div style="color:#64748B;padding:40px;text-align:center;font-size:13px;">No revenue data recorded for this time range</div>';
      return;
    }

    const maxVal = Math.max(...trendData.map(d => Number(d.revenue) || 0), 100);
    const height = 220;
    const width = container.clientWidth || 500;
    const count = trendData.length;
    const barWidth = Math.min(36, Math.max(16, (width - 80) / count - 14));
    const spacing = (width - 60) / count;

    let barsSvg = '';
    trendData.forEach((item, index) => {
      const rev = Number(item.revenue) || 0;
      const barHeight = Math.max(8, (rev / maxVal) * (height - 65));
      const x = 30 + (index * spacing) + (spacing - barWidth) / 2;
      const y = height - barHeight - 26;
      const label = item.label || item.day || `P${index + 1}`;
      const revFormatted = rev >= 1000 ? `₹${(rev / 1000).toFixed(1)}k` : `₹${rev}`;

      barsSvg += `
        <g class="chart-bar-group" style="cursor:pointer;">
          <title>${label}: ₹${rev.toLocaleString()} (${item.orders || 0} orders)</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="5" fill="url(#revBarGradient)">
            <animate attributeName="height" from="0" to="${barHeight}" dur="0.4s" fill="freeze" />
            <animate attributeName="y" from="${height - 26}" to="${y}" dur="0.4s" fill="freeze" />
          </rect>
          <text x="${x + (barWidth / 2)}" y="${height - 8}" font-size="10.5" fill="#64748B" text-anchor="middle" font-weight="600">${label}</text>
          <text x="${x + (barWidth / 2)}" y="${y - 6}" font-size="10" fill="#0F172A" text-anchor="middle" font-weight="700">${revFormatted}</text>
        </g>
      `;
    });

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="revBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="100%" stop-color="#6366F1" />
          </linearGradient>
        </defs>
        <line x1="20" y1="${height - 26}" x2="${width - 15}" y2="${height - 26}" stroke="#E2E8F0" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;

    container.innerHTML = svg;
  },

  // Backward compatibility alias
  renderWeeklyRevenue(containerId, weeklyData) {
    this.renderRevenueTrend(containerId, weeklyData, '7days');
  },

  // 2. Peak Rush Hour Traffic Analysis (Line / Area Curve)
  renderHourlyDemand(containerId, hourlyData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!hourlyData || !hourlyData.length) {
      container.innerHTML = '<div style="color:#64748B;padding:40px;text-align:center;font-size:13px;">No hourly traffic recorded</div>';
      return;
    }

    const maxOrders = Math.max(...hourlyData.map(d => Number(d.orders) || 0), 10);
    const height = 220;
    const width = container.clientWidth || 500;
    const paddingLeft = 35;
    const spacing = (width - 65) / (hourlyData.length - 1 || 1);

    const points = hourlyData.map((d, i) => {
      const orders = Number(d.orders) || 0;
      const x = paddingLeft + (i * spacing);
      const y = height - 32 - ((orders / maxOrders) * (height - 68));
      return { x, y, orders, ...d };
    });

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    let dotsSvg = '';
    points.forEach(p => {
      const isPeak = p.orders >= (maxOrders * 0.75);
      dotsSvg += `
        <g style="cursor:pointer;">
          <circle cx="${p.x}" cy="${p.y}" r="${isPeak ? 5.5 : 4}" fill="${isPeak ? '#EF4444' : '#14B8A6'}" stroke="#FFFFFF" stroke-width="2">
            <title>${p.hour}: ${p.orders} orders (${p.label || 'Regular'})</title>
          </circle>
          <text x="${p.x}" y="${p.y - 8}" font-size="9.5" fill="${isPeak ? '#DC2626' : '#475569'}" text-anchor="middle" font-weight="${isPeak ? '800' : '600'}">${p.orders}</text>
          <text x="${p.x}" y="${height - 10}" font-size="10" fill="#64748B" text-anchor="middle" font-weight="600">${p.hour}</text>
        </g>
      `;
    });

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="hourlyAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#4F46E5" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="20" y1="${height - 30}" x2="${width - 15}" y2="${height - 30}" stroke="#E2E8F0" stroke-width="1" />
        <polygon points="${points[0].x},${height - 30} ${pointsStr} ${points[points.length-1].x},${height - 30}" fill="url(#hourlyAreaGradient)" />
        <polyline fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr}" />
        ${dotsSvg}
      </svg>
    `;

    container.innerHTML = svg;
  },

  // 3. Customer Growth & Acquisition Trend (Teal Area Curve)
  renderCustomerGrowth(containerId, growthData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = growthData || [
      { label: "Wk 1", customers: 14 },
      { label: "Wk 2", customers: 24 },
      { label: "Wk 3", customers: 32 },
      { label: "Now", customers: 40 }
    ];

    const maxVal = Math.max(...data.map(d => d.customers), 10);
    const height = 180;
    const width = container.clientWidth || 360;
    const paddingLeft = 30;
    const spacing = (width - 60) / (data.length - 1 || 1);

    const points = data.map((d, i) => {
      const x = paddingLeft + (i * spacing);
      const y = height - 28 - ((d.customers / maxVal) * (height - 60));
      return { x, y, ...d };
    });

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    let dotsSvg = '';
    points.forEach(p => {
      dotsSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#10B981" stroke="#FFFFFF" stroke-width="2">
          <title>${p.label}: ${p.customers} Active Customers</title>
        </circle>
        <text x="${p.x}" y="${p.y - 7}" font-size="10" fill="#065F46" text-anchor="middle" font-weight="700">${p.customers}</text>
        <text x="${p.x}" y="${height - 8}" font-size="10" fill="#64748B" text-anchor="middle" font-weight="600">${p.label}</text>
      `;
    });

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10B981" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#10B981" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="20" y1="${height - 26}" x2="${width - 15}" y2="${height - 26}" stroke="#E2E8F0" stroke-width="1" />
        <polygon points="${points[0].x},${height - 26} ${pointsStr} ${points[points.length-1].x},${height - 26}" fill="url(#growthAreaGradient)" />
        <polyline fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr}" />
        ${dotsSvg}
      </svg>
    `;

    container.innerHTML = svg;
  },

  // 4. Completed vs Cancelled Order Fulfillment Donut Chart
  renderFulfillmentDonut(containerId, fulfillment) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const completed = Number(fulfillment?.completed) || 0;
    const cancelled = Number(fulfillment?.cancelled) || 0;
    const inProgress = Number(fulfillment?.in_progress) || 0;
    const total = completed + cancelled + inProgress || 1;

    const compPct = Math.round((completed / total) * 100);
    const cancPct = Math.round((cancelled / total) * 100);
    const inProgPct = Math.round((inProgress / total) * 100);

    const size = 180;
    const strokeWidth = 22;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const compDash = (compPct / 100) * circumference;
    const inProgDash = (inProgPct / 100) * circumference;
    const cancDash = (cancPct / 100) * circumference;

    const inProgOffset = -compDash;
    const cancOffset = -(compDash + inProgDash);

    const svg = `
      <div style="display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;">
        <div style="position:relative;width:${size}px;height:${size}px;">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <!-- Base track -->
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#F1F5F9" stroke-width="${strokeWidth}" />
            
            <!-- Completed (Teal) -->
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#10B981" stroke-width="${strokeWidth}"
              stroke-dasharray="${compDash} ${circumference}"
              stroke-dashoffset="0"
              transform="rotate(-90 ${size/2} ${size/2})" />

            <!-- In Progress (Indigo) -->
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#4F46E5" stroke-width="${strokeWidth}"
              stroke-dasharray="${inProgDash} ${circumference}"
              stroke-dashoffset="${inProgOffset}"
              transform="rotate(-90 ${size/2} ${size/2})" />

            <!-- Cancelled (Red) -->
            <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="#EF4444" stroke-width="${strokeWidth}"
              stroke-dasharray="${cancDash} ${circumference}"
              stroke-dashoffset="${cancOffset}"
              transform="rotate(-90 ${size/2} ${size/2})" />
          </svg>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);text-align:center;">
            <div style="font-size:22px;font-weight:900;color:#0F172A;line-height:1;">${compPct}%</div>
            <div style="font-size:10px;font-weight:700;color:#64748B;margin-top:2px;text-transform:uppercase;">Fulfilled</div>
          </div>
        </div>

        <!-- Legend breakdown -->
        <div style="display:flex;flex-direction:column;gap:10px;min-width:140px;font-size:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="display:flex;align-items:center;gap:6px;color:#334155;font-weight:600;">
              <span style="width:10px;height:10px;border-radius:50%;background:#10B981;"></span>
              Completed
            </span>
            <span style="font-weight:800;color:#0F172A;">${completed} <span style="color:#64748B;font-size:11px;">(${compPct}%)</span></span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="display:flex;align-items:center;gap:6px;color:#334155;font-weight:600;">
              <span style="width:10px;height:10px;border-radius:50%;background:#4F46E5;"></span>
              In Progress
            </span>
            <span style="font-weight:800;color:#0F172A;">${inProgress} <span style="color:#64748B;font-size:11px;">(${inProgPct}%)</span></span>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;">
            <span style="display:flex;align-items:center;gap:6px;color:#334155;font-weight:600;">
              <span style="width:10px;height:10px;border-radius:50%;background:#EF4444;"></span>
              Cancelled
            </span>
            <span style="font-weight:800;color:#0F172A;">${cancelled} <span style="color:#64748B;font-size:11px;">(${cancPct}%)</span></span>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = svg;
  },

  // 5. Most Ordered Products Leaderboard Bar Chart
  renderTopProductsChart(containerId, productsList) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!productsList || !productsList.length) {
      container.innerHTML = '<div style="color:#64748B;padding:30px;text-align:center;font-size:12px;">No product order activity in this period</div>';
      return;
    }

    const maxUnits = Math.max(...productsList.map(p => Number(p.sales_count) || 1));

    container.innerHTML = productsList.map((item, idx) => {
      const units = Number(item.sales_count) || 0;
      const pct = Math.round((units / maxUnits) * 100);
      const rev = Number(item.revenue) || (units * 80);
      const emoji = item.image_emoji || (idx === 0 ? '🍔' : (idx === 1 ? '🥪' : '🥤'));

      return `
        <div class="leaderboard-row" style="margin-bottom:12px;">
          <div class="leaderboard-meta" style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;margin-bottom:4px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:20px;height:20px;border-radius:6px;background:${idx === 0 ? '#FEF3C7;color:#D97706;' : '#F1F5F9;color:#64748B;'}display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;">#${idx + 1}</span>
              <span style="font-size:14px;">${emoji}</span>
              <strong style="color:#0F172A;">${item.name}</strong>
              <span style="font-size:10px;background:#F1F5F9;color:#64748B;padding:1px 6px;border-radius:4px;">${item.category || 'Special'}</span>
            </div>
            <div style="text-align:right;">
              <strong style="color:#4F46E5;">${units} sold</strong>
              <span style="font-size:11px;color:#64748B;margin-left:4px;">(₹${rev.toLocaleString()})</span>
            </div>
          </div>
          <div class="leaderboard-bar-track" style="height:8px;background:#F1F5F9;border-radius:999px;overflow:hidden;">
            <div class="leaderboard-bar-fill" style="width:${pct}%;height:100%;background:linear-gradient(90deg, #4F46E5, #06B6D4);border-radius:999px;"></div>
          </div>
        </div>
      `;
    }).join('');
  },

  // 6. Coupon Usage & Promo Breakdown
  renderCouponBreakdown(containerId, couponData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const list = couponData?.coupons_breakdown || [];
    if (!list.length) {
      container.innerHTML = '<div style="color:#64748B;padding:24px;text-align:center;font-size:12px;">No coupons redeemed in this period</div>';
      return;
    }

    container.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;">
        ${list.map(c => `
          <div style="padding:10px 12px;background:#F8FAFC;border:1px dashed #CBD5E1;border-radius:10px;text-align:center;">
            <span style="display:inline-block;font-family:monospace;font-size:12px;font-weight:800;color:#4F46E5;background:#EEF2FF;padding:2px 8px;border-radius:6px;margin-bottom:4px;">${c.code}</span>
            <div style="font-size:13px;font-weight:800;color:#0F172A;">${c.usage_count} uses</div>
            <div style="font-size:11px;color:#10B981;font-weight:600;">Saved ₹${c.discount_saved || (c.usage_count * 25)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
};

window.CampusCharts = CampusCharts;
