import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, PlusCircle, MinusCircle, ChevronUp, ChevronDown, Bold, Italic, AlignLeft, Tags, CheckCircle, Loader2 } from 'lucide-react';
import { formatPrice, Product } from '../../data/products';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';

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

export function Products() {
  const { products, setProducts, addProduct, updateProduct, deleteProduct } = useProducts();
  const { settings, updateSettings } = useSettings();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    if (!hasUnsavedOrder) {
      setLocalProducts(products);
    }
  }, [products, hasUnsavedOrder]);

  const handleSaveOrder = async () => {
    setIsSavingOrder(true);
    setSaveStatus('saving');
    try {
      await setProducts(localProducts);
      setHasUnsavedOrder(false);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (err) {
      setSaveStatus('error');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleDiscardOrder = () => {
    setLocalProducts(products);
    setHasUnsavedOrder(false);
    setSaveStatus('idle');
  };

  const insertFormatting = (tagStart: string, tagEnd: string) => {
    if (!descriptionRef.current) return;
    const start = descriptionRef.current.selectionStart;
    const end = descriptionRef.current.selectionEnd;
    const text = formData.description || "";
    const selectedText = text.substring(start, end);
    const newText = text.substring(0, start) + tagStart + selectedText + tagEnd + text.substring(end);
    setFormData({ ...formData, description: newText });
    
    // Focus back on the textarea and place cursor correctly
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.focus();
        descriptionRef.current.setSelectionRange(
          start + tagStart.length + selectedText.length, 
          start + tagStart.length + selectedText.length
        );
      }
    }, 0);
  };

  const filteredProducts = localProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.category || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) setEditingProduct(product);
    else setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmed = async (id: string) => {
    const loadToast = toast.loading('Excluindo produto...');
    try {
      await deleteProduct(id);
      setLocalProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto excluído com sucesso!', { id: loadToast });
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Erro ao excluir o produto.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg += ` Detalhes: ${parsed.error}`;
        }
      } catch (parseErr) {
        if (err.message) errorMsg += ` Detalhes: ${err.message}`;
      }
      toast.error(errorMsg, { id: loadToast });
    }
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const actualIndex = localProducts.findIndex(p => p.id === filteredProducts[index].id);
    if (actualIndex < 0) return;
    
    const newProducts = [...localProducts];
    if (direction === 'up' && actualIndex > 0) {
      const temp = newProducts[actualIndex];
      newProducts[actualIndex] = newProducts[actualIndex - 1];
      newProducts[actualIndex - 1] = temp;
      setLocalProducts(newProducts);
      setHasUnsavedOrder(true);
    } else if (direction === 'down' && actualIndex < localProducts.length - 1) {
      const temp = newProducts[actualIndex];
      newProducts[actualIndex] = newProducts[actualIndex + 1];
      newProducts[actualIndex + 1] = temp;
      setLocalProducts(newProducts);
      setHasUnsavedOrder(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              const MAX_HEIGHT = 800;
              let width = img.width;
              let height = img.height;

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                // Pre-fill white background to avoid transparent parts turning black in JPEG compression
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
              }
              // Force output to jpeg with 0.75 quality for high compression to prevent exceeding Firestore 1MB limits
              resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      if (isGallery) {
        const promises = files.map(file => resizeImage(file));
        Promise.all(promises).then(results => {
          setFormData(prev => {
            const newGallery = [...(prev.gallery || []), ...results];
            // If there's no main image currently set, automatically use the first uploaded gallery image
            const image = prev.image || newGallery[0] || '';
            return {
              ...prev,
              gallery: newGallery,
              image: image
            };
          });
        });
      } else {
        resizeImage(files[0]).then(result => {
          setFormData(prev => ({ ...prev, image: result }));
        });
      }
    }
    
    // Reset input so the same file(s) can be selected again
    e.target.value = '';
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormData(prev => {
      const newGallery = [...(prev.gallery || [])];
      newGallery.splice(index, 1);
      return { ...prev, gallery: newGallery };
    });
  };

  const currentProductEmptyTemplate: Partial<Product> = {
    name: '', category: '', description: '', price: 0, image: '', colors: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(currentProductEmptyTemplate);

  // Update formData when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      setFormData(editingProduct ? { ...editingProduct, colors: editingProduct.colors ? [...editingProduct.colors] : [] } : currentProductEmptyTemplate);
    }
  }, [isModalOpen, editingProduct]);

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
    
    // Auto-fallback main image to first gallery image if main image is empty/not set
    const mainImage = formData.image || (formData.gallery && formData.gallery[0]) || '';
    const finalFormData = { ...formData, image: mainImage };

    const loadToast = toast.loading(editingProduct ? 'Salvando alterações...' : 'Criando produto...');
    try {
      if (editingProduct) {
        const updatedProduct = { ...editingProduct, ...finalFormData } as Product;
        await updateProduct(updatedProduct);
        setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        toast.success('Produto atualizado com sucesso!', { id: loadToast });
      } else {
        const newProduct = { ...finalFormData, id: Date.now().toString() } as Product;
        await addProduct(newProduct);
        setLocalProducts(prev => [...prev, newProduct]);
        toast.success('Produto criado com sucesso!', { id: loadToast });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Erro ao salvar o produto no banco de dados.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed && parsed.error) {
          errorMsg += ` Detalhes: ${parsed.error}`;
        }
      } catch (parseErr) {
        if (err.message) errorMsg += ` Detalhes: ${err.message}`;
      }
      toast.error(errorMsg, { id: loadToast });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Produtos</h2>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCategoriesModalOpen(true)}
            className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-gray-800 transition-all"
          >
            <Tags size={18} /> Categorias
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      {hasUnsavedOrder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>Você alterou a ordem dos produtos. Deseja salvar ou atualizar a ordenação?</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              onClick={handleDiscardOrder}
              disabled={isSavingOrder}
              className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
            >
              Descartar
            </button>
            <button
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSavingOrder ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou categoria..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-gray-900 w-full placeholder-gray-400"
        />
      </div>

      {/* Visualização em Tabela para Desktop */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Produto</th>
                <th className="p-4 font-bold">Categoria</th>
                <th className="p-4 font-bold">Estoque</th>
                <th className="p-4 font-bold">Preço</th>
                <th className="p-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((product, index) => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 flex items-center gap-3">
                    {product.image || (product.gallery && product.gallery.length > 0) ? (
                      <img 
                        src={product.image || (product.gallery && product.gallery[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} 
                        alt={product.name} 
                        className="w-12 h-12 rounded-lg object-contain border border-gray-200 bg-white shrink-0 shadow-sm" 
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 shrink-0"></div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-gray-900 group-hover:text-[var(--color-primary)] transition-colors">{product.name}</span>
                      {product.hidden && <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Oculto</span>}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {product.stock !== undefined ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${product.stock > 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {search === '' && (
                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200 mr-1">
                          <button onClick={() => moveProduct(index, 'up')} disabled={index === 0} className="text-gray-500 hover:text-gray-900 p-1.5 hover:bg-white rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent" title="Mover para cima">
                            <ChevronUp size={14} />
                          </button>
                          <button onClick={() => moveProduct(index, 'down')} disabled={index === filteredProducts.length - 1} className="text-gray-500 hover:text-gray-900 p-1.5 hover:bg-white rounded transition-all disabled:opacity-30 disabled:hover:bg-transparent" title="Mover para baixo">
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => handleOpenModal(product)} 
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                        title="Editar Produto"
                      >
                        <Edit2 size={13} /> Editar
                      </button>

                      {confirmDeleteId === product.id ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 px-2 py-1 rounded-lg animate-in fade-in zoom-in duration-200">
                          <button onClick={() => handleDeleteConfirmed(product.id)} className="text-red-700 font-extrabold text-xs uppercase hover:underline px-1 py-0.5">Confirmar</button>
                          <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 hover:text-gray-600 p-0.5 bg-white border border-gray-200 rounded" title="Cancelar"><X size={12} /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(product.id)} 
                          className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                          title="Excluir Produto"
                        >
                          <Trash2 size={13} /> Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400 text-sm">Nenhum produto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="border-t border-gray-200 bg-gray-50/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2 text-sm font-medium">
            {hasUnsavedOrder ? (
              <div className="flex items-center gap-2 text-amber-900">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Você alterou a ordem dos produtos. Deseja salvar a nova ordenação?</span>
              </div>
            ) : saveStatus === 'success' ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={16} className="text-green-600 animate-bounce" />
                <span>Alterações salvas e publicadas no site com sucesso!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-500">
                <CheckCircle size={16} className="text-gray-400" />
                <span>Todas as alterações e ordenações estão sincronizadas com o site.</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {hasUnsavedOrder && (
              <button
                onClick={handleDiscardOrder}
                disabled={isSavingOrder || saveStatus === 'saving'}
                className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 px-4 py-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Descartar
              </button>
            )}
            <button
              onClick={handleSaveOrder}
              disabled={isSavingOrder || saveStatus === 'saving'}
              className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 disabled:opacity-75 px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSavingOrder || saveStatus === 'saving' ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Salvando...
                </>
              ) : (
                'Salvar / Atualizar Site'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Visualização em Cards para Mobile */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.map((product, index) => (
          <div key={product.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm space-y-4 relative overflow-hidden">
            {product.hidden && (
              <span className="absolute top-3 right-3 bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-gray-250">
                Oculto
              </span>
            )}
            <div className="flex gap-3">
              {product.image || (product.gallery && product.gallery.length > 0) ? (
                <img 
                  src={product.image || (product.gallery && product.gallery[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} 
                  alt={product.name} 
                  className="w-16 h-16 rounded-xl object-contain border border-gray-100 bg-white shrink-0 shadow-sm" 
                  onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gray-100 border border-gray-200 shrink-0"></div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-bold block mb-0.5">{product.category}</span>
                <h4 className="font-bold text-gray-950 text-base truncate">{product.name}</h4>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-base font-extrabold text-[var(--color-primary)]">{formatPrice(product.price)}</span>
                  {product.stock !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${product.stock > 0 ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Ações em Mobile */}
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              {search === '' && (
                <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                  <button onClick={() => moveProduct(index, 'up')} disabled={index === 0} className="text-gray-500 hover:text-gray-900 p-2 hover:bg-white rounded transition-all disabled:opacity-30" title="Mover para cima">
                    <ChevronUp size={14} />
                  </button>
                  <button onClick={() => moveProduct(index, 'down')} disabled={index === filteredProducts.length - 1} className="text-gray-500 hover:text-gray-900 p-2 hover:bg-white rounded transition-all disabled:opacity-30" title="Mover para baixo">
                    <ChevronDown size={14} />
                  </button>
                </div>
              )}

              <button 
                onClick={() => handleOpenModal(product)} 
                className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Edit2 size={14} /> Editar
              </button>

              {confirmDeleteId === product.id ? (
                <div className="flex-1 flex items-center justify-between bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl animate-in fade-in zoom-in duration-200">
                  <span className="text-red-700 text-[10px] font-bold uppercase">Confirmar?</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleDeleteConfirmed(product.id)} className="bg-red-600 text-white font-bold text-[10px] uppercase rounded px-2.5 py-1.5 shadow-sm hover:bg-red-700">Sim</button>
                    <button onClick={() => setConfirmDeleteId(null)} className="bg-white text-gray-500 border border-gray-300 p-1 rounded" title="Cancelar"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setConfirmDeleteId(product.id)} 
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredProducts.length === 0 && (
          <div className="bg-white border border-gray-200 p-8 text-center text-gray-400 text-sm rounded-2xl shadow-sm">
            Nenhum produto encontrado.
          </div>
        )}

        <div className="bg-white border border-gray-200 p-4 rounded-2xl flex flex-col items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-center">
            {hasUnsavedOrder ? (
              <div className="flex items-center justify-center gap-2 text-amber-900">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span>Você alterou a ordem dos produtos. Deseja salvar a nova ordenação?</span>
              </div>
            ) : saveStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle size={16} className="text-green-600 animate-bounce shrink-0" />
                <span>Alterações salvas e publicadas com sucesso!</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <CheckCircle size={16} className="text-gray-400 shrink-0" />
                <span>Sincronizado com o site</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 w-full shrink-0">
            {hasUnsavedOrder && (
              <button
                onClick={handleDiscardOrder}
                disabled={isSavingOrder || saveStatus === 'saving'}
                className="flex-1 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-800 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition-all cursor-pointer disabled:opacity-50"
              >
                Descartar
              </button>
            )}
            <button
              onClick={handleSaveOrder}
              disabled={isSavingOrder || saveStatus === 'saving'}
              className="flex-1 text-xs font-bold uppercase tracking-wider text-white bg-green-600 hover:bg-green-700 disabled:opacity-75 px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSavingOrder || saveStatus === 'saving' ? (
                <>
                  <Loader2 className="animate-spin" size={14} /> Salvando...
                </>
              ) : (
                'Salvar / Atualizar Site'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 relative border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0 pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 text-gray-900">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Produto</label>
                    <input required type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                    <select 
                      value={formData.category || ""} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {settings.categories?.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço (R$)</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.price !== undefined ? maskBRLCurrency(Math.round(formData.price * 100).toString()) : ''} 
                      onChange={e => {
                        const numericValue = parseBRLCurrency(e.target.value);
                        setFormData({...formData, price: numericValue});
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Original / Sem Desconto (R$)</label>
                    <input 
                      type="text" 
                      value={formData.compareAtPrice !== undefined ? maskBRLCurrency(Math.round(formData.compareAtPrice * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, compareAtPrice: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, compareAtPrice: numericValue});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                      placeholder="Opcional"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Desconto PIX (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      value={formData.pixDiscount !== undefined ? Math.round(formData.pixDiscount * 100) : ''} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, pixDiscount: isNaN(val) ? undefined : val / 100});
                      }} 
                      placeholder="Ex: 10"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Parcelas (sem juros)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={formData.installments || ''} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, installments: isNaN(val) ? undefined : val});
                      }} 
                      placeholder="Ex: 2"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Quantidade em Estoque</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.stock !== undefined ? formData.stock : ''} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, stock: isNaN(val) ? undefined : val});
                      }} 
                      placeholder="Sem limite (ilimitado)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Avaliação (Estrelas)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="5"
                      step="0.5"
                      value={formData.rating || ''} 
                      onChange={e => {
                        const val = parseFloat(e.target.value);
                        setFormData({...formData, rating: isNaN(val) ? undefined : val});
                      }} 
                      placeholder="Ex: 5"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Avaliações</label>
                    <input 
                      type="number" 
                      min="0"
                      value={formData.reviews || ''} 
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setFormData({...formData, reviews: isNaN(val) ? undefined : val});
                      }} 
                      placeholder="Ex: 15"
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                    />
                  </div>

                  <div className="space-y-1 col-span-2 flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div>
                      <label className="text-[12px] uppercase font-bold text-gray-900 block">Ocultar Produto</label>
                      <span className="text-[10px] text-gray-500">Produtos ocultos não aparecem na loja para os clientes.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={!!formData.hidden}
                        onChange={e => setFormData({...formData, hidden: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
                    </label>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Imagem Principal (Destaque)</label>
                      <label className="text-[10px] uppercase font-bold bg-[var(--color-primary)] text-white px-3 py-2 rounded-lg hover:brightness-110 cursor-pointer flex items-center gap-1 transition-all">
                        <PlusCircle size={14} /> Selecionar imagem principal
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, false)} />
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar por URL da imagem principal..." 
                        value={formData.image || ''}
                        onChange={e => setFormData({...formData, image: e.target.value})}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                      />
                    </div>
                    {formData.image && (
                      <div className="relative group w-20 h-20 rounded border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                        <img 
                          src={formData.image} 
                          alt="Principal" 
                          className="w-full h-full object-contain" 
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, image: ''})}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Galeria de Imagens (Carrossel)</label>
                      <label className="text-[10px] uppercase font-bold bg-[var(--color-primary)] text-white px-3 py-2 rounded-lg hover:brightness-110 cursor-pointer flex items-center gap-1 transition-all">
                        <PlusCircle size={14} /> Buscar múltiplas imagens
                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(e, true)} />
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar por URL da imagem..." 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value;
                            if (val) {
                              setFormData(prev => ({
                                ...prev,
                                gallery: [...(prev.gallery || []), val]
                              }));
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          const val = input.value;
                          if (val) {
                            setFormData(prev => ({
                              ...prev,
                              gallery: [...(prev.gallery || []), val]
                            }));
                            input.value = '';
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Adicionar
                      </button>
                    </div>
                    {formData.gallery && formData.gallery.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {formData.gallery.map((img, index) => (
                          <div key={index} className="relative group w-16 h-16 rounded border border-gray-200 overflow-hidden">
                            <img 
                              src={img || undefined} 
                              alt={`Galeria ${index}`} 
                              className="w-full h-full object-contain" 
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 col-span-2">
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => insertFormatting('<strong>', '</strong>')} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" title="Negrito"><Bold size={14} /></button>
                        <button type="button" onClick={() => insertFormatting('<em>', '</em>')} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" title="Itálico"><Italic size={14} /></button>
                        <button type="button" onClick={() => insertFormatting('<p>', '</p>')} className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" title="Parágrafo"><AlignLeft size={14} /></button>
                        <button type="button" onClick={() => insertFormatting('<br/>', '')} className="p-1 px-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold" title="Quebra de Linha">BR</button>
                      </div>
                    </div>
                    <textarea 
                      ref={descriptionRef}
                      rows={6} 
                      value={formData.description || ""} 
                      onChange={e => setFormData({...formData, description: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none resize-y" 
                    />
                  </div>

                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddColor} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
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
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                              placeholder="Nome da cor"
                            />
                            <button type="button" onClick={() => handleRemoveColor(index)} className="p-2 text-red-500 hover:text-red-600 transition-colors shrink-0">
                              <MinusCircle size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-[var(--color-primary)] text-white hover:brightness-110 transition-all">Salvar Produto</button>
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
                <Tags size={24} className="text-[var(--color-primary)]" /> Categorias
              </h3>
              <button onClick={() => setIsCategoriesModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="new-category"
                  placeholder="Nova categoria..." 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val && !settings.categories?.includes(val)) {
                        updateSettings({ categories: [...(settings.categories || []), val] });
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => {
                    const input = document.getElementById('new-category') as HTMLInputElement;
                    const val = input.value.trim();
                    if (val && !settings.categories?.includes(val)) {
                      updateSettings({ categories: [...(settings.categories || []), val] });
                      input.value = '';
                    }
                  }}
                  className="bg-[var(--color-primary)] text-white p-2 rounded-lg hover:brightness-110"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="space-y-2 mt-4">
                {settings.categories?.map((cat, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (settings.categories?.length || 0) - 1;
                  return (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 gap-2 hover:border-gray-200 transition-all">
                      <span className="text-sm font-medium text-gray-900 flex-1 truncate">{cat}</span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => {
                            const cats = [...(settings.categories || [])];
                            if (idx > 0) {
                              const temp = cats[idx];
                              cats[idx] = cats[idx - 1];
                              cats[idx - 1] = temp;
                              updateSettings({ categories: cats });
                            }
                          }}
                          className={`p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-all ${isFirst ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:text-gray-900'}`}
                          title="Mover para cima"
                        >
                          <ChevronUp size={16} />
                        </button>
                        
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => {
                            const cats = [...(settings.categories || [])];
                            if (idx < cats.length - 1) {
                              const temp = cats[idx];
                              cats[idx] = cats[idx + 1];
                              cats[idx + 1] = temp;
                              updateSettings({ categories: cats });
                            }
                          }}
                          className={`p-1.5 rounded-md hover:bg-gray-200 text-gray-600 transition-all ${isLast ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer hover:text-gray-900'}`}
                          title="Mover para baixo"
                        >
                          <ChevronDown size={16} />
                        </button>

                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        <button 
                          type="button"
                          onClick={() => {
                            if (confirm(`Tem certeza de que deseja excluir a categoria "${cat}"?`)) {
                              updateSettings({ categories: settings.categories?.filter(c => c !== cat) });
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-all cursor-pointer"
                          title="Excluir categoria"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(!settings.categories || settings.categories.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma categoria cadastrada.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
