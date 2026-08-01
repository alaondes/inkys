const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

// 1. Update addToCart to include isAvulso
content = content.replace(
  "setCart([...cart, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, isCustom: false }]);",
  "setCart([...cart, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, isCustom: false, isAvulso: product.isAvulso }]);"
);

// 2. Make Name editable for custom/avulso
content = content.replace(
  /<h4 className="text-xs font-semibold text-gray-800 leading-tight">\{item\.name\}<\/h4>/,
  `{item.isCustom || item.isAvulso ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateCartItem(item.id, 'name', e.target.value)}
                          className="w-full text-xs font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[var(--color-primary)] outline-none pb-0.5"
                        />
                      ) : (
                        <h4 className="text-xs font-semibold text-gray-800 leading-tight">{item.name}</h4>
                      )}`
);

// 3. Make Price editable for custom/avulso and use string formatting
const priceInputStr = `{item.isCustom || item.isAvulso ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">R$</span>
                            <input
                              type="text"
                              value={item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\\D/g, '');
                                updateCartItem(item.id, 'price', val ? parseInt(val, 10) / 100 : 0);
                              }}
                              className="w-16 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[var(--color-primary)] text-right"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                        )}`;

content = content.replace(
  /\{item\.isCustom \? \([\s\S]*?\) : \([\s\S]*?\{formatPrice\(item\.price \* item\.quantity\)\}<\/span>\s*\)\}/,
  priceInputStr
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
