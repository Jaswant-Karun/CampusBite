const fs = require('fs');
const html = fs.readFileSync('frontend/index.html', 'utf8');

const screenMatches = [...html.matchAll(/<div[^>]+id=["'](screen-[^"']+)["'][^>]*class=["'][^"']*mob-screen[^"']*["']/g)];
console.log('Found mob-screens:');
for (const m of screenMatches) {
  const screenId = m[1];
  const idx = m.index;
  const chunk = html.substring(idx, idx + 1000);
  const hasBack = chunk.includes('back-btn') || chunk.includes('navigateTo(\'home\')') || chunk.includes('history.back()');
  console.log(`${screenId}: has back button? ${hasBack}`);
}
