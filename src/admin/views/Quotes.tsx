import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, CheckCircle2, XCircle, Clock, Copy, Printer, 
  Send, ArrowRight, Trash2, Edit2, ShoppingBag, MessageCircle, AlertCircle, 
  Sparkles, ExternalLink, Calendar, User, DollarSign, Calculator
} from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { syncOrderToAccounting } from '../utils/accountingSync';

export interface QuoteItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  details?: any;
}

export interface Quote {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  cpfCnpj?: string;
  items: QuoteItem[];
  total: number;
  discount?: number;
  subtotal?: number;
  status: 'Orçamento' | 'Aprovado' | 'Recusado' | 'Expirado';
  notes?: string;
  validUntil?: string;
  createdAt?: any;
  updatedAt?: any;
  convertedToOrderId?: string;
  sellerName?: string;
}

export function Quotes() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // Load quotes from Firestore
  useEffect(() => {
    // We listen to orders collection where status is 'Orçamento', 'Aprovado', 'Recusado', or 'Expirado'
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: Quote[] = [];
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        // Check if it is a quote (status === 'Orçamento' or has isQuote flag)
        if (data.status === 'Orçamento' || data.status === 'Recusado' || data.status === 'Expirado' || data.isQuote) {
          docsData.push({
            id: docSnap.id,
            customer: data.customer || 'Cliente não identificado',
            email: data.email,
            phone: data.phone,
            cpfCnpj: data.cpfCnpj,
            items: data.items || [],
            total: data.total || 0,
            discount: data.discount || 0,
            subtotal: data.subtotal || data.total || 0,
            status: data.status || 'Orçamento',
            notes: data.notes || '',
            validUntil: data.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            createdAt: data.createdAt,
            sellerName: data.sellerName || 'Vendedor Balcão'
          });
        }
      });
      setQuotes(docsData);
      setLoading(false);
    }, (err) => {
      console.error("Erro ao carregar orçamentos:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered quotes
  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.id.toLowerCase().includes(search.toLowerCase()) ||
      q.customer.toLowerCase().includes(search.toLowerCase()) ||
      (q.phone && q.phone.includes(search));

    const matchesStatus = statusFilter === 'Todos' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Metrics
  const totalOpenQuotes = quotes.filter(q => q.status === 'Orçamento').length;
  const totalValueOpen = quotes.filter(q => q.status === 'Orçamento').reduce((acc, q) => acc + (q.total || 0), 0);
  const totalApproved = quotes.filter(q => q.status === 'Aprovado').length;

  // 1-Click Convert Quote to Active Order
  const handleConvertToOrder = async (quote: Quote) => {
    if (!window.confirm(`Deseja APROVAR o orçamento #${quote.id.slice(0, 8)} e enviá-lo direto para os PEDIDOS DE PRODUÇÃO?`)) {
      return;
    }

    setIsConverting(true);
    try {
      // Update quote status to 'Pendente' (which moves it into active production order queue)
      const nowStr = new Date().toISOString();
      await updateDoc(doc(db, 'orders', quote.id), {
        status: 'Pendente',
        isQuote: false,
        approvedAt: nowStr,
        updatedAt: nowStr,
        notes: (quote.notes ? quote.notes + ' | ' : '') + 'Convertido de Orçamento em ' + new Date().toLocaleDateString('pt-BR')
      });

      // Synchronize with accounting if needed
      await syncOrderToAccounting({
        id: quote.id,
        customer: quote.customer,
        total: quote.total,
        paymentMethod: 'A Combinar',
        items: quote.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price }))
      });

      toast.success("Orçamento APROVADO! Enviado com sucesso para a fila de Pedidos & Produção.");
      setSelectedQuote(null);
      navigate('/admin/orders');
    } catch (err) {
      console.error("Erro ao converter orçamento:", err);
      toast.error("Erro ao converter orçamento em pedido.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleUpdateStatus = async (quoteId: string, newStatus: 'Orçamento' | 'Aprovado' | 'Recusado' | 'Expirado') => {
    try {
      await updateDoc(doc(db, 'orders', quoteId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Status alterado para "${newStatus}"`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este orçamento?")) return;
    try {
      await deleteDoc(doc(db, 'orders', quoteId));
      toast.success("Orçamento excluído.");
      if (selectedQuote?.id === quoteId) setSelectedQuote(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao excluir orçamento.");
    }
  };

  const copyWhatsAppSummary = (quote: Quote) => {
    const itemsText = quote.items.map(item => {
      let detailStr = '';
      if (item.details?.widthCm && item.details?.heightCm) {
        detailStr = ` (${item.details.widthCm}x${item.details.heightCm}cm)`;
      }
      return `• ${item.quantity}x ${item.name}${detailStr} - ${formatPrice(item.price * item.quantity)}`;
    }).join('\n');

    const text = 
      `*ORÇAMENTO #${quote.id.slice(0, 8)} - ${settings.storeName || 'Gráfica Express'}*\n\n` +
      `👤 *Cliente:* ${quote.customer}\n` +
      `📋 *Itens Solicitados:*\n${itemsText}\n\n` +
      `💰 *VALOR TOTAL:* ${formatPrice(quote.total)}\n` +
      `⏳ *Validade do Orçamento:* 7 dias\n\n` +
      `Para aprovar a produção, basta responder este mensagem com "APROVADO"!`;

    const cleanPhone = quote.phone ? quote.phone.replace(/\D/g, '') : '';
    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Texto do orçamento copiado! Cole no WhatsApp do cliente.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileText className="text-blue-600" size={26} /> Gestão de Orçamentos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Crie, negocie e transforme cotações em pedidos de produção aprovados em 1 clique.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/pos', { state: { isQuoteMode: true } })}
          className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
        >
          <Plus size={16} /> Novo Orçamento (PDV)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Orçamentos em Aberto</span>
            <strong className="text-2xl font-black text-slate-900 mt-1 block">{totalOpenQuotes}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Valor Total Cotado</span>
            <strong className="text-2xl font-black text-blue-600 mt-1 block">{formatPrice(totalValueOpen)}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
            <DollarSign size={22} />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 p-5 rounded-3xl shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Convertidos em Pedido</span>
            <strong className="text-2xl font-black text-emerald-600 mt-1 block">{totalApproved}</strong>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:flex-1 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por código de orçamento, cliente ou telefone..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-900 text-xs font-semibold w-full placeholder-slate-400"
          />
        </div>

        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-600 w-full sm:w-48"
        >
          <option value="Todos">Todos os Status</option>
          <option value="Orçamento">Em Aberto</option>
          <option value="Aprovado">Aprovados</option>
          <option value="Recusado">Recusados</option>
          <option value="Expirado">Expirados</option>
        </select>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs">
            Carregando orçamentos...
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold text-xs space-y-3">
            <p>Nenhum orçamento encontrado.</p>
            <button
              onClick={() => navigate('/admin/pos', { state: { isQuoteMode: true } })}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs uppercase font-extrabold"
            >
              Criar Primeiro Orçamento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-4 pl-6">Código / Data</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Itens</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 pr-6 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {filteredQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100 block w-max">
                        #{quote.id.slice(0, 8)}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {quote.createdAt?.seconds ? new Date(quote.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Recente'}
                      </span>
                    </td>

                    <td className="p-4">
                      <strong className="text-slate-900 block font-bold">{quote.customer}</strong>
                      {quote.phone && <span className="text-[11px] text-slate-500 font-medium">{quote.phone}</span>}
                    </td>

                    <td className="p-4">
                      <span className="text-slate-700 font-bold">
                        {quote.items?.length || 0} item(ns)
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[180px]">
                        {quote.items?.map(i => i.name).join(', ')}
                      </span>
                    </td>

                    <td className="p-4">
                      <strong className="text-slate-900 font-extrabold text-sm">
                        {formatPrice(quote.total)}
                      </strong>
                    </td>

                    <td className="p-4">
                      {quote.status === 'Orçamento' && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          Em Aberto
                        </span>
                      )}
                      {quote.status === 'Aprovado' && (
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          Aprovado
                        </span>
                      )}
                      {quote.status === 'Recusado' && (
                        <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                          Recusado
                        </span>
                      )}
                    </td>

                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* 1-Click Convert to Order Button */}
                        <button
                          onClick={() => handleConvertToOrder(quote)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-black text-[11px] uppercase tracking-wider transition-all shadow-xs flex items-center gap-1.5"
                          title="Aprovar e Converter em Pedido de Produção"
                        >
                          <CheckCircle2 size={14} /> Converter em Pedido
                        </button>

                        <button
                          onClick={() => copyWhatsAppSummary(quote)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                          title="Enviar por WhatsApp"
                        >
                          <MessageCircle size={15} />
                        </button>

                        <button
                          onClick={() => setSelectedQuote(quote)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                          title="Ver Detalhes"
                        >
                          <FileText size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quote Details Modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold uppercase tracking-tight text-white text-base">
                  Orçamento #{selectedQuote.id.slice(0, 8)}
                </h3>
                <p className="text-xs text-slate-400 font-medium">Cliente: {selectedQuote.customer}</p>
              </div>
              <button onClick={() => setSelectedQuote(null)} className="text-slate-400 hover:text-white p-2">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Telefone:</span>
                  <strong className="text-slate-900">{selectedQuote.phone || 'Não informado'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold uppercase">Atendente/Vendedor:</span>
                  <strong className="text-slate-900">{selectedQuote.sellerName || 'Balcão'}</strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2">Itens Cotados:</h4>
                <div className="space-y-2">
                  {selectedQuote.items.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-slate-900 block font-bold">{item.quantity}x {item.name}</strong>
                        {item.details?.widthCm && (
                          <span className="text-[10px] text-slate-500 block">
                            Dimensões: {item.details.widthCm}x{item.details.heightCm}cm ({item.details.areaM2}m²)
                          </span>
                        )}
                      </div>
                      <strong className="text-slate-900 font-black">{formatPrice(item.price * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold uppercase text-slate-500">Valor Total do Orçamento:</span>
                <strong className="text-2xl font-black text-emerald-600">{formatPrice(selectedQuote.total)}</strong>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => copyWhatsAppSummary(selectedQuote)}
                className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold uppercase rounded-xl transition-colors flex items-center gap-2"
              >
                <MessageCircle size={15} /> Copiar WhatsApp
              </button>

              <button
                onClick={() => handleConvertToOrder(selectedQuote)}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 size={16} /> Converter em Pedido
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
