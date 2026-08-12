const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

// The banner section is somehow broken
const startIdx = code.indexOf('{/* Quick DRE Banner */}');
const endIdx = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">');

console.log(code.substring(startIdx, endIdx));
