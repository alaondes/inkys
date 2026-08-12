import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import React, { useState, useEffect } from 'react';
import { Eye, Truck, CheckCircle, Clock, XCircle, Search, ExternalLink, FileText, Printer, User, Calendar, MapPin, Trash2, ClipboardList, MessageCircle, Download, Edit2, CreditCard, LayoutGrid, List } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useSettings } from '../../context/SettingsContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { syncOrderToAccounting } from '../utils/accountingSync';
import { KanbanBoard } from '../components/KanbanBoard';

type OrderStatus = 'Pendente' | 'Pago' | 'Enviado' | 'Cancelado' | 'Orçamento';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  fileUrl?: string;
  image?: string;
  selectedColor?: string;
  selectedSize?: string;
  customText?: string;
  customMusic?: string;
  customImage?: string;
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
  subtotal?: number;
  discount?: number;
  shippingMode?: string;
  shippingCost?: number;
  paymentPolicy?: string;
  paymentMethod?: string;
  paymentConditions?: string;
  installments?: number;
  downPayment?: number;
  doc?: string;
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
  'Orçamento': { icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-100' },
};

interface OrdersProps {
  initialMode?: 'kanban' | 'table';
}

export function Orders({ initialMode }: OrdersProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  
  const getInitialViewMode = () => {
    if (initialMode) return initialMode;
    return location.pathname === '/admin/production' ? 'kanban' : 'table';
  };

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>(getInitialViewMode);

  useEffect(() => {
    if (initialMode) {
      setViewMode(initialMode);
    } else if (location.pathname === '/admin/production') {
      setViewMode('kanban');
    } else if (location.pathname === '/admin/orders') {
      setViewMode('table');
    }
  }, [location.pathname, initialMode]);
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
          email: data.email || data.shippingInfo?.email || data.celular || data.shippingInfo?.celular || '',
          phone: data.phone || data.celular || data.shippingInfo?.phone || data.shippingInfo?.celular || '',
          date: formattedDate,
          total: data.total || 0,
          status: data.status || 'Pendente',
          trackingCode: data.trackingCode,
          items: data.items || [],
          shippingInfo: data.shippingInfo || null,
          notes: data.notes || '',
          receipt: data.receipt || null,
          subtotal: data.subtotal,
          discount: data.discount,
          shippingMode: data.shippingMode,
          shippingCost: data.shippingCost,
          paymentPolicy: data.paymentPolicy,
          paymentMethod: data.paymentMethod,
          paymentConditions: data.paymentConditions,
          installments: data.installments,
          downPayment: data.downPayment,
          doc: data.doc || '',
          _rawDate: data.date?.toDate ? data.date.toDate() : new Date(0) // Internal use for filtering
        } as Order & { _rawDate: Date };
      });
      setOrders(ordersData);
      
      // Update selected order if it's currently open
      if (selectedOrder) {
        const updated = ordersData.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    }, (e) => { console.warn("Firestore snapshot warning:", e.message); });

    return () => unsubscribe();
  }, [selectedOrder?.id]);

  const filteredOrders = orders.filter(o => {
    // Separate Orçamentos (Quotes) from active Production Orders by default
    if (statusFilter === 'Todos' && o.status === 'Orçamento') {
      return false;
    }

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

  const handleDelete = async () => {
    if (!selectedOrder) return;
    if (window.confirm('Tem certeza que deseja excluir permanentemente este pedido? Esta ação não pode ser desfeita.')) {
      try {
        await deleteDoc(doc(db, 'orders', selectedOrder.id));
        toast.success('Pedido excluído com sucesso!');
        setSelectedOrder(null);
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error('Erro ao excluir o pedido');
      }
    }
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

      // Se o status for alterado para "Pago" ou "Enviado", cria/atualiza o recibo automaticamente no pedido
      if (localStatus === 'Pago' || localStatus === 'Enviado') {
        updateData.receipt = {
          date: new Date().toLocaleDateString('pt-BR'),
          items: selectedOrder.items.map(item => ({
            description: item.name,
            quantity: item.quantity,
            unitPrice: item.price
          })),
          discount: selectedOrder.shippingInfo?.couponDiscount || 0,
          total: selectedOrder.total,
          notes: `Recibo gerado automaticamente para o pedido #${selectedOrder.id} (${localStatus}).`,
          customerName: selectedOrder.customer,
          customerDoc: selectedOrder.shippingInfo?.cpf || ''
        };
      }

      await updateDoc(orderRef, updateData).catch(e => console.warn(e));
      
      // Sincronização automática com a Contabilidade (Receita + Baixa de CPV por m²)
      if (localStatus === 'Pago' || localStatus === 'Enviado') {
        syncOrderToAccounting(selectedOrder).then(res => {
          if (res.success) {
            toast.success("Contabilidade atualizada: Receita e CPV (Insumos) lançados!");
          }
        }).catch(err => console.warn("Accounting sync warning:", err));
      }
      
      // Trigger status update email if status changed or if it is pending (reminder)
      if (localStatus !== selectedOrder.status || localStatus === 'Pendente') {
        let statusKey = '';
        if (localStatus === 'Pago') statusKey = 'paid';
        else if (localStatus === 'Enviado') statusKey = 'shipped';
        else if (localStatus === 'Cancelado') statusKey = 'cancelled';
        else if (localStatus === 'Pendente') statusKey = 'pending';
        
        const customerEmail = selectedOrder.email || selectedOrder.shippingInfo?.email || '';
        
        if (statusKey && customerEmail) {
          fetch('/api/email/status-update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              order: {
                id: selectedOrder.id,
                customer: selectedOrder.customer,
                total: selectedOrder.total
              },
              customerEmail,
              status: statusKey,
              trackingCode: localTracking
            }),
          }).catch(err => console.error("Error triggering status update email:", err));
        }
      }

      toast.success('Pedido salvo com sucesso!');
      if (localStatus === 'Pago' || localStatus === 'Enviado') {
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

  const handleDownloadPDF = async () => {
    if (!selectedOrder) return;
    const element = document.getElementById('printable-receipt-area');
    if (!element) {
      toast.error("Erro: Área de impressão não encontrada.");
      return;
    }
    
    // Temporarily set a fixed width to ensure the PDF layout is correctly proportioned
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalHeight = element.style.height;
    
    element.style.width = '800px';
    element.style.minWidth = '800px';
    element.style.maxWidth = '800px';
    element.style.height = 'max-content';
    
    // If parent has overflow, it might clip. Temporarily change parent overflow
    const parent = element.parentElement;
    const originalParentOverflow = parent ? parent.style.overflow : '';
    if (parent) {
      parent.style.overflow = 'visible';
    }
    
    const loadingToast = toast.loading("Gerando PDF...");
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const opt = {
        margin:       10,
        filename:     `${selectedOrder.status === 'Orçamento' ? 'orcamento' : 'recibo'}-${selectedOrder.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, windowWidth: 800, width: 800, scrollY: 0, scrollX: 0 },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().from(element).set(opt).save();
      
      toast.success("PDF gerado com sucesso!", { id: loadingToast });
    } catch (e: any) {
      console.error("Failed to generate PDF", e);
      if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
        toast.error("Nova versão detectada. Atualizando a página...", { id: loadingToast });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(`Erro ao gerar PDF: ${e.message || 'Erro desconhecido'}`, { id: loadingToast });
      }
    } finally {
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.height = originalHeight;
      if (parent) {
        parent.style.overflow = originalParentOverflow;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
            {viewMode === 'kanban' ? 'Fila de Impressão (Kanban)' : 'Pedidos Ativos & Vendas'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {viewMode === 'kanban' 
              ? 'Acompanhe e mova os trabalhos de impressão pelas etapas da produção gráfica.'
              : 'Gerencie todos os pedidos de venda, consulte status e emita recibos de faturamento.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid size={15} /> Fila Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List size={15} /> Tabela
            </button>
          </div>

          <button onClick={() => navigate('/admin/quotes')} className="text-xs font-black uppercase tracking-wider bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 px-4 py-2.5 rounded-2xl transition-colors shadow-xs flex items-center gap-1.5">
            <FileText size={15} /> Ver Orçamentos
          </button>

          <button onClick={handleExportCSV} className="text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-2xl transition-colors shadow-sm">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por código de pedido ou nome do cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-900 text-xs font-semibold w-full placeholder-slate-400"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'Todos')}
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 flex-1 sm:w-40"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Pendente">Pendentes</option>
            <option value="Pago">Pagos</option>
            <option value="Enviado">Enviados</option>
            <option value="Cancelado">Cancelados</option>
            <option value="Orçamento">Orçamentos</option>
          </select>
          
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 flex-1 sm:w-40"
          >
            <option value="Todos">Qualquer Data</option>
            <option value="Hoje">Hoje</option>
            <option value="EstaSemana">Esta Semana</option>
            <option value="EsteMes">Este Mês</option>
          </select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <KanbanBoard orders={filteredOrders} />
      ) : (
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
                        {(order.receipt || order.status === 'Pago' || order.status === 'Enviado') && (
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
      )}

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-6 relative border border-gray-200 shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-bold uppercase tracking-wider flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-gray-800">
                PEDIDO 
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-sm tracking-widest font-mono border border-gray-200">
                  {selectedOrder.id}
                </span>
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-900"><XCircle size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-gray-900">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="text-gray-400" size={16} />
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Cliente</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-2">{selectedOrder.customer}</p>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Email:</span> {selectedOrder.email || <span className="text-gray-400 italic">Não informado</span>}</p>
                    <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Celular:</span> {selectedOrder.phone || <span className="text-gray-400 italic">Não informado</span>}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="text-gray-400" size={16} />
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Data do Pedido</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{selectedOrder.date}</p>
                </div>
              </div>

              {selectedOrder.shippingInfo && (
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[var(--color-primary)]"></div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="text-[var(--color-primary)]" size={18} />
                    <p className="text-xs uppercase font-bold text-gray-700 tracking-wider">Endereço de Entrega</p>
                  </div>
                  
                  <div className="text-sm text-gray-700 space-y-1.5 pl-1">
                    {selectedOrder.shippingInfo.street ? (
                      <>
                        <p className="font-medium text-gray-900 text-base">{selectedOrder.shippingInfo.street}, {selectedOrder.shippingInfo.number} {selectedOrder.shippingInfo.complement && <span className="text-gray-500 font-normal">- {selectedOrder.shippingInfo.complement}</span>}</p>
                        <p>{selectedOrder.shippingInfo.neighborhood} - {selectedOrder.shippingInfo.city} / {selectedOrder.shippingInfo.state}</p>
                        <p className="text-gray-500 pt-1">CEP: <span className="font-medium text-gray-700">{selectedOrder.shippingInfo.zipCode}</span></p>
                      </>
                    ) : (
                      <p className="whitespace-pre-line leading-relaxed text-gray-800">{selectedOrder.shippingInfo.address}</p>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedOrder.shippingInfo.cpf && (
                        <div>
                          <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">CPF / CNPJ</p>
                          <p className="font-medium">{selectedOrder.shippingInfo.cpf}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5">Frete Selecionado</p>
                        <p className="font-bold text-[var(--color-primary)]">
                          {selectedOrder.shippingInfo.shippingType === 'sedex' ? 'Sedex' : 'PAC'} 
                          <span className="text-gray-600 font-medium ml-1">({formatPrice(selectedOrder.shippingInfo.shippingCost || 0)})</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Itens do Pedido</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex flex-col gap-2 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-start">
                        {item.image && (
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-white border border-gray-200 shrink-0">
                            <img src={convertGoogleDriveUrl(item.image)} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="bg-white border border-gray-200 text-xs px-2 py-0.5 rounded-md font-bold text-gray-700 shadow-sm">{item.quantity}x</span>
                            <span className="text-sm font-bold text-gray-900 leading-tight">{item.name}</span>
                          </div>
                          {item.selectedColor && (
                            <span className="text-xs text-gray-500 mt-1">Cor: <span className="font-semibold text-gray-700">{item.selectedColor}</span></span>
                          )}
                          {item.selectedSize && (
                            <span className="text-xs text-gray-500 mt-1">Tamanho: <span className="font-semibold text-gray-700">{item.selectedSize}</span></span>
                          )}
                        </div>
                      </div>
                      <span className="font-bold text-sm text-[var(--color-primary)]">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    
                    {/* Exibição das Personalizações */}
                    {(item.customText || item.customMusic || item.fileUrl || item.customImage) && (
                      <div className="mt-2 pl-[4.5rem] space-y-2">
                        {item.customText && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 mt-0.5">💬</span>
                            <div>
                              <span className="text-gray-500 font-medium">Texto/Nome:</span>
                              <p className="text-gray-800 font-semibold">{item.customText}</p>
                            </div>
                          </div>
                        )}
                        {item.customMusic && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 mt-0.5">🎵</span>
                            <div>
                              <span className="text-gray-500 font-medium">Link Spotify:</span>
                              <a href={item.customMusic} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline block truncate max-w-[200px] sm:max-w-xs">
                                {item.customMusic}
                              </a>
                            </div>
                          </div>
                        )}
                        {item.customImage && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 mt-0.5">🖼️</span>
                            <div>
                              <span className="text-gray-500 font-medium">Foto Personalizada:</span>
                              <div className="mt-1">
                                <a href={item.customImage} target="_blank" rel="noopener noreferrer">
                                  <img src={convertGoogleDriveUrl(item.customImage)} alt="Foto Personalizada" className="h-16 rounded border border-gray-200 hover:opacity-80 transition-opacity" referrerPolicy="no-referrer" />
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                        {item.fileUrl && !item.customImage && (
                          <div className="flex items-start gap-2 text-xs">
                            <span className="text-gray-400 mt-0.5">📎</span>
                            <a 
                              href={item.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline font-medium flex items-center gap-1"
                            >
                              <ExternalLink size={12} /> Ver arte enviada
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-bold text-lg">
                  <span className="text-gray-900">Total</span>
                  <span className="text-[var(--color-primary)]">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>

              {(selectedOrder.receipt || localStatus === 'Pago' || localStatus === 'Enviado' || localStatus === 'Orçamento') ? (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-[10px] uppercase font-bold text-gray-500 mb-2">{localStatus === 'Orçamento' ? 'Visualizar Orçamento' : 'Recibo do Pedido'}</p>
                  <div className={`${localStatus === 'Orçamento' ? 'bg-purple-50 border-purple-200' : 'bg-green-50 border-green-200'} border p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
                    <div>
                      <p className={`text-sm font-bold ${localStatus === 'Orçamento' ? 'text-purple-800' : 'text-green-800'} flex items-center gap-1.5`}>
                        <CheckCircle size={16} className={localStatus === 'Orçamento' ? 'text-purple-600' : 'text-green-600'} /> {localStatus === 'Orçamento' ? 'Orçamento disponível' : 'Recibo disponível'}
                      </p>
                      <p className={`text-xs ${localStatus === 'Orçamento' ? 'text-purple-600' : 'text-green-600'}`}>
                        {localStatus === 'Orçamento'
                          ? 'Pronto para visualizar ou enviar via WhatsApp'
                          : selectedOrder.receipt 
                            ? `Armazenado neste pedido em ${selectedOrder.receipt.date}` 
                            : 'Pronto para visualizar (será salvo automaticamente ao salvar o pedido como "Enviado")'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          const docUrl = `${window.location.origin}/document/${selectedOrder.id}`;
                          let message = `Olá, *${selectedOrder.customer || ''}*!\n\n`;
                          message += `Aqui está o resumo do seu *${localStatus === 'Orçamento' ? 'ORÇAMENTO' : 'PEDIDO'}* #${selectedOrder.id.substring(0, 8)}:\n\n`;
                          
                          selectedOrder.items.forEach((item) => {
                            message += `• ${item.quantity}x ${item.name}${item.selectedColor ? ' (Cor: ' + item.selectedColor + ')' : ''}${item.selectedSize ? ' (Tam: ' + item.selectedSize + ')' : ''} - ${formatPrice(item.price * item.quantity)}\n`;
                          });
                          
                          message += `\n*SUBTOTAL:* ${formatPrice(selectedOrder.subtotal || selectedOrder.total)}\n`;
                          if (selectedOrder.discount > 0) {
                            message += `*DESCONTO:* -${formatPrice(selectedOrder.discount)}\n`;
                          }
                          if (selectedOrder.shippingMode && selectedOrder.shippingMode !== 'retirada') {
                            message += `*FRETE:* ${selectedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(selectedOrder.shippingCost || 0)}\n`;
                          }
                          message += `*TOTAL:* ${formatPrice(selectedOrder.total)}\n\n`;
                          
                          message += `Você pode visualizar, imprimir ou baixar o documento profissional em PDF com o nosso logotipo, fotos dos produtos e nossa *Política de Pagamento* clicando no link abaixo:\n`;
                          message += `🔗 ${docUrl}\n\n`;
                          
                          if (selectedOrder.notes) {
                            message += `*Observações:*\n${selectedOrder.notes}\n\n`;
                          }
                          
                          message += `Qualquer dúvida, estamos à disposição!`;
                      
                          const encodedMessage = encodeURIComponent(message);
                          const phoneNumber = selectedOrder.phone ? selectedOrder.phone.replace(/\D/g, '') : '';
                          
                          if (phoneNumber) {
                            const prefix = phoneNumber.startsWith('55') || phoneNumber.length > 11 ? '' : '55';
                            window.open(`https://wa.me/${prefix}${phoneNumber}?text=${encodedMessage}`, '_blank');
                          } else {
                            window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                          }
                        }}
                        className="flex-1 sm:flex-none justify-center items-center gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors shadow-sm flex"
                      >
                        <MessageCircle size={14} /> WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReceiptPreview(true)}
                        className={`flex-1 sm:flex-none justify-center items-center gap-1.5 ${localStatus === 'Orçamento' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors shadow-sm flex`}
                      >
                        <FileText size={14} /> Ver {localStatus === 'Orçamento' ? 'Orçamento' : 'Recibo'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="space-y-4 border-t border-gray-100 pt-4">
                <p className="text-[10px] uppercase font-bold text-gray-500">Gerenciar Pedido</p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Status</label>
                    <div className="flex flex-wrap gap-2">
                      {(['Pendente', 'Pago', 'Enviado', 'Cancelado', 'Orçamento'] as OrderStatus[]).map(status => (
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
            <div className="flex justify-between items-center gap-3 pt-4 border-t border-gray-100 shrink-0 mt-4">
              <div className="flex gap-2">
                {selectedOrder.status === 'Cancelado' && (
                  <button
                    onClick={handleDelete}
                    disabled={isSaving}
                    className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir Pedido
                  </button>
                )}
                {selectedOrder.status === 'Orçamento' && (
                  <button
                    onClick={() => {
                      navigate('/admin/pos', { state: { editOrder: selectedOrder } });
                    }}
                    className="px-4 py-2 text-sm font-bold uppercase tracking-wider text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={16} /> Editar Orçamento
                  </button>
                )}
              </div>
              <div className="flex gap-3">
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
        </div>
      )}

      {showReceiptPreview && selectedOrder && (selectedOrder.receipt || localStatus === 'Pago' || localStatus === 'Enviado' || localStatus === 'Orçamento') && (
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
                <FileText className={localStatus === 'Orçamento' ? "text-purple-600" : "text-green-600"} size={20} /> {localStatus === 'Orçamento' ? 'Orçamento' : 'Recibo do Pedido'} #{selectedOrder.id.substring(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const docUrl = `${window.location.origin}/document/${selectedOrder.id}`;
                    let message = `Olá, *${selectedOrder.customer || ''}*!\n\n`;
                    message += `Aqui está o resumo do seu *${localStatus === 'Orçamento' ? 'ORÇAMENTO' : 'PEDIDO'}* #${selectedOrder.id.substring(0, 8)}:\n\n`;
                    
                    selectedOrder.items.forEach((item) => {
                      message += `• ${item.quantity}x ${item.name}${item.selectedColor ? ' (Cor: ' + item.selectedColor + ')' : ''}${item.selectedSize ? ' (Tam: ' + item.selectedSize + ')' : ''} - ${formatPrice(item.price * item.quantity)}\n`;
                    });
                    
                    message += `\n*SUBTOTAL:* ${formatPrice(selectedOrder.subtotal || selectedOrder.total)}\n`;
                    if (selectedOrder.discount > 0) {
                      message += `*DESCONTO:* -${formatPrice(selectedOrder.discount)}\n`;
                    }
                    if (selectedOrder.shippingMode && selectedOrder.shippingMode !== 'retirada') {
                      message += `*FRETE:* ${selectedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(selectedOrder.shippingCost || 0)}\n`;
                    }
                    message += `*TOTAL:* ${formatPrice(selectedOrder.total)}\n\n`;
                    
                    message += `Você pode visualizar, imprimir ou baixar o documento profissional em PDF com o nosso logotipo, fotos dos produtos e nossa *Política de Pagamento* clicando no link abaixo:\n`;
                    message += `🔗 ${docUrl}\n\n`;
                    
                    if (selectedOrder.notes) {
                      message += `*Observações:*\n${selectedOrder.notes}\n\n`;
                    }
                    
                    message += `Qualquer dúvida, estamos à disposição!`;
                
                    const encodedMessage = encodeURIComponent(message);
                    const phoneNumber = selectedOrder.phone ? selectedOrder.phone.replace(/\D/g, '') : '';
                    
                    if (phoneNumber) {
                      const prefix = phoneNumber.startsWith('55') || phoneNumber.length > 11 ? '' : '55';
                      window.open(`https://wa.me/${prefix}${phoneNumber}?text=${encodedMessage}`, '_blank');
                    } else {
                      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Download size={14} /> Baixar PDF
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
              <div id="printable-receipt-area" className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 text-gray-800 min-h-[650px] print:border-none print:p-0 flex flex-col justify-between">
                
                <div className="space-y-6">
                  {/* Store Header */}
                  <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
                    <div>
                      {settings.logoUrl ? (
                        <img src={convertGoogleDriveUrl(settings.logoUrl)} alt="Logo" className="h-16 object-contain mb-2" referrerPolicy="no-referrer" />
                      ) : (
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">
                          {settings.storeName || 'Inkys'}
                        </h2>
                      )}
                      {settings.whatsappNumber && (
                        <p className="text-xs text-gray-500 font-semibold tracking-wide">
                          WhatsApp: {settings.whatsappNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-black uppercase tracking-widest text-gray-300 mb-1">
                        {selectedOrder.status === 'Orçamento' ? 'ORÇAMENTO' : 'RECIBO'}
                      </h1>
                      <p className="text-xs text-gray-600 font-medium">
                        <strong>Data:</strong> {selectedOrder.receipt?.date || new Date().toLocaleDateString('pt-BR')}
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        <strong>Pedido ID:</strong> #{selectedOrder.id}
                      </p>
                    </div>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">CLIENTE:</h3>
                    <p className="text-base font-extrabold text-gray-900">
                      {selectedOrder.receipt?.customerName || selectedOrder.customer}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-gray-600 font-medium">
                      {(selectedOrder.receipt?.customerDoc || selectedOrder.doc || selectedOrder.shippingInfo?.cpf) && (
                        <p><strong>CPF/CNPJ:</strong> {selectedOrder.receipt?.customerDoc || selectedOrder.doc || selectedOrder.shippingInfo?.cpf}</p>
                      )}
                      {selectedOrder.phone && (
                        <p><strong>WhatsApp:</strong> {selectedOrder.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-800 text-xs font-black uppercase tracking-wider text-gray-400">
                          <th className="py-3 pl-2">DESCRIÇÃO</th>
                          <th className="py-3 text-center w-16">QTD</th>
                          <th className="py-3 text-right w-24">UNIT.</th>
                          <th className="py-3 text-right pr-2 w-28">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedOrder.receipt?.items || selectedOrder.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.price, image: i.image || i.customImage }))).map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-gray-100 text-xs">
                            <td className="py-3 pl-2 font-semibold text-gray-900 leading-relaxed">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img 
                                    src={convertGoogleDriveUrl(item.image)} 
                                    alt={item.description} 
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0" 
                                    referrerPolicy="no-referrer" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                    <FileText size={14} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-extrabold text-gray-900">{item.description}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-600 font-semibold">{formatPrice(item.unitPrice)}</td>
                            <td className="py-3 text-right pr-2 font-extrabold text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Notes */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-gray-100">
                    <div className="w-full sm:w-1/2 space-y-4">
                      <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">OBSERVAÇÕES</h4>
                        <p className="text-gray-600 font-medium whitespace-pre-wrap">
                          {selectedOrder.receipt?.notes || selectedOrder.notes || `Recibo gerado automaticamente para o pedido #${selectedOrder.id} finalizado.`}
                        </p>
                      </div>

                    </div>

                    <div className="w-full sm:w-64 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal:</span>
                        <span>
                          {formatPrice(
                            (selectedOrder.receipt?.items || selectedOrder.items.map(i => ({ description: i.name, quantity: i.quantity, unitPrice: i.price })))
                              .reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0)
                          )}
                        </span>
                      </div>
                      {(selectedOrder.receipt?.discount || selectedOrder.discount || selectedOrder.shippingInfo?.couponDiscount) ? (
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Desconto:</span>
                          <span>-{formatPrice(selectedOrder.receipt?.discount || selectedOrder.discount || selectedOrder.shippingInfo?.couponDiscount || 0)}</span>
                        </div>
                      ) : null}
                      {selectedOrder.shippingMode && selectedOrder.shippingMode !== 'retirada' && (
                        <div className="flex justify-between text-gray-500">
                          <span>Frete {selectedOrder.shippingMode === 'gratis' ? '(Grátis)' : ''}:</span>
                          <span>{selectedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(selectedOrder.shippingCost || 0)}</span>
                        </div>
                      )}

                      {selectedOrder.paymentMethod && (
                        <div className="flex justify-between text-gray-700 font-semibold border-t border-dashed border-gray-200 pt-2 mt-2">
                          <span>Forma de Pagamento:</span>
                          <span>
                            {selectedOrder.paymentMethod}
                            {selectedOrder.paymentMethod === 'Cartão de Crédito' && selectedOrder.installments && selectedOrder.installments > 1 ? ` (${selectedOrder.installments}x)` : ''}
                            {(selectedOrder.paymentMethod === 'Pix' || selectedOrder.paymentMethod === 'Dinheiro') && selectedOrder.paymentConditions ? ` - ${selectedOrder.paymentConditions}` : ''}
                          </span>
                        </div>
                      )}

                      {selectedOrder.downPayment && selectedOrder.downPayment > 0 ? (
                        <>
                          <div className="flex justify-between text-green-600 font-semibold pt-1">
                            <span>Entrada:</span>
                            <span>-{formatPrice(selectedOrder.downPayment)}</span>
                          </div>
                          <div className="flex justify-between text-blue-600 font-semibold pt-1">
                            <span>Falta Pagar:</span>
                            <span>{formatPrice((selectedOrder.receipt?.total || selectedOrder.total) - selectedOrder.downPayment)}</span>
                          </div>
                        </>
                      ) : null}

                      <div className="flex justify-between text-lg font-black border-t-2 pt-2 border-gray-800 text-gray-900 mt-2">
                        <span>Total Geral:</span>
                        <span className="text-gray-900">{formatPrice(selectedOrder.receipt?.total || selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.shippingMode && selectedOrder.shippingMode !== 'retirada' && selectedOrder.shippingInfo && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">ENDEREÇO DE ENTREGA:</h3>
                    <p className="text-xs text-gray-700 font-medium whitespace-pre-line">
                      {selectedOrder.shippingInfo.street}, {selectedOrder.shippingInfo.number} {selectedOrder.shippingInfo.complement ? `- ${selectedOrder.shippingInfo.complement}` : ''}
                      <br />
                      {selectedOrder.shippingInfo.neighborhood} - {selectedOrder.shippingInfo.city}/{selectedOrder.shippingInfo.state}
                      <br />
                      CEP: {selectedOrder.shippingInfo.zipCode}
                    </p>
                  </div>
                )}

                {/* Payment Policy Block */}
                {selectedOrder.paymentPolicy && (
                  <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl space-y-2 mt-4 print:mt-6">
                    <div className="flex items-center gap-1.5 text-blue-900 font-extrabold uppercase tracking-wide text-xs">
                      <CreditCard size={14} className="text-blue-700" />
                      <span>Política de Pagamento</span>
                    </div>
                    <p className="text-xs text-blue-900/90 whitespace-pre-line font-medium leading-relaxed">
                      {selectedOrder.paymentPolicy}
                    </p>
                  </div>
                )}

                {/* Additional Notes */}
                {selectedOrder.notes && (
                  <div className="text-xs text-gray-600 border-t border-gray-100 pt-4 mt-4 bg-gray-50/50 p-4 rounded-xl leading-relaxed">
                    <p className="font-extrabold uppercase tracking-wider text-gray-400 mb-1">Observações:</p>
                    <p className="whitespace-pre-line font-medium">{selectedOrder.notes}</p>
                  </div>
                )}

                {/* Bottom Declaration / Footer */}
                <div className="mt-8 border-t border-gray-100 pt-6 text-center text-[10px] text-gray-400 space-y-4">
                  <p className="font-medium">
                    {selectedOrder.status === 'Orçamento'
                      ? 'Este documento trata-se de uma proposta comercial sujeita a aprovação das partes.'
                      : 'Recebemos o valor acima especificado, referente à prestação de serviços / venda de produtos.'}
                  </p>
                  <p className="text-[9px] text-gray-300">Documento gerado eletronicamente por {settings.storeName || 'Inkys'}</p>
                  
                  {/* Centered signature logo */}
                  <div className="flex justify-center pt-2">
                    {settings.logoUrl ? (
                      <img src={convertGoogleDriveUrl(settings.logoUrl)} alt="Assinatura" className="h-12 object-contain opacity-40 grayscale" referrerPolicy="no-referrer" />
                    ) : (
                      <p className="text-[12px] font-black uppercase tracking-widest text-gray-300">{settings.storeName || 'Inkys'}</p>
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
