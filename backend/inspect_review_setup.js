const fs = require('fs');

function findLines(filePath, pattern) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const results = [];
  lines.forEach((line, idx) => {
    if (line.toLowerCase().includes(pattern.toLowerCase())) {
      results.push({ line: idx + 1, content: line.trim() });
    }
  });
  return results;
}

console.log('--- index.html reviews ---');
console.log(findLines('frontend/index.html', 'customer-review-modal'));
console.log(findLines('frontend/index.html', 'review'));

console.log('\n--- student.js reviews ---');
console.log(findLines('frontend/js/student.js', 'review').slice(0, 15));

console.log('\n--- admin.js reviews ---');
console.log(findLines('frontend/js/admin.js', 'review').slice(0, 15));
