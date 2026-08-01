const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const receiptTotals = `                  <div className="w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                    {savedOrder.shippingMode && savedOrder.shippingMode !== 'retirada' && (
                      <>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 border-dashed">
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Subtotal</span>
                          <span className="text-sm font-bold text-gray-700">{formatPrice(savedOrder.subtotal || savedOrder.total)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 border-dashed">
                          <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                            {savedOrder.shippingMode === 'gratis' ? 'Frete (Grátis)' : 'Frete'}
                          </span>
                          <span className="text-sm font-bold text-gray-700">
                            {savedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(savedOrder.shippingCost || 0)}
                          </span>
                        </div>
                      </>
                    )}
                    {savedOrder.shippingMode === 'retirada' && (
                      <div className="flex justify-between items-center pb-2 border-b border-gray-200 border-dashed">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Entrega</span>
                        <span className="text-sm font-bold text-gray-700">Retirada</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight">{formatPrice(savedOrder.total)}</span>
                    </div>
                  </div>`;

content = content.replace(
  /<div className="w-1\/3 bg-gray-50 p-4 rounded-xl border border-gray-100">\s*<div className="flex justify-between items-center">\s*<span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total<\/span>\s*<span className="text-2xl font-black text-gray-900 tracking-tight">\{formatPrice\(savedOrder\.total\)\}<\/span>\s*<\/div>\s*<\/div>/,
  receiptTotals
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
