import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { formatPrice } from '../../data/products';

export function Coupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: '', type: 'percentage', value: 0, active: true, minPurchase: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      const dataToSave = {
        code: formData.code.toUpperCase(),
        type: formData.type,
        value: formData.value,
        active: formData.active,
        minPurchase: formData.minPurchase
      };

      if (editingId) {
        await updateDoc(doc(db, 'coupons', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'coupons'), dataToSave);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ code: '', type: 'percentage', value: 0, active: true, minPurchase: 0 });
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar cupom');
    }
  };

  const handleEdit = (c: any) => {
    setFormData({ code: c.code, type: c.type, value: c.value, active: c.active, minPurchase: c.minPurchase || 0 });
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza?')) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Cupons de Desconto</h2>
        <button onClick={() => { setEditingId(null); setFormData({ code: '', type: 'percentage', value: 0, active: true, minPurchase: 0 }); setIsModalOpen(true); }} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 flex items-center gap-2">
          <Plus size={18} /> Novo Cupom
        </button>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Código</th>
                <th className="p-4 font-bold">Desconto</th>
                <th className="p-4 font-bold">Min. Compra</th>
                <th className="p-4 font-bold">Status</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map(c => (
                <tr key={c.id}>
                  <td className="p-4 font-bold text-gray-900">{c.code}</td>
                  <td className="p-4 text-gray-500">{c.type === 'percentage' ? `${c.value}%` : formatPrice(c.value)}</td>
                  <td className="p-4 text-gray-500">{c.minPurchase ? formatPrice(c.minPurchase) : 'Sem mínimo'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => handleEdit(c)} className="text-gray-400 hover:text-gray-900"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">Nenhum cupom cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Editar Cupom' : 'Novo Cupom'}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Código</label>
                <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none uppercase" placeholder="Ex: PRIMEIRACOMPRA10" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Tipo</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none">
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Valor</label>
                  <input type="number" min="0" value={formData.value || ''} onChange={e => setFormData({...formData, value: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500">Valor Mínimo de Compra (R$ 0 = Sem mínimo)</label>
                <input type="number" min="0" value={formData.minPurchase || ''} onChange={e => setFormData({...formData, minPurchase: parseFloat(e.target.value) || 0})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} className="accent-[var(--color-primary)] w-4 h-4" />
                <span className="text-sm font-medium">Cupom Ativo</span>
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 font-bold text-sm uppercase tracking-wider hover:bg-gray-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
