const fs = require('fs');

// Fix Products.tsx
let productsContent = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');
productsContent = productsContent.replace(/updateProduct\(p\.id, \{ \.\.\.p, category: newCat \}\);/g, 'updateProduct({ ...p, category: newCat });');
fs.writeFileSync('src/admin/views/Products.tsx', productsContent);

// Fix Settings.tsx
let settingsContent = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');
settingsContent = settingsContent.replace(/const reader = new FileReader\(\);\s*reader\.onloadend = async \(\) => \{\s*const base64String = reader\.result as string;\s*const resized = await resizeImage\(base64String, 200, 200\);\s*setFooterSettings\(\{ \.\.\.footerSettings, footerLogoUrl: resized \}\);\s*\};\s*reader\.readAsDataURL\(file\);/g, 'const resized = await resizeImage(file, 200, 200);\nsetFooterSettings({ ...footerSettings, footerLogoUrl: resized });');
fs.writeFileSync('src/admin/views/Settings.tsx', settingsContent);

console.log("Fixed files");
