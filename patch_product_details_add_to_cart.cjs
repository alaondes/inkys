const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

code = code.replace(
  'onAddToCart: (product: Product, selectedColor?: string, customData?: { text?: string, music?: string, image?: string }) => void;',
  'onAddToCart: (product: Product, selectedColor?: string, selectedSize?: string, customData?: { text?: string, music?: string, image?: string }) => void;'
);

code = code.replace(
  'onAddToCart(product, selectedColor, isPersonalized ? { text: customText, music: customMusic, image: customImage || undefined } : undefined);',
  'onAddToCart(product, selectedColor, selectedSize, isPersonalized ? { text: customText, music: customMusic, image: customImage || undefined } : undefined);'
);

fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
