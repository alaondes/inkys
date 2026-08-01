const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

// Imports
content = content.replace(
  "import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon } from 'lucide-react';",
  "import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store } from 'lucide-react';"
);

// State
content = content.replace(
  "  const [savedOrder, setSavedOrder] = useState<any>(null);",
  "  const [savedOrder, setSavedOrder] = useState<any>(null);\n  const [shippingMode, setShippingMode] = useState<'retirada' | 'gratis' | 'pago'>('retirada');\n  const [shippingCost, setShippingCost] = useState(0);"
);

// Total Calculation
content = content.replace(
  "const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);",
  "const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);\n  const total = subtotal + (shippingMode === 'pago' ? shippingCost : 0);"
);

// handleSave Function update to include shipping info
content = content.replace(
  /const handleSave = async \(status: 'Pendente' \| 'Orçamento'\) => \{[\s\S]*?items: cart,/,
  `const handleSave = async (status: 'Pendente' | 'Orçamento') => {
    if (cart.length === 0) {
      toast.error('O carrinho está vazio');
      return;
    }
    if (!customerInfo.name) {
      toast.error('Informe o nome do cliente');
      return;
    }

    setIsSaving(true);
    try {
      const orderRef = await addDoc(collection(db, 'orders'), {
        customer: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        doc: customerInfo.doc,
        total,
        subtotal,
        status,
        items: cart,
        shippingMode,
        shippingCost: shippingMode === 'pago' ? shippingCost : 0,`
);

// Empty state after save
content = content.replace(
  "setCart([]);\n      setCustomerInfo({ name: '', email: '', phone: '', doc: '' });\n      setNotes('');",
  "setCart([]);\n      setCustomerInfo({ name: '', email: '', phone: '', doc: '' });\n      setNotes('');\n      setShippingMode('retirada');\n      setShippingCost(0);"
);

// UI Addition for Shipping
const shippingUI = `
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><Truck size={16} /> Entrega / Retirada</h3>
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
              </div>
              {shippingMode === 'pago' && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Valor do Frete (R$)</label>
                  <input
                    type="text"
                    value={shippingCost ? shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\\D/g, '');
                      setShippingCost(val ? parseInt(val, 10) / 100 : 0);
                    }}
                    placeholder="0,00"
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              )}
            </div>
`;

content = content.replace(
  /<div className="pt-3 border-t border-gray-100 flex justify-between items-center text-lg">\n              <span className="font-bold text-gray-700">Total<\/span>/,
  `${shippingUI}
            <div className="pt-4 border-t border-gray-100 space-y-2">
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
                <span className="font-bold text-gray-700">Total</span>`
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
