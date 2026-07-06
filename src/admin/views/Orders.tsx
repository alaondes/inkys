import React, { useState, useEffect } from 'react';
import { Eye, Truck, CheckCircle, Clock, XCircle, Search, ExternalLink, FileText, Printer } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';

type OrderStatus = 'Pendente' | 'Pago' | 'Enviado' | 'Cancelado';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  fileUrl?: string;
}

interface Order {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  date: string;
  total: number;
  status: OrderStatus;
  trackingCode?: string;
  items: OrderItem[];
  shippingInfo?: any;
  notes?: string;
  receipt?: {
    date: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    discount: number;
    total: number;
    notes: string;
    customerName: string;
    customerDoc: string;
  };
}

const statusConfig = {
  'Pendente': { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  'Pago': { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
  'Enviado': { icon: Truck, color: 'text-green-600', bg: 'bg-green-100' },
  'Cancelado': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'Todos'>('Todos');
  const [dateFilter, setDateFilter] = useState<'Todos' | 'Hoje' | 'EstaSemana' | 'EsteMes'>('Todos');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const { settings } = useSettings();

  const [localStatus, setLocalStatus] = useState<OrderStatus>('Pendente');
  const [localTracking, setLocalTracking] = useState('');
  const [localNotes, setLocalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedOrder) {
      setLocalStatus(selectedOrder.status);
      setLocalTracking(selectedOrder.trackingCode || '');
      setLocalNotes(selectedOrder.notes || '');
    } else {
      setLocalStatus('Pendente');
      setLocalTracking('');
      setLocalNotes('');
    }
  }, [selectedOrder?.id]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = 'Data Indisponível';
        if (data.date?.toDate) {
          formattedDate = data.date.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        }
        return {
          id: doc.id,
          customer: data.customer || 'Cliente não identificado',
          date: formattedDate,
          total: data.total || 0,
          status: data.status || 'Pendente',
          trackingCode: data.trackingCode,
          items: data.items || [],
          shippingInfo: data.shippingInfo || null,
          notes: data.notes || '',
          receipt: data.receipt || null,
          _rawDate: data.date?.toDate ? data.date.toDate() : new Date(0) // Internal use for filtering
        } as Order & { _rawDate: Date };
      });
      setOrders(ordersData);
      
      // Update selected order if it's currently open
      if (selectedOrder) {
        const updated = ordersData.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    });

    return () => unsubscribe();
  }, [selectedOrder?.id]);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || 
      o.customer.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todos' || o.status === statusFilter;

    let matchesDate = true;
    if (dateFilter !== 'Todos') {
      const orderDate = (o as any)._rawDate;
      const now = new Date();
      if (dateFilter === 'Hoje') {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'EstaSemana') {
        const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        matchesDate = orderDate >= firstDayOfWeek;
      } else if (dateFilter === 'EsteMes') {
        matchesDate = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return alert('Nenhum pedido para exportar.');
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Cliente,Data,Status,Total,Rastreio\n";

    filteredOrders.forEach(o => {
      const row = [
        o.id,
        `"${o.customer}"`,
        `"${o.date}"`,
        o.status,
        o.total,
        o.trackingCode || ''
      ].join(",");
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "pedidos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSave = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const orderRef = doc(db, 'orders', selectedOrder.id);
      
      const updateData: any = {
        status: localStatus,
        trackingCode: localTracking,
        notes: localNotes
      };

      // Se o status for alterado para "Enviado", cria/atualiza o recibo automaticamente no pedido
      if (localStatus === 'Enviado') {
        updateData.receipt = {
          date: new Date().toLocaleDateString('pt-BR'),
          items: selectedOrder.items.map(item => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          discount: selectedOrder.shippingInfo?.couponDiscount || 0,
          total: selectedOrder.total,
          notes: `Recibo gerado automaticamente para o pedido #${selectedOrder.id} finalizado e enviado.`,
          customerName: selectedOrder.customer,
          customerDoc: selectedOrder.shippingInfo?.cpf || ''
        };
      }

      await updateDoc(orderRef, updateData);
      toast.success('Pedido salvo com sucesso!');
      if (localStatus === 'Enviado') {
        toast.success('Recibo gerado e anexado ao pedido!');
      }
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Erro ao salvar o pedido');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Pedidos</h2>
        <button onClick={handleExportCSV} className="text-sm font-bold uppercase tracking-wider bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          Exportar Excel (CSV)
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2">
          <Search className="text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por código ou cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-gray-900 w-full placeholder-gray-400"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'Todos')}
            className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 outline-none focus:border-[var(--color-primary)] flex-1 sm:w-40"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendentes</option>
            <option value="Pago">Pagos</option>
            <option value="Enviado">Enviados</option>
            <option value="Cancelado">Cancelados</option>
          </select>
          
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 outline-none focus:border-[var(--color-primary)] flex-1 sm:w-40"
          >
            <option value="Todos">Qualquer Data</option>
            <option value="Hoje">Hoje</option>
            <option value="EstaSemana">Esta Semana</option>
            <option value="EsteMes">Este Mês</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Pedido</th>
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Data</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold text-right">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredOrders.map(order => {
                const StatusIcon = statusConfig[order.status].icon;
                return (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-mono text-sm text-[var(--color-primary)]">{order.id}</td>
                    <td className="p-4 text-sm text-gray-900">{order.customer}</td>
                    <td className="p-4 text-sm text-gray-500">{order.date}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                          <StatusIcon size={12} /> {order.status}
                        </span>
                        {(order.receipt || order.status === 'Enviado') && (
                          <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5" title="Recibo disponível">
                            <FileText size={10} /> Recibo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-900">{formatPrice(order.total)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => setSelectedOrder(order)} className="text-gray-400 hover:text-cyan-600 p-2 transition-colors inline-block" title="Ver Detalhes">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">Nenhum pedido encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3 text-gray-900">
                Pedido <span className="text-[var(--color-primary)]">{selectedOrder.id}</span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900"><XCircle size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-gray-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Cliente</p>
                  <p className="text-sm font-medium">{selectedOrder.customer}</p>
                  {selectedOrder.email && <p className="text-sm text-gray-600">{selectedOrder.email}</p>}
                  {selectedOrder.phone && <p className="text-sm text-gray-600">{selectedOrder.phone}</p>}
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Data do Pedido</p>
                  <p className="text-sm">{selectedOrder.date}</p>
                </div>
              </div>

              {selectedOrder.shippingInfo && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Endereço de Entrega</p>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                    <p>{selectedOrder.shippingInfo.street}, {selectedOrder.shippingInfo.number} {selectedOrder.shippingInfo.complement && `- ${selectedOrder.shippingInfo.complement}`}</p>
                    <p>{selectedOrder.shippingInfo.neighborhood} - {selectedOrder.shippingInfo.city}/{selectedOrder.shippingInfo.state}</p>
                    <p>CEP: {selectedOrder.shippingInfo.zipCode}</p>
                    {selectedOrder.shippingInfo.cpf && <p className="mt-2 text-gray-600">CPF: {selectedOrder.shippingInfo.cpf}</p>}
                    <p className="mt-2 font-bold text-[var(--color-primary)]">Frete: {selectedOrder.shippingInfo.shippingType === 'sedex' ? 'Sedex' : 'PAC'} ({formatPrice(selectedOrder.shippingInfo.shippingCost || 0)})</p>
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Itens do Pedido</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <span className="bg-white border border-gray-200 text-xs px-2 py-1 rounded font-bold">{item.quantity}x</span>
                        <span className="text-sm text-gray-900">{item.name}</span>
                      </div>
                      <span className="font-bold text-sm text-[var(--color-primary)]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    {item.fileUrl && (
                      <a 
                        href={item.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1 mt-1 w-fit"
                      >
                        <ExternalLink size={12} /> Ver arte enviada
                      </a>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[var(--color-primary)]">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {(selectedOrder.receipt || localStatus === 'Enviado') ? (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">Recibo do Pedido</p>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-green-800 flex items-center gap-1.5">
                        <CheckCircle size={16} className="text-green-600" /> Recibo disponível
                      </p>
                      <p className="text-xs text-green-600">
                        {selectedOrder.receipt 
                          ? `Armazenado neste pedido em ${selectedOrder.receipt.date}` 
                          : 'Pronto para visualizar (será salvo automaticamente ao salvar o pedido como "Enviado")'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReceiptPreview(true)}
                      className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors shadow-sm"
                    >
                      <FileText size={14} /> Ver Recibo
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Gerenciar Pedido</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Pendente', 'Pago', 'Enviado', 'Cancelado'] as OrderStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => setLocalStatus(status)}
                          className={`text-xs px-3 py-2 rounded-lg font-bold border transition-all ${
                            localStatus === status
                              ? `border-${statusConfig[status].color.split('-')[1]}-500 text-${statusConfig[status].color.split('-')[1]}-600 bg-${statusConfig[status].color.split('-')[1]}-50`
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Código de Rastreio</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={localTracking}
                        onChange={(e) => setLocalTracking(e.target.value)}
                        placeholder="Ex: BR123456789BR"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Anotações Internas (Visível apenas para você)</label>
                  <textarea 
                    value={localNotes}
                    onChange={(e) => setLocalNotes(e.target.value)}
                    placeholder="Ex: Cliente pediu para embalar para presente..."
                    className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm focus:border-yellow-400 outline-none resize-y min-h-[80px] text-gray-800 placeholder-yellow-600/50"
                  />
                </div>
              </div>

            </div>

            {/* Footer with Save/Cancel Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0 mt-4">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-500 hover:text-gray-900 transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-bold uppercase tracking-wider bg-gray-950 text-white rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? 'Salvando...' : 'Salvar e Sair'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceiptPreview && selectedOrder && (selectedOrder.receipt || localStatus === 'Enviado') && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-0">
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
                <FileText className="text-green-600" size={20} /> Recibo do Pedido #{selectedOrder.id.substring(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir / PDF
                </button>
                <button 
                  onClick={() => setShowReceiptPreview(false)} 
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
                    <p className="text-xs"><strong>Data:</strong> {selectedOrder.receipt?.date || new Date().toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs"><strong>Pedido ID:</strong> #{selectedOrder.id}</p>
                  </div>
                </div>

                {/* Client Info */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg print:bg-transparent print:p-0 print:border-b print:border-gray-200 print:rounded-none">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cliente:</h3>
                  <p className="text-base font-bold text-gray-900">{selectedOrder.receipt?.customerName || selectedOrder.customer}</p>
                  {(selectedOrder.receipt?.customerDoc || selectedOrder.shippingInfo?.cpf) && (
                    <p className="text-xs text-gray-600 mt-1 font-medium">CPF/CNPJ: {selectedOrder.receipt?.customerDoc || selectedOrder.shippingInfo?.cpf}</p>
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
                      {(selectedOrder.receipt?.items || selectedOrder.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.price }))).map((item: any, idx: number) => (
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
                          (selectedOrder.receipt?.items || selectedOrder.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.price })))
                            .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
                        )}
                      </span>
                    </div>
                    {(selectedOrder.receipt?.discount || selectedOrder.shippingInfo?.couponDiscount) ? (
                      <div className="flex justify-between text-red-500">
                        <span>Desconto:</span>
                        <span>-{formatPrice(selectedOrder.receipt?.discount || selectedOrder.shippingInfo?.couponDiscount || 0)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-lg font-black border-t border-gray-800 pt-2 text-gray-900">
                      <span>Total:</span>
                      <span>{formatPrice(selectedOrder.receipt?.total || selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-8 text-xs text-gray-500 border-t border-gray-100 pt-4">
                  <p className="font-bold uppercase tracking-wider text-gray-400 mb-1">Observações:</p>
                  <p className="whitespace-pre-line text-gray-600">{selectedOrder.receipt?.notes || `Recibo gerado automaticamente para o pedido #${selectedOrder.id} finalizado e enviado.`}</p>
                </div>

                {/* Sign-off */}
                <div className="mt-16 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
                  <p>Recebemos o valor acima especificado, referente à prestação de serviços / venda de produtos.</p>
                  <div className="mt-12 border-t border-gray-800 w-48 mx-auto pt-1.5 font-bold text-gray-800">
                    Assinatura
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
