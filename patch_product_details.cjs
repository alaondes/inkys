const fs = require('fs');
let code = fs.readFileSync('src/storefront/ProductDetails.tsx', 'utf8');

code = code.replace(
  'const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]?.name);',
  'const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]?.name);\n  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0]);'
);

code = code.replace(
  `    addToCart({ 
      ...product, 
      price: productPrice, 
      category: 'Catálogo',
      image: currentImageIndex === 0 && customImage ? customImage : images[currentImageIndex]
    }, {
       color: selectedColor,
       customText,
       customMusic,
       customImage: customImage || undefined
    });`,
  `    addToCart({ 
      ...product, 
      price: productPrice, 
      category: 'Catálogo',
      image: currentImageIndex === 0 && customImage ? customImage : images[currentImageIndex]
    }, {
       color: selectedColor,
       size: selectedSize,
       customText,
       customMusic,
       customImage: customImage || undefined
    });`
);

code = code.replace(
  `            {product.colors && product.colors.length > 0 && (
              <div className="mb-6 border-b border-gray-100 pb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Cor: <span className="font-normal">{selectedColor}</span></h3>
                <div className="flex gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={\`w-10 h-10 rounded-full border-2 transition-all \${selectedColor === color.name ? 'border-purple-600 shadow-md scale-110' : 'border-gray-200 hover:scale-105'}\`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}`,
  `            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6 border-b border-gray-100 pb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Tamanho: <span className="font-normal">{selectedSize}</span></h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={\`min-w-[3rem] h-10 px-3 rounded-md border-2 text-sm font-bold transition-all \${selectedSize === size ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-purple-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}\`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colors && product.colors.length > 0 && (
              <div className="mb-6 border-b border-gray-100 pb-6">
                <h3 className="text-sm font-bold text-gray-700 mb-3">Cor: <span className="font-normal">{selectedColor}</span></h3>
                <div className="flex gap-3">
                  {product.colors.map(color => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={\`w-10 h-10 rounded-full border-2 transition-all \${selectedColor === color.name ? 'border-[var(--color-primary)] shadow-md scale-110' : 'border-gray-200 hover:scale-105'}\`}
                      style={{ backgroundColor: color.hex.startsWith('linear') ? '#ffffff' : color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}`
);

fs.writeFileSync('src/storefront/ProductDetails.tsx', code);
