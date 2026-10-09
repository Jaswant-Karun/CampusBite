const fs = require('fs');

const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
const lines = indexHtml.split('\n');

lines.forEach((l, i) => {
  if (l.includes('admin-reviews') || l.includes('tab="reviews"') || l.includes("showTab('reviews')") || l.includes('Customer Reviews')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
