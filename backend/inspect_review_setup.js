const fs = require('fs');

const s = fs.readFileSync('frontend/js/student.js', 'utf8');
const lines = s.split('\n');

lines.forEach((l, i) => {
  if (l.includes('submitCustomerReview') || l.includes('openReviewModal') || l.includes('submitReview')) {
    console.log(`Line ${i + 1}: ${l.trim()}`);
  }
});
