const fs = require('fs');
let code = fs.readFileSync('src/data/products.ts', 'utf8');

code = code.replace(
  '  banners?: string[];\n',
  ''
);

fs.writeFileSync('src/data/products.ts', code);
