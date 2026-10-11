const fs = require('fs');
const code = fs.readFileSync('frontend/js/student.js', 'utf8');

const funcs = ['renderTracking', 'renderOrderHistory', 'renderProfile', 'updateWalletUI', 'renderCart', 'renderCheckout'];
for (const f of funcs) {
  const has = code.includes(f);
  const def = code.includes(f + '(') || code.includes(f + ' (') || code.includes(f + ' =') || code.includes(f + ':');
  console.log(`${f}: present in file? ${has}, defined? ${def}`);
}
