const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

// 1. Empty State
content = content.replace(
  '<p className="text-sm text-gray-400 text-center py-4">O carrinho está vazio</p>',
  `<div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <ShoppingCart size={32} className="mb-2 opacity-40" />
                  <p className="text-xs text-gray-400 font-medium">O carrinho está vazio</p>
                </div>`
);

// 2. Shipping Controls
const oldShipping = `<h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Truck size={16} /> Entrega / Retirada</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setShippingMode('retirada')}
                  className={\`py-2 rounded-lg text-xs font-bold transition-colors border \${shippingMode === 'retirada' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}\`}
                >
                  Retirada
                </button>
                <button
                  onClick={() => setShippingMode('gratis')}
                  className={\`py-2 rounded-lg text-xs font-bold transition-colors border \${shippingMode === 'gratis' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}\`}
                >
                  Frete Grátis
                </button>
                <button
                  onClick={() => setShippingMode('pago')}
                  className={\`py-2 rounded-lg text-xs font-bold transition-colors border \${shippingMode === 'pago' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}\`}
                >
                  Frete Pago
                </button>
              </div>`;

const newShipping = `<h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><Truck size={14} /> Entrega / Retirada</h3>
              <div className="flex p-1 bg-gray-100/80 rounded-lg">
                <button
                  onClick={() => setShippingMode('retirada')}
                  className={\`flex-1 py-1.5 rounded-md text-xs font-bold transition-all \${shippingMode === 'retirada' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  Retirada
                </button>
                <button
                  onClick={() => setShippingMode('gratis')}
                  className={\`flex-1 py-1.5 rounded-md text-xs font-bold transition-all \${shippingMode === 'gratis' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  Frete Grátis
                </button>
                <button
                  onClick={() => setShippingMode('pago')}
                  className={\`flex-1 py-1.5 rounded-md text-xs font-bold transition-all \${shippingMode === 'pago' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  Frete Pago
                </button>
              </div>`;

content = content.replace(oldShipping, newShipping);

content = content.replace(
  '<label className="text-xs text-gray-500 uppercase font-bold block mb-1">Valor do Frete (R$)</label>',
  '<label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Valor do Frete (R$)</label>'
);
content = content.replace(
  'className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"',
  'className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] focus:bg-white outline-none transition-colors"'
);

// 3. Total Hierarchy
const oldTotal = `<div className="pt-4 border-t border-gray-100 space-y-2">
              {shippingMode === 'pago' && (
                <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              )}
              {shippingMode === 'pago' && (
                <div className="flex justify-between items-center text-sm text-gray-600 font-medium">
                  <span>Frete</span>
                  <span>{formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-gray-700">Total</span>
              <span className="font-black text-[var(--color-primary)]">{formatPrice(total)}</span>
            </div>
            </div>`;

const newTotal = `<div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              {shippingMode !== 'retirada' && (
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              )}
              {shippingMode !== 'retirada' && (
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                  <span>Frete {shippingMode === 'gratis' && '(Grátis)'}</span>
                  <span>{shippingMode === 'gratis' ? 'Grátis' : formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-[var(--color-primary)]">{formatPrice(total)}</span>
              </div>
            </div>`;

content = content.replace(oldTotal, newTotal);

// 4. Customer Form
content = content.replace(
  '<h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><User size={16} /> Cliente</h3>',
  '<h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><User size={14} /> Cliente</h3>'
);

content = content.replace(
  /className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-\[var\(--color-primary\)\]"/g,
  'className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"'
);

content = content.replace(
  'className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] min-h-[60px] resize-y"',
  'className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[60px] resize-y"'
);

// 5. Action Buttons
const oldButtons = `<div className="flex gap-3 pt-2">
            <button
              onClick={() => handleSave('Orçamento')}
              disabled={isSaving || cart.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 py-2.5 rounded-xl font-bold text-sm hover:bg-purple-100 transition-colors disabled:opacity-50"
            >
              <FileText size={16} />
              Orçamento
            </button>
            <button
              onClick={() => handleSave('Pendente')}
              disabled={isSaving || cart.length === 0}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[var(--color-primary)] text-white py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-colors disabled:opacity-50 shadow-sm"
            >
              <Save size={16} />
              Venda (Pendente)
            </button>
          </div>`;

const newButtons = `<div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => handleSave('Pendente')}
              disabled={isSaving || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <Save size={18} />
              Concluir Venda
            </button>
            <button
              onClick={() => handleSave('Orçamento')}
              disabled={isSaving || cart.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-transparent text-[var(--color-primary)] py-2.5 rounded-xl font-bold text-xs hover:bg-blue-50/50 transition-colors disabled:opacity-50"
            >
              <FileText size={14} />
              Salvar como Orçamento
            </button>
          </div>`;

content = content.replace(oldButtons, newButtons);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
