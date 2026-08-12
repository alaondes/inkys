const fs = require('fs');
let code = fs.readFileSync('src/storefront/Storefront.tsx', 'utf8');

code = code.replace(
  '{item.selectedColor && <span className="text-xs text-gray-500 block">Cor: {item.selectedColor}</span>}',
  '{item.selectedColor && <span className="text-xs text-gray-500 block">Cor: {item.selectedColor}</span>}\n                        {item.selectedSize && <span className="text-xs text-gray-500 block">Tamanho: {item.selectedSize}</span>}'
);

fs.writeFileSync('src/storefront/Storefront.tsx', code);
