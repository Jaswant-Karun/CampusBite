const fs = require('fs');

const files = ['frontend/index.html', 'frontend/admin.html', 'frontend/mobile.html'];

for (const file of files) {
  console.log(`\n================ SCANNING ${file} ================`);
  const html = fs.readFileSync(file, 'utf8');
  
  // Find all buttons without onclick and type!=submit
  const buttonMatches = [...html.matchAll(/<button\b([^>]*)>(.*?)<\/button>/gs)];
  console.log(`Total <button> elements: ${buttonMatches.length}`);
  
  let emptyOnClick = 0;
  let noAction = 0;
  for (const m of buttonMatches) {
    const attrs = m[1];
    const text = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 30);
    const hasOnclick = /onclick\s*=\s*["']([^"']+)["']/.test(attrs);
    const isSubmit = /type\s*=\s*["']submit["']/.test(attrs);
    const hasId = /id\s*=\s*["']([^"']+)["']/.test(attrs);
    const hasData = /data-[a-zA-Z-]+\s*=/.test(attrs);
    
    if (attrs.includes('onclick=""') || attrs.includes("onclick=''")) {
      console.log(`  [EMPTY ONCLICK] "${text}": ${attrs.slice(0, 80)}`);
      emptyOnClick++;
    } else if (!hasOnclick && !isSubmit && !hasId && !hasData) {
      console.log(`  [NO ACTION / NO ID] "${text}": ${attrs.slice(0, 80)}`);
      noAction++;
    }
  }
  console.log(`Empty onclick: ${emptyOnClick}, No action/ID/data: ${noAction}`);
}
