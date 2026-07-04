import React, { useState } from 'react';
import { FileText, Printer, Plus, Trash2 } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../data/products';
import { useProducts } from '../../context/ProductContext';

export function Documents() {
  const { settings } = useSettings();
  const { products } = useProducts();
  const [docType, setDocType] = useState<'receipt' | 'quote'>('quote');

  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState(''); // CPF/CNPJ
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(''); // For quote
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], description: value };
    
    // Auto-fill price if product is found
    const product = products.find(p => p.name === value);
    if (product && newItems[index].unitPrice === 0) {
      newItems[index].unitPrice = product.price;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - discount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Emissor de Documentos</h1>
          <p className="text-gray-500">Crie e imprima recibos e orçamentos para seus clientes.</p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity print:hidden"
        >
          <Printer size={20} />
          Imprimir / Salvar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:w-full">
        {/* Editor (Hidden on Print) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 print:hidden">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Configurações do Documento</h2>
          
          <div className="flex gap-4">
            <label className="flex-1">
              <span className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Tipo de Documento</span>
              <select 
                value={docType} 
                onChange={(e) => setDocType(e.target.value as any)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
              >
                <option value="quote">Orçamento</option>
                <option value="receipt">Recibo de Pagamento</option>
              </select>
            </label>
            <label className="flex-1">
              <span className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Data</span>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)] p-2 border"
              />
            </label>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Dados do Cliente</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Nome / Razão Social" 
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border text-sm"
              />
              <input 
                type="text" 
                placeholder="CPF / CNPJ" 
                value={customerDoc}
                onChange={(e) => setCustomerDoc(e.target.value)}
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Itens</h3>
              <button onClick={addItem} className="text-[var(--color-primary)] text-sm font-bold flex items-center gap-1 hover:underline">
                <Plus size={16} /> Adicionar Item
              </button>
            </div>
            
            <datalist id="registered-products-list">
              {products.map(p => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>

            {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-2 border-b border-gray-100 pb-4 last:border-0 sm:pb-0 sm:border-0 sm:flex-row sm:items-start w-full">
                <input 
                  type="text" 
                  list="registered-products-list"
                  placeholder="Descrição do Produto/Serviço" 
                  value={item.description}
                  onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                  className="flex-1 min-w-0 border-gray-300 rounded-lg shadow-sm p-2 border text-sm"
                />
                <div className="flex gap-2 w-full sm:w-auto shrink-0">
                  <input 
                    type="number" 
                    min="1"
                    placeholder="Qtd" 
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                    className="w-20 flex-1 sm:flex-none border-gray-300 rounded-lg shadow-sm p-2 border text-sm"
                  />
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    placeholder="R$ Unit." 
                    value={item.unitPrice || ''}
                    onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-28 flex-2 sm:flex-none border-gray-300 rounded-lg shadow-sm p-2 border text-sm"
                  />
                  <button 
                    onClick={() => removeItem(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded shrink-0 self-center"
                    disabled={items.length === 1}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label>
              <span className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Desconto (R$)</span>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full border-gray-300 rounded-lg shadow-sm p-2 border"
              />
            </label>
            {docType === 'quote' && (
              <label>
                <span className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Válido até</span>
                <input 
                  type="date" 
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border-gray-300 rounded-lg shadow-sm p-2 border"
                />
              </label>
            )}
          </div>

          <div>
            <span className="block text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Observações</span>
            <textarea 
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border-gray-300 rounded-lg shadow-sm p-2 border resize-none"
              placeholder="Ex: Pagamento em 50% no pedido e 50% na entrega."
            />
          </div>

        </div>

        {/* Preview / Print Area */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0 min-h-[600px] text-gray-800 relative">
          {/* A4 format approx for preview */}
          
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
            <div>
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="h-16 object-contain mb-2" />
              ) : (
                <h2 className="text-2xl font-black text-[var(--color-primary)] tracking-tighter uppercase mb-2">
                  {settings.storeName || 'Minha Loja'}
                </h2>
              )}
              {settings.supportPhone && <p className="text-sm">WhatsApp: {settings.supportPhone}</p>}
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-black uppercase tracking-widest text-gray-300 mb-2">
                {docType === 'quote' ? 'Orçamento' : 'Recibo'}
              </h1>
              <p className="text-sm"><strong>Data:</strong> {date.split('-').reverse().join('/')}</p>
              {docType === 'quote' && validUntil && (
                <p className="text-sm"><strong>Válido até:</strong> {validUntil.split('-').reverse().join('/')}</p>
              )}
            </div>
          </div>

          <div className="mb-8 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border-b print:border-gray-200 print:rounded-none">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Para:</h3>
            <p className="text-lg font-bold">{customerName || 'Nome do Cliente'}</p>
            {customerDoc && <p className="text-sm text-gray-600">CPF/CNPJ: {customerDoc}</p>}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full mb-8 text-left border-collapse min-w-[450px] print:min-w-0">
              <thead>
                <tr className="border-b-2 border-gray-800 text-sm font-bold uppercase tracking-wider text-gray-500">
                  <th className="py-3 pl-2">Descrição</th>
                  <th className="py-3 text-center">Qtd</th>
                  <th className="py-3 text-right">Unit.</th>
                  <th className="py-3 text-right pr-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  item.description || item.unitPrice > 0 ? (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="py-3 pl-2">{item.description}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">{formatPrice(item.unitPrice)}</td>
                      <td className="py-3 text-right pr-2 font-medium">{formatPrice(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ) : null
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Desconto:</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-black border-t-2 border-gray-800 pt-2">
                <span>Total:</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {notes && (
            <div className="mt-12 text-sm text-gray-600">
              <p className="font-bold uppercase tracking-wider mb-1">Observações:</p>
              <p className="whitespace-pre-line">{notes}</p>
            </div>
          )}

          {docType === 'receipt' && (
            <div className="mt-20 pt-8 border-t border-gray-300 text-center text-sm text-gray-500">
              <p>Recebemos o valor acima especificado, referente à prestação de serviços / venda de produtos.</p>
              <div className="mt-16 border-t border-gray-800 w-64 mx-auto pt-2 font-bold text-gray-800">
                Assinatura
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
