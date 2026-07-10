const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

content = content.replace(/const MAX_WIDTH = 2000;/g, 'const MAX_WIDTH = 1200;');
content = content.replace(/const MAX_HEIGHT = 1125;/g, 'const MAX_HEIGHT = 800;');
content = content.replace(/canvas\.toDataURL\('image\/webp',\s*0\.92\)/g, 'canvas.toDataURL(\'image/webp\', 0.7)');

fs.writeFileSync('src/admin/views/Products.tsx', content);

let settingsContent = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');
settingsContent = settingsContent.replace(/canvas\.toDataURL\('image\/webp',\s*0\.92\)/g, 'canvas.toDataURL(\'image/webp\', 0.7)');
fs.writeFileSync('src/admin/views/Settings.tsx', settingsContent);

let utilsContent = fs.readFileSync('src/utils/image.ts', 'utf8');
utilsContent = utilsContent.replace(/canvas\.toDataURL\('image\/webp',\s*0\.92\)/g, 'canvas.toDataURL(\'image/webp\', 0.7)');
fs.writeFileSync('src/utils/image.ts', utilsContent);
console.log('Fixed sizes');
