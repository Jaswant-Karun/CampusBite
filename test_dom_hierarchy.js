const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');

// Find where mob-screen elements are placed in index.html
const matches = [...html.matchAll(/<div[^>]*class=["'][^"']*mob-screen[^"']*["'][^>]*id=["']([^"']+)["']/g)];
console.log('mob-screen ids and positions:');
for (const m of matches) {
  const line = html.substring(0, m.index).split('\n').length;
  console.log(`Line ${line}: id="${m[1]}"`);
}

// Check where desktop views are located
console.log('\nChecking desktop container elements:');
['desktop-main-grid', 'desktop-left-column', 'desktop-right-column', 'phone-frame', 'phone-screen'].forEach(c => {
  const line = html.split('\n').findIndex(l => l.includes(c));
  console.log(`${c}: found on line ${line + 1}`);
});
