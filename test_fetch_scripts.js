const http = require('http');

const scripts = [
  'js/api.js',
  'js/qr-code.js',
  'js/charts.js',
  'js/notifications.js',
  'js/voice-order.js',
  'js/timetable-sync.js',
  'js/upi-payment.js',
  'js/spin-wheel.js',
  'js/hero-slider.js',
  'js/student.js',
  'js/admin.js',
  'js/chatbot.js',
  'js/app.js'
];

async function checkScripts() {
  for (const s of scripts) {
    await new Promise(resolve => {
      http.get(`http://localhost:3000/${s}`, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          const isHtml = body.trim().startsWith('<');
          console.log(`[${res.statusCode}] ${s} (${res.headers['content-type']}) - Starts with '<'? ${isHtml} (length: ${body.length})`);
          resolve();
        });
      }).on('error', err => {
        console.error(`Error on ${s}:`, err.message);
        resolve();
      });
    });
  }
}

checkScripts();
