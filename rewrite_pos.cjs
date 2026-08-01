const fs = require('fs');

const newCode = `import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';

export function Pos() {
  const { products } = useProducts();
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', doc: '' });
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({ name: '', price: 0, image: '', quantity: 1 });

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1, isCustom: false }]);
    }
  };

  const handleAddCustomItem = () => {
    if (!customItem.name) {
      toast.error('Informe o nome do produto/serviço');
      return;
    }
    setCart([...cart, { 
      id: Date.now().toString(), 
      name: customItem.name, 
      price: customItem.price, 
      image: customItem.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop', 
      quantity: customItem.quantity, 
      isCustom: true 
    }]);
    setShowCustomModal(false);
    setCustomItem({ name: '', price: 0, image: '', quantity: 1 });
  };

  const updateCartItem = (id: string, field: string, value: any) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSave = async (status: 'Pendente' | 'Orçamento') => {
    if (cart.length === 0) {
      toast.error("O carrinho está vazio.");
      return;
    }
    if (!customerInfo.name) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        customer: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        date: serverTimestamp(),
        total,
        status,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        })),
        notes,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast.success(status === 'Orçamento' ? "Orçamento gerado com sucesso!" : "Venda registrada com sucesso!");
      
      setSavedOrder({ ...orderData, id: docRef.id, displayDate: new Date().toLocaleDateString('pt-BR') });
      setShowReceiptPreview(true);
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeReceipt = () => {
    setShowReceiptPreview(false);
    setCart([]);
    setCustomerInfo({ name: '', email: '', phone: '', doc: '' });
    setNotes('');
    setSavedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Novo Orçamento / Venda (PDV)</h1>
          <p className="text-sm text-gray-500 mt-1">Crie pedidos ou orçamentos internos com produtos da loja ou adicione produtos personalizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar produto ou SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Cadastrar Produto Avulso
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => addToCart(product)}>
                <div className="h-32 bg-gray-100 relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {product.hidden && (
                    <span className="absolute top-2 right-2 bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Oculto</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2" title={product.name}>{product.name}</h3>
                  <div className="mt-2 text-sm font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500 text-sm">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart / Order Details */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit sticky top-6 space-y-6">
          <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-3">
            <ShoppingCart size={20} className="text-[var(--color-primary)]" />
            <h2>Resumo do Pedido</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">O carrinho está vazio</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {item.isCustom && item.image ? (
                      <div className="w-12 h-12 shrink-0 bg-white border border-gray-200 rounded overflow-hidden">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-2">
                      <h4 className="text-xs font-semibold text-gray-800 leading-tight">{item.name}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-12 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[var(--color-primary)] text-center"
                          />
                        </div>
                        {item.isCustom ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">R$</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateCartItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              className="w-16 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[var(--color-primary)] text-right"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors self-start mt-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-lg">
              <span className="font-bold text-gray-700">Total</span>
              <span className="font-black text-[var(--color-primary)]">{formatPrice(total)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5"><User size={16} /> Cliente</h3>
            <input
              type="text"
              placeholder="Nome do Cliente *"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
              />
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <textarea
              placeholder="Observações do pedido/orçamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] min-h-[60px] resize-y"
            />
          </div>

          <div className="flex gap-3 pt-2">
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
          </div>
        </div>
      </div>

      {/* Modal Novo Item Avulso */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative border border-gray-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowCustomModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus size={24} className="text-[var(--color-primary)]" />
              Produto Personalizado
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Nome do Produto *</label>
                <input
                  type="text"
                  value={customItem.name}
                  onChange={e => setCustomItem({...customItem, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  placeholder="Ex: Caneca Mágica Especial"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Preço (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customItem.price}
                    onChange={e => setCustomItem({...customItem, price: parseFloat(e.target.value) || 0})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Quantidade</label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={e => setCustomItem({...customItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">URL da Imagem (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customItem.image}
                    onChange={e => setCustomItem({...customItem, image: convertGoogleDriveUrl(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                    placeholder="Cole o link da imagem (Google Drive, etc)"
                  />
                </div>
                {customItem.image && (
                  <div className="mt-3 w-20 h-20 rounded border border-gray-200 overflow-hidden bg-white">
                    <img src={customItem.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }} />
                  </div>
                )}
              </div>
              
              <button
                onClick={handleAddCustomItem}
                className="w-full mt-4 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-colors shadow-sm"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && savedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-0">
          <style>{\`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt-area, #printable-receipt-area * {
                visibility: visible !important;
              }
              #printable-receipt-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          \`}</style>
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative border border-gray-200 shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:p-0 print:w-full print:h-auto print:static">
            
            {/* Header hidden on print */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0 print:hidden">
              <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <FileText className={savedOrder.status === 'Orçamento' ? "text-purple-600" : "text-green-600"} size={20} /> 
                {savedOrder.status === 'Orçamento' ? 'Orçamento' : 'Recibo'} #{savedOrder.id.substring(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={closeReceipt} 
                  className="text-gray-400 hover:text-gray-900 p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  title="Fechar e Novo Pedido"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Content */}
            <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0">
              <div id="printable-receipt-area" className="bg-white p-6 rounded-xl border border-gray-100 text-gray-800 min-h-[500px] print:border-none print:p-0">
                
                {/* Store Header with Logo */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                  <div>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain mb-2" referrerPolicy="no-referrer" />
                    ) : (
                      <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase mb-2">
                        {settings.storeName || 'Minha Loja'}
                      </h2>
                    )}
                    {settings.whatsappNumber && <p className="text-xs text-gray-600 font-medium">WhatsApp: {settings.whatsappNumber}</p>}
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-gray-300 mb-1">
                      {savedOrder.status === 'Orçamento' ? 'ORÇAMENTO' : 'RECIBO'}
                    </h1>
                    <p className="text-xs"><strong>Data:</strong> {savedOrder.displayDate}</p>
                    <p className="text-xs"><strong>{savedOrder.status === 'Orçamento' ? 'Ref ID' : 'Pedido ID'}:</strong> #{savedOrder.id}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Dados do Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{savedOrder.customer}</p>
                      {savedOrder.phone && <p className="text-sm text-gray-600">{savedOrder.phone}</p>}
                    </div>
                    {savedOrder.email && (
                      <div>
                        <p className="text-sm text-gray-600">{savedOrder.email}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="mb-8">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-800">
                        <th className="py-2 font-bold text-xs uppercase tracking-wider text-gray-900 w-16">Item</th>
                        <th className="py-2 font-bold text-xs uppercase tracking-wider text-gray-900">Descrição</th>
                        <th className="py-2 font-bold text-xs uppercase tracking-wider text-gray-900 text-center w-16">Qtd</th>
                        <th className="py-2 font-bold text-xs uppercase tracking-wider text-gray-900 text-right w-24">V. Unit</th>
                        <th className="py-2 font-bold text-xs uppercase tracking-wider text-gray-900 text-right w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {savedOrder.items.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="py-3">
                            {item.image ? (
                              <div className="w-10 h-10 rounded overflow-hidden border border-gray-200">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                                <ImageIcon size={16} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="py-3 text-sm text-gray-800 font-medium">{item.name}</td>
                          <td className="py-3 text-sm text-gray-800 text-center">{item.quantity}</td>
                          <td className="py-3 text-sm text-gray-800 text-right">{formatPrice(item.price)}</td>
                          <td className="py-3 text-sm text-gray-900 font-bold text-right">{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals & Notes */}
                <div className="flex justify-between items-start pt-6 border-t border-gray-200">
                  <div className="w-1/2 pr-8">
                    {savedOrder.notes && (
                      <div className="bg-yellow-50 p-3 rounded border border-yellow-100">
                        <h4 className="text-xs font-bold text-yellow-800 uppercase mb-1">Observações</h4>
                        <p className="text-xs text-yellow-900 whitespace-pre-wrap">{savedOrder.notes}</p>
                      </div>
                    )}
                    <div className="mt-8 text-[10px] text-gray-400 uppercase tracking-wider">
                      <p>Documento gerado eletronicamente.</p>
                      {savedOrder.status === 'Orçamento' && <p>Orçamento válido por 15 dias.</p>}
                    </div>
                  </div>
                  <div className="w-1/3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Total</span>
                      <span className="text-2xl font-black text-gray-900 tracking-tight">{formatPrice(savedOrder.total)}</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('src/admin/views/Pos.tsx', newCode);
