const fs = require('fs');

function replaceQuality(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/canvas\.toDataURL\(([^,]+),\s*0\.9\)/g, "canvas.toDataURL('image/webp', 0.92)");
    content = content.replace(/canvas\.toDataURL\('image\/jpeg',\s*0\.9\)/g, "canvas.toDataURL('image/webp', 0.92)");
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

replaceQuality('src/admin/views/Settings.tsx');
replaceQuality('src/admin/views/Products.tsx');
replaceQuality('src/utils/image.ts');
replaceQuality('src/admin/components/BannersTab.tsx');

