const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const oldStr = `        notes,
        createdAt: serverTimestamp(),`;
const newStr = `        notes,
        paymentPolicy,
        createdAt: serverTimestamp(),`;
content = content.replace(oldStr, newStr);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
