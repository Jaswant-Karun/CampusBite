const fs = require('fs');

const files = fs.readdirSync('frontend');
files.forEach(f => {
  if (f.endsWith('.html')) {
    const txt = fs.readFileSync('frontend/' + f, 'utf8');
    console.log(f, 'has AdminApp:', txt.includes('AdminApp'), 'has admin.js:', txt.includes('admin.js'));
  }
});
