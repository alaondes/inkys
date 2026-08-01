const fs = require('fs');
const files = [
  'src/admin/views/Products.tsx',
  'src/admin/views/Customers.tsx',
  'src/admin/views/Orders.tsx',
  'src/admin/views/Documents.tsx',
  'src/admin/views/CustomProducts.tsx',
  'src/admin/views/Settings.tsx',
  'src/admin/components/BannersTab.tsx',
  'src/admin/AdminApp.tsx',
  'src/components/checkout/ResumoCarrinho.tsx',
  'src/storefront/ProductDetails.tsx',
  'src/storefront/Storefront.tsx',
  'src/storefront/CustomProductPage.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // We want to add referrerPolicy="no-referrer" to all <img tags that don't have it
    // Careful with multiline tags. A simple way:
    // replace /<img\s([^>]+)>/g
    // if $1 doesn't contain referrerPolicy, add it.
    
    content = content.replace(/<img\s([^>]+)>/g, (match, p1) => {
      if (p1.includes('referrerPolicy')) {
        return match;
      } else {
        modified = true;
        return `<img ${p1} referrerPolicy="no-referrer">`;
      }
    });

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Fixed ${file}`);
    }
  }
});
