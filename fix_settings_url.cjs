const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// replace footerLogoUrl
content = content.replace(/footerLogoUrl: e\.target\.value/g, 'footerLogoUrl: convertGoogleDriveUrl(e.target.value)');

// what about hero banners or other image urls? Let's check if there are others.
fs.writeFileSync('src/admin/views/Settings.tsx', content);
