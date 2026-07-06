const fs = require('fs');
const content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// strip comments
let clean = content.replace(/\/\*[\s\S]*?\*\//g, '');
clean = clean.replace(/\/\/.*/g, '');

let opens = (clean.match(/\{/g) || []).length;
let closes = (clean.match(/\}/g) || []).length;
console.log(`{ count: ${opens}, } count: ${closes}`);
