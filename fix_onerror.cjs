const fs = require('fs');

const files = [
  'src/admin/views/Products.tsx',
  'src/storefront/ProductDetails.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/onError=\{\(e\)\s*=\s*referrerPolicy="no-referrer">\s*\{/g, 'referrerPolicy="no-referrer" onError={(e) => {');
    fs.writeFileSync(file, content);
  }
});
