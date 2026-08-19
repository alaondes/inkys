import { useSettings } from '../../context/SettingsContext';
import React, { useState, useEffect } from 'react';
import { Plus, PlusCircle, Search, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, Tags } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { formatPrice } from '../../data/products';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { calculateActualProductProfitability, calculateSuggestedPrice } from '../../lib/pricingUtils';
import { Calculator, Sparkles } from 'lucide-react';

const maskBRLCurrency = (val: string): string => {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (isNaN(cents)) return '';
  const integerPart = Math.floor(cents / 100);
  const decimalPart = (cents % 100).toString().padStart(2, '0');
  const formattedInteger = new Intl.NumberFormat('pt-BR').format(integerPart);
  return `${formattedInteger},${decimalPart}`;
};

const parseBRLCurrency = (val: string): number => {
  const digits = val.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};

interface Avulso {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  image: string;
  category?: string;
  sizes?: string[];
  colors?: { name: string; hex: string }[];
  sku?: string;
  packagingCost?: number;
  compareAtPrice?: number;
  gallery?: string[];
  rating?: number;
  reviews?: number;
  pixDiscount?: number;
  installments?: number;
  hidden?: boolean;
  stock?: number;
  description?: string;
}

export function Avulsos() {
  const { settings, updateSettings } = useSettings();
  const [avulsos, setAvulsos] = useState<Avulso[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingAvulso, setEditingAvulso] = useState<Avulso | null>(null);
  
  const [formData, setFormData] = useState<Partial<Avulso> & { name: string; price: number; image: string; category: string }>({
    name: '',
    price: 0,
    costPrice: undefined,
    image: '',
    category: '',
    sizes: [],
    colors: [],
    sku: '',
    packagingCost: undefined,
    compareAtPrice: undefined,
    gallery: [],
    rating: undefined,
    reviews: undefined,
    pixDiscount: undefined,
    installments: undefined,
    hidden: false,
    stock: undefined,
    description: ''
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

  const emptyAvulsoForm = {
    name: '',
    price: 0,
    costPrice: undefined,
    image: '',
    category: '',
    sizes: [],
    colors: [],
    sku: '',
    packagingCost: undefined,
    compareAtPrice: undefined,
    gallery: [],
    rating: undefined,
    reviews: undefined,
    pixDiscount: undefined,
    installments: undefined,
    hidden: false,
    stock: undefined,
    description: ''
  };

  const handleOpenModal = (avulso?: Avulso) => {
    if (avulso) {
      setEditingAvulso(avulso);
      setFormData({
        name: avulso.name || '',
        price: avulso.price || 0,
        costPrice: avulso.costPrice !== undefined ? avulso.costPrice : undefined,
        image: avulso.image || '',
        category: avulso.category || '',
        sizes: avulso.sizes || [],
        colors: avulso.colors || [],
        sku: avulso.sku || '',
        packagingCost: avulso.packagingCost !== undefined ? avulso.packagingCost : undefined,
        compareAtPrice: avulso.compareAtPrice !== undefined ? avulso.compareAtPrice : undefined,
        gallery: avulso.gallery || [],
        rating: avulso.rating !== undefined ? avulso.rating : undefined,
        reviews: avulso.reviews !== undefined ? avulso.reviews : undefined,
        pixDiscount: avulso.pixDiscount !== undefined ? avulso.pixDiscount : undefined,
        installments: avulso.installments !== undefined ? avulso.installments : undefined,
        hidden: avulso.hidden || false,
        stock: avulso.stock !== undefined ? avulso.stock : undefined,
        description: avulso.description || ''
      });
    } else {
      setEditingAvulso(null);
      setFormData(emptyAvulsoForm);
    }
    setIsModalOpen(true);
  };

  const handleAddSize = () => {
    const currentSizes = formData.sizes || [];
    setFormData({ ...formData, sizes: [...currentSizes, 'Novo Tamanho'] });
  };

  const handleUpdateSize = (index: number, value: string) => {
    const currentSizes = [...(formData.sizes || [])];
    currentSizes[index] = value;
    setFormData({ ...formData, sizes: currentSizes });
  };

  const handleRemoveSize = (index: number) => {
    const currentSizes = [...(formData.sizes || [])];
    currentSizes.splice(index, 1);
    setFormData({ ...formData, sizes: currentSizes });
  };

  const handleAddColor = () => {
    const currentColors = formData.colors || [];
    setFormData({ ...formData, colors: [...currentColors, { name: 'Nova Cor', hex: '#ffffff' }] });
  };

  const handleUpdateColor = (index: number, key: 'name' | 'hex', value: string) => {
    const currentColors = [...(formData.colors || [])];
    currentColors[index] = { ...currentColors[index], [key]: value };
    setFormData({ ...formData, colors: currentColors });
  };

  const handleRemoveColor = (index: number) => {
    const currentColors = [...(formData.colors || [])];
    currentColors.splice(index, 1);
    setFormData({ ...formData, colors: currentColors });
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
              <div className="flex-1 overflow-y-auto pr-1 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Produto</label>
                    <input required type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: Arte Final, Camiseta, Caneca..." />
                  </div>
                  
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Código / SKU</label>
                    <input type="text" value={formData.sku || ""} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ex: CAN-001" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>

                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                    <select 
                      value={formData.category || ""} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {settings.avulsosCategories?.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Venda (R$)</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.price !== undefined ? maskBRLCurrency(Math.round(formData.price * 100).toString()) : ''} 
                      onChange={e => {
                        const numericValue = parseBRLCurrency(e.target.value);
                        setFormData({...formData, price: numericValue});
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-bold" 
                      placeholder="Ex: 36,90"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                        <span>Valor Promocional (R$)</span>
                      </label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">(Preço De / riscado)</span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.compareAtPrice !== undefined && formData.compareAtPrice > 0 ? maskBRLCurrency(Math.round(formData.compareAtPrice * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, compareAtPrice: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, compareAtPrice: numericValue});
                        }
                      }} 
                      className="w-full bg-red-50/40 border border-red-200/80 rounded-lg p-3 text-sm focus:border-red-500 outline-none font-semibold" 
                      placeholder="Ex: 49,90 (Opcional)"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Preço de Custo (R$)</label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">(fornecedor)</span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.costPrice !== undefined && formData.costPrice > 0 ? maskBRLCurrency(Math.round(formData.costPrice * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, costPrice: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, costPrice: numericValue});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                      placeholder="Ex: 12,00 (Opcional)"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Custo Embalagem (R$)</label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">
                        (Padrão: R$ {(settings?.pricingRules?.defaultPackagingCost ?? 2).toFixed(2).replace('.', ',')})
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.packagingCost !== undefined && formData.packagingCost > 0 ? maskBRLCurrency(Math.round(formData.packagingCost * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, packagingCost: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, packagingCost: numericValue});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                      placeholder={`Ex: ${(settings?.pricingRules?.defaultPackagingCost ?? 2.00).toFixed(2).replace('.', ',')} (Opcional)`}
                    />
                  </div>
                  
                  {/* Indicador de Oferta / Valor Promocional Ativo */}
                  {(() => {
                    const p1 = formData.price || 0;
                    const p2 = formData.compareAtPrice || 0;
                    if (p1 > 0 && p2 > 0 && p1 !== p2) {
                      const original = Math.max(p1, p2);
                      const promo = Math.min(p1, p2);
                      const discountPct = Math.round((1 - promo / original) * 100);
                      const savings = original - promo;
                      return (
                        <div className="col-span-2 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                              🔥
                            </div>
                            <div>
                              <div className="font-extrabold text-red-950 flex items-center gap-2">
                                <span>Valor Promocional Ativo</span>
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {discountPct}% OFF
                                </span>
                              </div>
                              <div className="text-[11px] text-red-800 font-medium mt-0.5">
                                Preço no site: <strong className="font-black text-red-950">R$ {promo.toFixed(2).replace('.', ',')}</strong> (Preço riscado: <span className="line-through">R$ {original.toFixed(2).replace('.', ',')}</span> - Economia de R$ {savings.toFixed(2).replace('.', ',')})
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Sugestão de Precificação Fixa */}
                  {(() => {
                    const calc = calculateSuggestedPrice(formData.costPrice || 0, settings.pricingRules, formData.packagingCost);
                    const isCurrentPriceEqual = Math.abs((formData.price || 0) - calc.suggestedPrice) < 0.05;
                    return (
                      <div className="col-span-2 bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                              <Calculator size={16} />
                            </div>
                            <div>
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 block">
                                Formação de Preço Inteligente
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Regras ativas: Taxas, Impostos, Custo Fixo & Margem ({calc.sumPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const suggestedFormatted = Math.round(calc.suggestedPrice * 100) / 100;
                              setFormData(prev => ({ ...prev, price: suggestedFormatted }));
                              toast.success(`Preço R$ ${suggestedFormatted.toFixed(2).replace('.', ',')} aplicado!`);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                              isCurrentPriceEqual 
                                ? 'bg-emerald-600 text-white cursor-default' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                            }`}
                          >
                            {isCurrentPriceEqual ? (
                              <>
                                <CheckCircle size={14} /> Preço Sugerido Aplicado
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} /> Aplicar Preço Sugerido (R$ {calc.suggestedPrice.toFixed(2).replace('.', ',')})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Desconto Pix (%)</label>
                    <input type="number" min="0" max="100" value={formData.pixDiscount !== undefined ? formData.pixDiscount : ''} onChange={e => setFormData({...formData, pixDiscount: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 10" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Parcelas (sem juros)</label>
                    <input type="number" min="1" max="12" value={formData.installments !== undefined ? formData.installments : ''} onChange={e => setFormData({...formData, installments: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 2" />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Quantidade em Estoque</label>
                    <input type="number" min="0" value={formData.stock !== undefined ? formData.stock : ''} onChange={e => setFormData({...formData, stock: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Sem limite (ilimitado)" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Avaliação (Estrelas)</label>
                    <input type="number" min="1" max="5" step="0.1" value={formData.rating !== undefined ? formData.rating : ''} onChange={e => setFormData({...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 5" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Avaliações</label>
                    <input type="number" min="0" value={formData.reviews !== undefined ? formData.reviews : ''} onChange={e => setFormData({...formData, reviews: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 15" />
                  </div>
                  
                  <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Ocultar Produto</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Produtos ocultos não aparecem na loja para os clientes.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, hidden: !formData.hidden})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${formData.hidden ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.hidden ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Imagem Principal (Destaque)</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.image || ""} onChange={e => setFormData({...formData, image: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Adicionar por URL da imagem principal..." />
                    </div>
                  </div>
                  
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Galeria de Imagens (Carrossel)</label>
                      <span className="text-[10px] text-gray-400">Opcional</span>
                    </div>
                    <div className="space-y-2">
                      {(formData.gallery || []).map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="url" value={url} onChange={e => {
                            const newGallery = [...(formData.gallery || [])];
                            newGallery[idx] = e.target.value;
                            setFormData({...formData, gallery: newGallery});
                          }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="URL da imagem..." />
                          <button type="button" onClick={() => {
                            const newGallery = [...(formData.gallery || [])];
                            newGallery.splice(idx, 1);
                            setFormData({...formData, gallery: newGallery});
                          }} className="p-3 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input type="url" id="new-gallery-url" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Adicionar por URL da imagem..." onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              setFormData({...formData, gallery: [...(formData.gallery || []), val]});
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}/>
                        <button type="button" onClick={() => {
                          const input = document.getElementById('new-gallery-url') as HTMLInputElement;
                          if (input && input.value) {
                            setFormData({...formData, gallery: [...(formData.gallery || []), input.value]});
                            input.value = '';
                          }
                        }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Tamanhos <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddSize} className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Tamanho
                      </button>
                    </div>
                    
                    {formData.sizes && formData.sizes.length > 0 && (
                      <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              type="text" 
                              value={size} 
                              onChange={e => handleUpdateSize(index, e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none uppercase font-bold" 
                              placeholder="Tamanho (ex: P, M, G, 42)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveSize(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Cores <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddColor} className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Cor
                      </button>
                    </div>
                    
                    {formData.colors && formData.colors.length > 0 && (
                      <div className="space-y-2">
                        {formData.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              title="Cor (Hexadecimal)"
                              type="color" 
                              value={color.hex.startsWith('linear-gradient') ? '#ffffff' : color.hex} 
                              onChange={e => handleUpdateColor(index, 'hex', e.target.value)}
                              disabled={color.hex.startsWith('linear')}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border-none appearance-none p-0 shrink-0" 
                            />
                            <input 
                              type="text" 
                              value={color.name} 
                              onChange={e => handleUpdateColor(index, 'name', e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" 
                              placeholder="Nome da Cor (ex: Vermelho)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
