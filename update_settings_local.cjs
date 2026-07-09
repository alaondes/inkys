const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

code = code.replace(
  '    heroBanners: (settings.heroBanners && settings.heroBanners.length > 0) ? settings.heroBanners : [{',
  '    productBanners: settings.productBanners || [],\n    heroBanners: (settings.heroBanners && settings.heroBanners.length > 0) ? settings.heroBanners : [{'
);

fs.writeFileSync('src/admin/views/Settings.tsx', code);
