/**
 * CampusBite Custom Lightweight SVG / Canvas Charts
 * Professional Chart System:
 * Main chart: #4F46E5 (Indigo)
 * Secondary: #14B8A6 (Teal)
 * Warning: #F59E0B (Amber)
 * Negative / Peak: #DC2626 (Red)
 */

const CampusCharts = {
  renderWeeklyRevenue(containerId, weeklyData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!weeklyData || !weeklyData.length) {
      container.innerHTML = '<div style="color:#64748B;padding:40px;text-align:center;">No data available</div>';
      return;
    }

    const maxVal = Math.max(...weeklyData.map(d => d.revenue));
    const height = 200;
    const width = container.clientWidth || 450;
    const barWidth = 32;
    const spacing = (width - 60) / weeklyData.length;

    let barsSvg = '';
    weeklyData.forEach((item, index) => {
      const barHeight = Math.max(10, (item.revenue / maxVal) * (height - 50));
      const x = 30 + (index * spacing);
      const y = height - barHeight - 24;

      barsSvg += `
        <g class="chart-bar-group" style="cursor:pointer;">
          <title>${item.day}: ₹${item.revenue.toLocaleString()} (${item.orders} orders)</title>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" rx="6" fill="url(#barGradient)" />
          <text x="${x + (barWidth / 2)}" y="${height - 6}" font-size="11" fill="#64748B" text-anchor="middle" font-weight="500">${item.day}</text>
          <text x="${x + (barWidth / 2)}" y="${y - 6}" font-size="10.5" fill="#0F172A" text-anchor="middle" font-weight="600">₹${(item.revenue / 1000).toFixed(1)}k</text>
        </g>
      `;
    });

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4F46E5" />
            <stop offset="100%" stop-color="#6366F1" />
          </linearGradient>
        </defs>
        <line x1="20" y1="${height - 24}" x2="${width - 10}" y2="${height - 24}" stroke="#E2E8F0" stroke-width="1" />
        ${barsSvg}
      </svg>
    `;

    container.innerHTML = svg;
  },

  renderHourlyDemand(containerId, hourlyData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!hourlyData || !hourlyData.length) {
      container.innerHTML = '<div style="color:#64748B;padding:40px;text-align:center;">No data available</div>';
      return;
    }

    const maxOrders = Math.max(...hourlyData.map(d => d.orders));
    const height = 200;
    const width = container.clientWidth || 320;
    const paddingLeft = 30;
    const spacing = (width - 50) / (hourlyData.length - 1);

    // Build polyline points
    const points = hourlyData.map((d, i) => {
      const x = paddingLeft + (i * spacing);
      const y = height - 30 - ((d.orders / maxOrders) * (height - 60));
      return { x, y, ...d };
    });

    const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

    let dotsSvg = '';
    points.forEach(p => {
      const isPeak = p.orders > 70;
      dotsSvg += `
        <circle cx="${p.x}" cy="${p.y}" r="${isPeak ? 5 : 4}" fill="${isPeak ? '#DC2626' : '#14B8A6'}" stroke="#FFFFFF" stroke-width="2">
          <title>${p.hour}: ${p.orders} orders (${p.label})</title>
        </circle>
        <text x="${p.x}" y="${height - 8}" font-size="10" fill="#64748B" text-anchor="middle" font-weight="500">${p.hour}</text>
      `;
    });

    const svg = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow:visible;">
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#4F46E5" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#4F46E5" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <polygon points="${points[0].x},${height - 30} ${pointsStr} ${points[points.length-1].x},${height - 30}" fill="url(#areaGradient)" />
        <polyline fill="none" stroke="#4F46E5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" points="${pointsStr}" />
        ${dotsSvg}
      </svg>
    `;

    container.innerHTML = svg;
  }
};

window.CampusCharts = CampusCharts;
