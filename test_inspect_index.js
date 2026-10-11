const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');
const lines = html.split('\n');

const keywords = ['order-history', 'tracking', 'crowd-meter', 'wallet', 'profile', 'sustainability', 'nutrition'];

for (const kw of keywords) {
  console.log(`\n=== Matches for ${kw} ===`);
  lines.forEach((l, idx) => {
    if (l.includes(kw) && (l.includes('id=') || l.includes('class="mob-screen') || l.includes('<div id='))) {
      console.log(`Line ${idx + 1}: ${l.trim().slice(0, 100)}`);
    }
  });
}
