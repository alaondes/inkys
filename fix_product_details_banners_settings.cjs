const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

code = code.replace(
  '{product.banners && product.banners.length > 0 && <ProductBannerCarousel banners={product.banners} />}',
  '{settings?.productBanners && settings.productBanners.length > 0 && <ProductBannerCarousel banners={settings.productBanners} />}'
);

fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
