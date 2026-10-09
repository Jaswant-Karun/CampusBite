const fs = require('fs');

const indexHtml = fs.readFileSync('frontend/index.html', 'utf8');
const lines = indexHtml.split('\n');

console.log('Searching index.html...');
lines.forEach((l, i) => {
  if (l.includes('id="screen-') || l.includes('screen-profile') || l.includes('screen-order-history')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});

const mobileHtml = fs.readFileSync('frontend/mobile.html', 'utf8');
const mobLines = mobileHtml.split('\n');
console.log('\nSearching mobile.html...');
mobLines.forEach((l, i) => {
  if (l.includes('id="screen-') || l.includes('screen-profile') || l.includes('screen-order-history')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
