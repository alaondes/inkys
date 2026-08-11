import React, { useState } from 'react';
import { Plus, ShoppingCart, Calculator, FileText, ArrowDownRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FloatingActionButtonProps {
  onOpenCalculator: () => void;
  onOpenExpense: () => void;
}

export function FloatingActionButton({ onOpenCalculator, onOpenExpense }: FloatingActionButtonProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 md:bottom-8 right-5 z-40 flex flex-col items-end pointer-events-auto">
      
      {/* Expanded Quick Action Items */}
      {isOpen && (
        <div className="mb-3 space-y-2.5 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-200">
          
          {/* Action 1: Nova Venda PDV */}
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/admin/pos');
            }}
            className="flex items-center gap-3 bg-white hover:bg-blue-50 text-slate-900 border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl font-black text-xs transition-all hover:scale-105 group"
          >
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 group-hover:text-blue-700">
              Nova Venda Rápida (PDV)
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <ShoppingCart size={16} />
            </div>
          </button>

          {/* Action 2: Calcular Orçamento Wizard */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenCalculator();
            }}
            className="flex items-center gap-3 bg-white hover:bg-emerald-50 text-slate-900 border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl font-black text-xs transition-all hover:scale-105 group"
          >
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 group-hover:text-emerald-700">
              Calcular Orçamento m²
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
              <Calculator size={16} />
            </div>
          </button>

          {/* Action 3: Emitir NF-e / Documento */}
          <button
            onClick={() => {
              setIsOpen(false);
              navigate('/admin/nfe');
            }}
            className="flex items-center gap-3 bg-white hover:bg-indigo-50 text-slate-900 border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl font-black text-xs transition-all hover:scale-105 group"
          >
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 group-hover:text-indigo-700">
              Emitir Nota / Documento
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <FileText size={16} />
            </div>
          </button>

          {/* Action 4: Registrar Despesa do Caixa */}
          <button
            onClick={() => {
              setIsOpen(false);
              onOpenExpense();
            }}
            className="flex items-center gap-3 bg-white hover:bg-rose-50 text-slate-900 border border-slate-200 shadow-xl px-4 py-2.5 rounded-2xl font-black text-xs transition-all hover:scale-105 group"
          >
            <span className="font-extrabold uppercase tracking-wider text-[11px] text-slate-700 group-hover:text-rose-700">
              Registrar Despesa Caixa
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
              <ArrowDownRight size={16} />
            </div>
          </button>

        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white transition-all transform hover:scale-110 active:scale-95 focus:outline-none ${
          isOpen ? 'bg-slate-900 rotate-45' : 'bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 ring-4 ring-blue-500/20'
        }`}
        title="Ações Rápidas (FAB)"
      >
        <Plus size={28} className="transition-transform duration-200" />
      </button>

    </div>
  );
}
