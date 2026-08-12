const fs = require('fs');
let code = fs.readFileSync('src/storefront/Storefront.tsx', 'utf8');

code = code.replace(
  'const addToCart = (product: any, selectedColor?: string, customData?: { text?: string, music?: string, image?: string }, initialQuantity: number = 1) => {',
  'const addToCart = (product: any, selectedColor?: string, selectedSize?: string, customData?: { text?: string, music?: string, image?: string }, initialQuantity: number = 1) => {'
);

code = code.replace(
  "const cartItemId = `${product.id}-${selectedColor || 'default'}-${customHash}`;",
  "const cartItemId = `${product.id}-${selectedColor || 'default'}-${selectedSize || 'default'}-${customHash}`;"
);

code = code.replace(
  'selectedColor,',
  'selectedColor,\n        selectedSize,'
);

// We also need to fix `<ProductCard onAddToCart={(p, c, d) => addToCart(p, c, d)} />` calls or similar
code = code.replace(
  'onAddToCart={addToCart}',
  'onAddToCart={(p, color, custom, qty) => addToCart(p, color, undefined, custom, qty)}' // wait, ProductDetails expects (product, color, size, customData)
);

// Actually let's just do a regex replace for `addToCart` usage inside components.
// It's safer to just change the signature of ProductCard, ProductCarousel, CustomProductPage, etc. if they take onAddToCart.

fs.writeFileSync('src/storefront/Storefront.tsx', code);
