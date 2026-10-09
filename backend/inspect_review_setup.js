const fs = require('fs');

const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
const lines = indexHtml.split('\n');

lines.forEach((l, i) => {
  if (l.includes('id="tab-') || l.includes('class="admin-tab') || l.includes('admin-nav')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
