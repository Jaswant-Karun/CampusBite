const fs = require('fs');

const html = fs.readFileSync('frontend/index.html', 'utf8');
const screens = [...html.matchAll(/id=["']screen-([a-zA-Z0-9_-]+)["']/g)].map(m => m[1]);
console.log('Screens in index.html (count: ' + screens.length + '):', screens);

// Check all desktop-nav-btn data-screen attributes
const navScreens = [...html.matchAll(/class=["'][^"']*desktop-nav-btn[^"']*["'][^>]*data-screen=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Desktop nav screens:', navScreens);

// Check if each nav screen has a corresponding screen- element
for (const s of navScreens) {
  const hasScreen = screens.includes(s);
  console.log(`Nav ${s} has screen element:`, hasScreen);
}

// Check mobile nav items
const mobNavScreens = [...html.matchAll(/class=["'][^"']*nav-item[^"']*["'][^>]*data-screen=["']([^"']+)["']/g)].map(m => m[1]);
console.log('Mobile nav screens:', mobNavScreens);
for (const s of mobNavScreens) {
  const hasScreen = screens.includes(s);
  console.log(`Mobile nav ${s} has screen element:`, hasScreen);
}
