import React, { useState } from 'react';
import { Eye, Truck, CheckCircle, Clock, XCircle, Search } from 'lucide-react';
import { formatPrice } from '../../data/products';

type OrderStatus = 'Pendente' | 'Pago' | 'Enviado' | 'Cancelado';

interface Order {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: OrderStatus;
  trackingCode?: string;
  items: { name: string; quantity: number; price: number }[];
}

const MOCK_ORDERS: Order[] = [
  { id: 'ORD-001', customer: 'João Silva', date: '21 Mai 2026', total: 79.80, status: 'Pendente', items: [{ name: 'Caneca de Vidro Jatiado', quantity: 2, price: 39.90 }] },
  { id: 'ORD-002', customer: 'Maria Souza', date: '20 Mai 2026', total: 45.90, status: 'Pago', items: [{ name: 'Caneca Fosca Premium', quantity: 1, price: 45.90 }] },
  { id: 'ORD-003', customer: 'Carlos Andrade', date: '19 Mai 2026', total: 119.80, status: 'Enviado', trackingCode: 'BR123456789BR', items: [{ name: 'Kit 2 Copos Neon', quantity: 2, price: 59.90 }] },
  { id: 'ORD-004', customer: 'Ana Paula', date: '18 Mai 2026', total: 33.90, status: 'Cancelado', items: [{ name: 'Caneca em Porcelana Branca', quantity: 1, price: 33.90 }] },
];

const statusConfig = {
  'Pendente': { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  'Pago': { icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  'Enviado': { icon: Truck, color: 'text-green-400', bg: 'bg-green-400/10' },
  'Cancelado': { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

export function Orders() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(search.toLowerCase()) || 
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpdateStatus = (id: string, newStatus: OrderStatus) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const handleUpdateTracking = (id: string, tracking: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, trackingCode: tracking } : o));
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, trackingCode: tracking });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Pedidos</h2>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por código do pedido ou cliente..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-gray-900 w-full placeholder-gray-400"
        />
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
                  <p className="text-sm">{selectedOrder.customer}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Data do Pedido</p>
                  <p className="text-sm">{selectedOrder.date}</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Itens do Pedido</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div className="flex gap-3 items-center">
                      <span className="bg-white border border-gray-200 text-xs px-2 py-1 rounded font-bold">{item.quantity}x</span>
                      <span className="text-sm text-gray-900">{item.name}</span>
                    </div>
                    <span className="font-bold text-sm text-[var(--color-primary)]">{formatPrice(item.price * item.quantity)}</span>
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
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
