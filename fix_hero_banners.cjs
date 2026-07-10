const fs = require('fs');
let content = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

content = content.replace(/resizeImage\(file, 2000, 1125\)/g, 'resizeImage(file, 1200, 800)');

fs.writeFileSync('src/admin/components/BannersTab.tsx', content);
console.log('Fixed hero banners size');
