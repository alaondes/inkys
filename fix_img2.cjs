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
    
    // Fix the broken tags: <img ... / referrerPolicy="no-referrer"> -> <img ... referrerPolicy="no-referrer" />
    content = content.replace(/\/\s*referrerPolicy="no-referrer">/g, 'referrerPolicy="no-referrer" />');

    // Also we might have some that were already correctly formatted? 
    // The previous regex was: return `<img ${p1} referrerPolicy="no-referrer">`;
    // If it didn't end with slash, it would be fine but in JSX they always do.

    fs.writeFileSync(file, content);
  }
});
