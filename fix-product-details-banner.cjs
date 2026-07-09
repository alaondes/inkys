const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

code = code.replace(
  'const ProductBannerCarousel = () => {',
  'const ProductBannerCarousel = ({ banners }: { banners: string[] }) => {'
);

code = code.replace(
  `  const banners = [
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=2000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2000&auto=format&fit=crop'
  ];`,
  ''
);

code = code.replace(
  '<ProductBannerCarousel />',
  '{product.banners && product.banners.length > 0 && <ProductBannerCarousel banners={product.banners} />}'
);

fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
