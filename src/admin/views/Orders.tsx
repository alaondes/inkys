import React, { useState, useEffect } from 'react';
import { Eye, Truck, CheckCircle, Clock, XCircle, Search, ExternalLink } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';

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

  const handleUpdateStatus = async (id: string, newStatus: OrderStatus) => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { status: newStatus });
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleUpdateTracking = async (id: string, tracking: string) => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { trackingCode: tracking });
    } catch (error) {
      console.error('Error updating tracking code:', error);
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { notes });
    } catch (error) {
      console.error('Error updating notes:', error);
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
          <table className="w-full text-left border-collapse">
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
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig[order.status].bg} ${statusConfig[order.status].color}`}>
                        <StatusIcon size={12} /> {order.status}
                      </span>
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
              <div className="grid grid-cols-2 gap-6">
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

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Gerenciar Pedido</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Pendente', 'Pago', 'Enviado', 'Cancelado'] as OrderStatus[]).map(status => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                          className={`text-xs px-3 py-2 rounded-lg font-bold border transition-all ${
                            selectedOrder.status === status
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
                        value={selectedOrder.trackingCode || ''}
                        onChange={(e) => handleUpdateTracking(selectedOrder.id, e.target.value)}
                        placeholder="Ex: BR123456789BR"
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1 pt-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Anotações Internas (Visível apenas para você)</label>
                  <textarea 
                    value={selectedOrder.notes || ''}
                    onChange={(e) => {
                      setSelectedOrder({...selectedOrder, notes: e.target.value});
                    }}
                    onBlur={(e) => handleUpdateNotes(selectedOrder.id, e.target.value)}
                    placeholder="Ex: Cliente pediu para embalar para presente..."
                    className="w-full bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm focus:border-yellow-400 outline-none resize-y min-h-[80px] text-gray-800 placeholder-yellow-600/50"
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
