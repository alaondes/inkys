import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Clock, CheckCircle2, AlertCircle, Printer, Scissors, PackageCheck, Image as ImageIcon, ChevronRight, User, DollarSign, ExternalLink } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface KanbanBoardProps {
  orders: any[];
}

const STAGES = [
  { id: 'Pendente', title: 'Aguardando Arte / Aprovação', icon: Clock, color: 'border-amber-400 bg-amber-50 text-amber-800', badge: 'bg-amber-100 text-amber-800' },
  { id: 'Em Produção', title: 'Na Impressora / Produção', icon: Printer, color: 'border-blue-500 bg-blue-50 text-blue-800', badge: 'bg-blue-100 text-blue-800' },
  { id: 'Acabamento', title: 'Acabamento & Refile', icon: Scissors, color: 'border-indigo-500 bg-indigo-50 text-indigo-800', badge: 'bg-indigo-100 text-indigo-800' },
  { id: 'Pronto para Retirada', title: 'Pronto p/ Retirada / Envio', icon: PackageCheck, color: 'border-purple-500 bg-purple-50 text-purple-800', badge: 'bg-purple-100 text-purple-800' },
  { id: 'Concluído', title: 'Entregue / Concluído', icon: CheckCircle2, color: 'border-emerald-500 bg-emerald-50 text-emerald-800', badge: 'bg-emerald-100 text-emerald-800' },
];

export function KanbanBoard({ orders }: KanbanBoardProps) {
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMoveStage = async (orderId: string, currentStage: string, direction: 'next' | 'prev') => {
    const currentIndex = STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (targetIndex < 0 || targetIndex >= STAGES.length) return;

    const newStage = STAGES[targetIndex].id;
    setUpdatingId(orderId);

    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStage,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Status alterado para "${STAGES[targetIndex].title}"`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao atualizar status do pedido.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kanban Grid Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {STAGES.map((stage, stageIdx) => {
          const StageIcon = stage.icon;
          const stageOrders = orders.filter(o => {
            // Map legacy statuses if necessary
            if (stage.id === 'Pendente') return o.status === 'Pendente' || o.status === 'Orçamento';
            if (stage.id === 'Concluído') return o.status === 'Concluído' || o.status === 'Entregue';
            return o.status === stage.id;
          });

          return (
            <div 
              key={stage.id}
              className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-w-[280px] max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3 shrink-0 px-1">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${stage.badge}`}>
                    <StageIcon size={15} />
                  </div>
                  <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-tight line-clamp-1">
                    {stage.title}
                  </h3>
                </div>
                <span className="bg-white border border-slate-200 text-slate-700 text-xs font-black px-2 py-0.5 rounded-full shadow-2xs">
                  {stageOrders.length}
                </span>
              </div>

              {/* Order Cards List */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {stageOrders.length === 0 ? (
                  <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-medium">
                    Nenhum pedido nesta etapa
                  </div>
                ) : (
                  stageOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3 group relative"
                    >
                      {/* Top Bar */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 font-mono">
                          #{order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {order.displayDate || (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : '')}
                        </span>
                      </div>

                      {/* Customer Name */}
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5 truncate">
                          <User size={13} className="text-slate-400 shrink-0" />
                          {order.customer || 'Cliente Balcão'}
                        </h4>
                        {order.phone && (
                          <span className="text-[10px] text-slate-500 font-medium block pl-5">
                            {order.phone}
                          </span>
                        )}
                      </div>

                      {/* Items Preview */}
                      <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600 font-medium space-y-1 border border-slate-100">
                        {order.items?.slice(0, 2).map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center truncate">
                            <span className="truncate">{item.quantity}x {item.name}</span>
                            <span className="font-bold text-slate-800 text-[10px] shrink-0 ml-1">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                        {order.items?.length > 2 && (
                          <span className="text-[10px] text-blue-600 font-bold block pt-1">
                            + {order.items.length - 2} outro(s) item(ns)
                          </span>
                        )}
                      </div>

                      {/* Price & Delivery Badge */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-slate-400 block">Total</span>
                          <strong className="text-sm font-black text-slate-900">
                            {formatPrice(order.total || 0)}
                          </strong>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 text-slate-700 uppercase">
                          {order.shippingMode || 'Retirada'}
                        </span>
                      </div>

                      {/* Action Stage Switcher Buttons */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                        {stageIdx > 0 ? (
                          <button
                            onClick={() => handleMoveStage(order.id, stage.id, 'prev')}
                            disabled={updatingId === order.id}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                            title="Voltar Etapa"
                          >
                            <ArrowLeft size={13} /> Voltar
                          </button>
                        ) : <div />}

                        <button
                          onClick={() => navigate('/admin/orders')}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Detalhes
                        </button>

                        {stageIdx < STAGES.length - 1 ? (
                          <button
                            onClick={() => handleMoveStage(order.id, stage.id, 'next')}
                            disabled={updatingId === order.id}
                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                            title="Avançar Etapa"
                          >
                            Avançar <ArrowRight size={13} />
                          </button>
                        ) : <div />}
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
