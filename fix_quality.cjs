const fs = require('fs');

function replaceQuality(filePath) {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/canvas\.toDataURL\(([^,]+),\s*0\.\d+\)/g, 'canvas.toDataURL($1, 1.0)');
    content = content.replace(/canvas\.toDataURL\('image\/jpeg',\s*0\.\d+\)/g, 'canvas.toDataURL(\'image/jpeg\', 1.0)');
    fs.writeFileSync(filePath, content);
    console.log('Fixed', filePath);
  }
}

replaceQuality('src/admin/views/Settings.tsx');
replaceQuality('src/admin/views/Products.tsx');
replaceQuality('src/utils/image.ts');

