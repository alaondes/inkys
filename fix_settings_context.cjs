const fs = require('fs');
let code = fs.readFileSync('src/context/SettingsContext.tsx', 'utf8');

code = code.replace(
  'productBanners?: string[];',
  'productBanners?: any[];'
);

fs.writeFileSync('src/context/SettingsContext.tsx', code);
