const fs = require('fs');

const adminHtml = fs.readFileSync('frontend/admin.html', 'utf8');
const lines = adminHtml.split('\n');

lines.forEach((l, i) => {
  if (l.includes('tab') || l.includes('review') || l.includes('Review')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
