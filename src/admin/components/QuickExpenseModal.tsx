import React, { useState } from 'react';
import { X, DollarSign, ArrowDownRight, Tag, Calendar, FileText, Check } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickExpenseModal({ isOpen, onClose }: QuickExpenseModalProps) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Insumos');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) {
      toast.error("Informe a descrição e um valor maior que R$ 0,00.");
      return;
    }

    setIsSaving(true);
    try {
      await addDoc(collection(db, 'financial_records'), {
        description,
        type: 'Saída',
        amount: Number(amount),
        category,
        paymentMethod,
        notes: notes || 'Registrado via Lançamento Rápido (FAB)',
        date: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp()
      });

      toast.success("Despesa registrada no caixa com sucesso!");
      setDescription('');
      setAmount(0);
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao registrar despesa.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-rose-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <ArrowDownRight size={22} />
            </div>
            <div>
              <h3 className="font-extrabold uppercase tracking-tight text-white text-base">
                Registrar Despesa do Caixa
              </h3>
              <p className="text-xs text-rose-100 font-medium">
                Saída rápida de valores, insumos ou custos fixos
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-rose-100 hover:text-white p-1.5 rounded-xl hover:bg-rose-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Descrição da Despesa / Fornecedor *
            </label>
            <input 
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Compra de Bobina de Lona 440g / Conta de Luz"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold text-slate-900 focus:bg-white focus:border-rose-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Valor da Saída (R$) *
              </label>
              <input 
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-black text-rose-600 focus:bg-white focus:border-rose-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none transition-all"
              >
                <option value="Insumos">Insumos e Matéria Prima</option>
                <option value="Manutenção">Manutenção de Máquinas</option>
                <option value="Energia/Água">Energia, Água e Internet</option>
                <option value="Aluguel">Aluguel / Espaço</option>
                <option value="Funcionários">Pagamento de Equipe / Comissões</option>
                <option value="Impostos">Impostos / Taxas</option>
                <option value="Outros">Outras Despesas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:bg-white focus:border-rose-500 outline-none transition-all"
              >
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro (Caixa)</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="Boleto">Boleto Bancário</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                Data do Lançamento
              </label>
              <input 
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
              Observações Adicionais
            </label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Nota fiscal enviada por email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none resize-none h-16"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Gravando...' : 'Lançar Despesa'} <Check size={16} />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
