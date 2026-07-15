import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice } from '../../data/products';
import { Search, XCircle, FileText, Printer, CheckCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

export function Customers() {
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const executeDeleteCustomer = async (customer: any) => {
    try {
      // Find orders to delete
      const customerOrders = orders.filter(o => o.email?.toLowerCase().trim() === customer.email);
      
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      customerOrders.forEach(o => {
        batch.delete(doc(db, 'orders', o.id));
      });
      
      await batch.commit();

      toast.success('Cliente e seus pedidos foram excluídos com sucesso!');
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Ocorreu um erro ao tentar excluir o cliente.');
    }
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList: any[] = [];
      const customerMap = new Map();

      snapshot.docs.forEach(doc => {
        const order = doc.data();
        const id = doc.id;
        const email = order.email?.toLowerCase().trim();

        let formattedDate = 'Data Indisponível';
        if (order.date?.toDate) {
          formattedDate = order.date.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        }

        ordersList.push({
          id,
          ...order,
          dateFormatted: formattedDate,
        });

        if (order.status === 'Cancelado') return; // Ignore cancelled
        if (!email) return;

        if (!customerMap.has(email)) {
          customerMap.set(email, {
            email,
            name: order.customer,
            phone: order.phone,
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: order.date?.toDate ? order.date.toDate() : new Date(0)
          });
        }
        const c = customerMap.get(email);
        c.totalSpent += (order.total || 0);
        c.orderCount += 1;
        const orderDate = order.date?.toDate ? order.date.toDate() : new Date(0);
        if (orderDate > c.lastOrderDate) {
          c.lastOrderDate = orderDate;
          c.name = order.customer; // update name to latest
          c.phone = order.phone;
        }
      });
      
      setOrders(ordersList);
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    }, (e) => { console.warn("Firestore snapshot warning:", e.message); });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setShowDeleteConfirm(false);
  }, [selectedCustomer]);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Clientes (CRM)</h2>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-gray-900 w-full placeholder-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold text-center">Pedidos</th>
                <th className="p-4 font-bold text-right">Total Gasto</th>
                <th className="p-4 font-bold text-right">Última Compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c, i) => (
                <tr 
                  key={i} 
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-pink-50/10 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{c.phone}</td>
                  <td className="p-4 text-sm font-bold text-center">
                    <span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{c.orderCount}</span>
                  </td>
                  <td className="p-4 text-sm font-bold text-[var(--color-primary)] text-right">{formatPrice(c.totalSpent)}</td>
                  <td className="p-4 text-sm text-gray-500 text-right">{c.lastOrderDate.toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 text-gray-900">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">
                  Histórico de Pedidos
                </h3>
                <p className="text-sm text-gray-500">{selectedCustomer.name} ({selectedCustomer.email})</p>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="text-gray-400 hover:text-gray-900"
              >
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {orders
                .filter(o => o.email?.toLowerCase().trim() === selectedCustomer.email)
                .map((order, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-mono text-[var(--color-primary)] font-bold"># {order.id}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{order.dateFormatted}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          order.status === 'Pendente' ? 'bg-yellow-100 text-yellow-600' :
                          order.status === 'Pago' ? 'bg-blue-100 text-blue-600' :
                          order.status === 'Enviado' ? 'bg-green-100 text-green-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {order.status}
                        </span>
                        <p className="text-sm font-bold text-gray-900 mt-1">{formatPrice(order.total)}</p>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-2.5">
                      <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">Itens comprados</p>
                      <div className="space-y-1.5">
                        {order.items?.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs text-gray-700">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                      {order.trackingCode && (
                        <div className="flex-1 bg-white border border-gray-100 p-2 rounded-lg text-xs flex justify-between items-center min-w-[120px]">
                          <span className="text-gray-500">Rastreio:</span>
                          <span className="font-mono font-bold text-gray-700">{order.trackingCode}</span>
                        </div>
                      )}
                      {(order.receipt || order.status === 'Enviado') && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(order)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-xs font-bold text-green-700 transition-colors"
                        >
                          <FileText size={14} /> Ver Recibo
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <div className="pt-4 border-t border-gray-100 shrink-0 mt-4">
              {showDeleteConfirm ? (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-red-800 uppercase tracking-wider flex items-center gap-1.5">
                    ⚠️ Atenção: Confirmar Exclusão
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Deseja realmente excluir o cliente <strong>"{selectedCustomer.name}"</strong>? Isso apagará permanentemente todos os <strong>{selectedCustomer.orderCount}</strong> pedidos vinculados ao e-mail <strong>{selectedCustomer.email}</strong>. Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex gap-2.5 justify-end">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDeleteCustomer(selectedCustomer)}
                      className="px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Sim, Excluir Tudo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-xl flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 size={14} /> Excluir Cliente
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="px-6 py-2 text-sm font-bold uppercase tracking-wider bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition-all"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedReceiptOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-0 text-gray-900">
          <style>{`
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
          `}</style>
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative border border-gray-200 shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:p-0 print:w-full print:h-auto print:static">
            
            {/* Header hidden on print */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0 print:hidden">
              <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <FileText className="text-green-600" size={20} /> Recibo do Pedido #{selectedReceiptOrder.id.substring(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => setSelectedReceiptOrder(null)} 
                  className="text-gray-400 hover:text-gray-900 p-1"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Content */}
            <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0">
              <div id="printable-receipt-area" className="bg-white p-6 rounded-xl border border-gray-100 text-gray-800 min-h-[500px] print:border-none print:p-0">
                
                {/* Store Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                  <div>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl || undefined} alt="Logo" className="h-14 object-contain mb-2" />
                    ) : (
                      <h2 className="text-xl font-black text-pink-600 tracking-tighter uppercase mb-2">
                        {settings.storeName || 'Minha Loja'}
                      </h2>
                    )}
                    {settings.whatsappNumber && <p className="text-xs text-gray-600 font-medium">WhatsApp: {settings.whatsappNumber}</p>}
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl font-black uppercase tracking-widest text-gray-300 mb-1">
                      Recibo
                    </h1>
                    <p className="text-xs"><strong>Data:</strong> {selectedReceiptOrder.receipt?.date || selectedReceiptOrder.dateFormatted || new Date().toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs"><strong>Pedido ID:</strong> #{selectedReceiptOrder.id}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border-b print:border-gray-200 print:rounded-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cliente:</h3>
                  <p className="text-base font-bold text-gray-900">{selectedReceiptOrder.receipt?.customerName || selectedReceiptOrder.customer}</p>
                  {(selectedReceiptOrder.receipt?.customerDoc || selectedReceiptOrder.shippingInfo?.cpf) && (
                    <p className="text-xs text-gray-600 mt-1 font-medium">CPF/CNPJ: {selectedReceiptOrder.receipt?.customerDoc || selectedReceiptOrder.shippingInfo?.cpf}</p>
                  )}
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-800 text-xs font-bold uppercase tracking-wider text-gray-500">
                        <th className="py-2.5 pl-2">Descrição</th>
                        <th className="py-2.5 text-center w-16">Qtd</th>
                        <th className="py-2.5 text-right w-24">Unit.</th>
                        <th className="py-2.5 text-right pr-2 w-24">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedReceiptOrder.receipt?.items || selectedReceiptOrder.items?.map((i: any) => ({ description: i.name, quantity: i.quantity, unitPrice: i.price })) || []).map((item: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-100 text-sm">
                          <td className="py-2.5 pl-2 font-medium text-gray-900">{item.description}</td>
                          <td className="py-2.5 text-center text-gray-600">{item.quantity}</td>
                          <td className="py-2.5 text-right text-gray-600">{formatPrice(item.unitPrice)}</td>
                          <td className="py-2.5 text-right pr-2 font-bold text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-60 space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal:</span>
                      <span>
                        {formatPrice(
                          (selectedReceiptOrder.receipt?.items || selectedReceiptOrder.items?.map((i: any) => ({ description: i.name, quantity: i.quantity, unitPrice: i.price })) || [])
                            .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
                        )}
                      </span>
                    </div>
                    {(selectedReceiptOrder.receipt?.discount || selectedReceiptOrder.shippingInfo?.couponDiscount) ? (
                      <div className="flex justify-between text-red-500">
                        <span>Desconto:</span>
                        <span>-{formatPrice(selectedReceiptOrder.receipt?.discount || selectedReceiptOrder.shippingInfo?.couponDiscount || 0)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-lg font-black border-t border-gray-800 pt-2 text-gray-900">
                      <span>Total:</span>
                      <span>{formatPrice(selectedReceiptOrder.receipt?.total || selectedReceiptOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-8 text-xs text-gray-500 border-t border-gray-100 pt-4">
                  <p className="font-bold uppercase tracking-wider text-gray-400 mb-1">Observações:</p>
                  <p className="whitespace-pre-line text-gray-600">{selectedReceiptOrder.receipt?.notes || `Recibo gerado automaticamente para o pedido #${selectedReceiptOrder.id} finalizado e enviado.`}</p>
                </div>

                {/* Sign-off */}
                <div className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                  <p>Recebemos o valor acima especificado, referente à prestação de serviços / venda de produtos.</p>
                  <div className="mt-8 flex justify-center">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Assinatura" className="h-16 object-contain opacity-80" />
                    ) : (
                      <div className="h-16"></div>
                    )}
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
