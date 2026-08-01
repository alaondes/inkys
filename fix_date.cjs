const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

content = content.replace("date: new Date().toISOString(),", "date: serverTimestamp(),");

fs.writeFileSync('src/admin/views/Pos.tsx', content);
