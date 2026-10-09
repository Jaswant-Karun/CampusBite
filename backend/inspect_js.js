const fs = require('fs');

const js = fs.readFileSync('frontend/js/student.js', 'utf8');
const lines = js.split('\n');

console.log('Searching student.js...');
lines.forEach((l, i) => {
  if (l.includes('renderOrderHistory') || l.includes('renderOrder') || l.includes('viewOrderHistory') || l.includes('history-list')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
