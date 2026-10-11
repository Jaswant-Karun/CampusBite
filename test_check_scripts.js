const fs = require('fs');
const http = require('http');

const html = fs.readFileSync('frontend/index.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Scripts found in index.html:', scriptMatches);

for (const s of scriptMatches) {
  const p = 'frontend/' + s;
  console.log(s, 'file exists on disk:', fs.existsSync(p));
}

// Check CSS files
const cssMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)].map(m => m[1]);
console.log('\nCSS files found:');
for (const c of cssMatches) {
  if (c.includes('.css')) {
    const p = 'frontend/' + c;
    console.log(c, 'file exists on disk:', fs.existsSync(p));
  }
}
