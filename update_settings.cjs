const fs = require('fs');
let code = fs.readFileSync('src/context/SettingsContext.tsx', 'utf8');

code = code.replace(
  'heroBanners?: HeroBanner[];',
  'heroBanners?: HeroBanner[];\n  productBanners?: string[];'
);

code = code.replace(
  'heroBannerButtonColor: \'#b44e68\',',
  'heroBannerButtonColor: \'#b44e68\',\n  productBanners: [],'
);

fs.writeFileSync('src/context/SettingsContext.tsx', code);
