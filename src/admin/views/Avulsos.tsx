import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { formatPrice } from '../../data/products';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';

interface Avulso {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  image: string;
}

export function Avulsos() {
  const [avulsos, setAvulsos] = useState<Avulso[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAvulso, setEditingAvulso] = useState<Avulso | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    price: number;
    costPrice?: number;
    image: string;
  }>({
    name: '',
    price: 0,
    costPrice: undefined,
    image: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'avulso_products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Avulso[];
      setAvulsos(data);
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (avulso?: Avulso) => {
    if (avulso) {
      setEditingAvulso(avulso);
      setFormData({
        name: avulso.name,
        price: avulso.price,
        costPrice: avulso.costPrice !== undefined ? avulso.costPrice : undefined,
        image: avulso.image || ''
      });
    } else {
      setEditingAvulso(null);
      setFormData({ name: '', price: 0, costPrice: undefined, image: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('O nome é obrigatório.');
      return;
    }
    
    try {
      if (editingAvulso) {
        await updateDoc(doc(db, 'avulso_products', editingAvulso.id), {
          ...formData
        });
        toast.success('Produto avulso atualizado!');
      } else {
        await addDoc(collection(db, 'avulso_products'), {
          ...formData,
          createdAt: serverTimestamp()
        });
        toast.success('Produto avulso criado!');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar produto avulso.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto avulso?')) {
      try {
        await deleteDoc(doc(db, 'avulso_products', id));
        toast.success('Produto excluído com sucesso!');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir.');
      }
    }
  };

  const filteredAvulsos = avulsos.filter(a => a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Produtos Avulsos (PDV)</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie serviços e produtos que aparecem apenas no Orçamento/PDV.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-bold text-sm hover:brightness-110 transition-all flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} /> Novo Avulso
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produtos avulsos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                <th className="p-4 font-bold w-16">Img</th>
                <th className="p-4 font-bold">Nome</th>
                <th className="p-4 font-bold">Preço Venda</th>
                <th className="p-4 font-bold">Preço Custo</th>
                <th className="p-4 font-bold">Margem Est.</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAvulsos.map(avulso => {
                const hasCost = avulso.costPrice !== undefined && avulso.costPrice > 0;
                const profit = hasCost ? avulso.price - (avulso.costPrice || 0) : 0;
                const margin = hasCost && avulso.price > 0 ? (profit / avulso.price) * 100 : 0;

                return (
                  <tr key={avulso.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      {avulso.image ? (
                        <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden">
                          <img src={avulso.image} alt={avulso.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <ImageIcon size={16} className="text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-sm text-gray-900">{avulso.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-[var(--color-primary)]">{formatPrice(avulso.price)}</span>
                    </td>
                    <td className="p-4">
                      {hasCost ? (
                        <span className="text-sm font-semibold text-gray-700">{formatPrice(avulso.costPrice!)}</span>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Não informado</span>
                      )}
                    </td>
                    <td className="p-4">
                      {hasCost ? (
                        <div>
                          <span className="text-xs font-bold text-emerald-700 block">+{formatPrice(profit)}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold">{margin.toFixed(1)}% margem</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenModal(avulso)} className="p-2 text-gray-400 hover:text-[var(--color-primary)] hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(avulso.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredAvulsos.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum produto avulso cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider">
              {editingAvulso ? 'Editar Avulso' : 'Novo Avulso'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase block mb-1">Preço Venda (R$)</label>
                  <input
                    type="text"
                    value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, price: val ? parseInt(val, 10) / 100 : 0});
                    }}
                    placeholder="0,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none font-bold"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-700 uppercase block">Custo (R$)</label>
                  </div>
                  <input
                    type="text"
                    value={formData.costPrice !== undefined && formData.costPrice > 0 ? formData.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData({...formData, costPrice: val ? parseInt(val, 10) / 100 : undefined});
                    }}
                    placeholder="Ex: 15,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase block mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: convertGoogleDriveUrl(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  placeholder="URL do Google Drive ou link direto"
                />
                {formData.image && (
                  <div className="mt-2 w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-100">
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-colors shadow-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
