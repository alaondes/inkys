import { useSettings } from '../../context/SettingsContext';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, Tags } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { formatPrice } from '../../data/products';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { calculateActualProductProfitability } from '../../lib/pricingUtils';

interface Avulso {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  image: string;
  category?: string;
}

export function Avulsos() {
  const { settings, updateSettings } = useSettings();
  const [avulsos, setAvulsos] = useState<Avulso[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingAvulso, setEditingAvulso] = useState<Avulso | null>(null);
  
  const [formData, setFormData] = useState<{
    name: string;
    price: number;
    costPrice?: number;
    image: string;
    category: string;
  }>({
    name: '',
    price: 0,
    costPrice: undefined,
    image: '',
    category: ''
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
        image: avulso.image || '',
        category: avulso.category || ''
      });
    } else {
      setEditingAvulso(null);
      setFormData({ name: '', price: 0, costPrice: undefined, image: '', category: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('O nome é obrigatório.');
      return;
    }
    
    const finalData = { ...formData, image: formData.image ? convertGoogleDriveUrl(formData.image) : '' };

    try {
      if (editingAvulso) {
        await updateDoc(doc(db, 'avulso_products', editingAvulso.id), {
          ...finalData
        });
        toast.success('Produto avulso atualizado!');
      } else {
        await addDoc(collection(db, 'avulso_products'), {
          ...finalData,
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

  const categoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    avulsos.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [avulsos]);

  const allCategoryList = Object.keys(categoriesWithCounts).sort();

  const filteredAvulsos = avulsos.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategoryFilter === 'Todos' || (a.category || 'Sem Categoria') === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{settings.posCustomItemLabel || 'Personalizáveis'} (PDV)</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie serviços e produtos que aparecem apenas no Orçamento/PDV.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-2 transition-all shadow-sm"
          >
            <Tags size={15} /> Categorias
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-blue-500 transition-all flex items-center gap-2 shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} /> Novo Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={`Buscar ${settings.posCustomItemLabel || 'Personalizáveis'}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-blue-600 outline-none"
            />
          </div>
        </div>

        {/* Filtro por Categorias em Pills Horizontal */}
        <div className="flex items-center gap-2 overflow-x-auto p-4 border-b border-gray-100 scrollbar-none bg-white">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('Todos')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 border ${
              selectedCategoryFilter === 'Todos'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            Todos ({avulsos.length})
          </button>
          {allCategoryList.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat)}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 border ${
                selectedCategoryFilter === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              {cat} ({categoriesWithCounts[cat]})
            </button>
          ))}
        </div>

        <div className="p-4 bg-gray-50/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredAvulsos.map((avulso) => {
              // Apply pricing rules just like in the Catalog
              const prof = calculateActualProductProfitability(avulso.price, avulso.costPrice || 0, settings?.pricingRules, 0);
              
              return (
                <div key={avulso.id} className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group">
                  <div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 mb-3">
                      <img 
                        src={avulso.image ? convertGoogleDriveUrl(avulso.image) : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} 
                        alt={avulso.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                      />
                      {avulso.category && (
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                          {avulso.category}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug">{avulso.name}</h4>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-base font-black text-slate-900">{formatPrice(avulso.price)}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prof.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                          +R$ {prof.netProfit.toFixed(0)} ({prof.marginPct.toFixed(0)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100">
                    <button 
                      type="button"
                      onClick={() => handleOpenModal(avulso)} 
                      className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDelete(avulso.id)} 
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                      title="Excluir"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredAvulsos.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white border border-slate-200/80 rounded-3xl">
                Nenhum serviço ou personalizado encontrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Edit/Create */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0 pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">{editingAvulso ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 text-gray-900">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Item</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: Arte Final, Camiseta, Caneca..." />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {settings.avulsosCategories?.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Venda (R$)</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Custo (R$) <span className="text-gray-400 font-normal lowercase">- opcional</span></label>
                    <input type="number" step="0.01" min="0" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">URL da Imagem <span className="text-gray-400 font-normal lowercase">- opcional</span></label>
                  <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="https://..." />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-500 transition-all flex items-center gap-2">
                  <CheckCircle size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Modal */}
      {isCategoriesModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3">
                <Tags size={24} className="text-blue-600" /> Categorias
              </h3>
              <button onClick={() => setIsCategoriesModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="new-category"
                    placeholder="Nova categoria..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-blue-600 outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const current = settings.avulsosCategories || [];
                          if (!current.includes(val)) {
                            updateSettings({ avulsosCategories: [...current, val] });
                            toast.success(`Categoria "${val}" criada!`);
                          }
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-category') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        const current = settings.avulsosCategories || [];
                        if (!current.includes(val)) {
                          updateSettings({ avulsosCategories: [...current, val] });
                          toast.success(`Categoria "${val}" criada!`);
                        }
                        input.value = '';
                      }
                    }}
                    className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"
                    title="Adicionar Categoria"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="space-y-2 mt-4">
                  {(settings.avulsosCategories || []).map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl group">
                      <span className="font-bold text-sm text-slate-700">{cat}</span>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Excluir categoria "${cat}"?`)) {
                            const newCats = (settings.avulsosCategories || []).filter(c => c !== cat);
                            updateSettings({ avulsosCategories: newCats });
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  {(!settings.avulsosCategories || settings.avulsosCategories.length === 0) && (
                    <p className="text-center text-slate-400 text-sm py-4">Nenhuma categoria cadastrada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
