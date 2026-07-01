import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, X, PlusCircle, MinusCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { formatPrice, Product } from '../../data/products';
import { useProducts } from '../../context/ProductContext';


export function Products() {
  const { products, setProducts } = useProducts();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) setEditingProduct(product);
    else setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleDeleteConfirmed = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setConfirmDeleteId(null);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const actualIndex = products.findIndex(p => p.id === filteredProducts[index].id);
    if (actualIndex < 0) return;
    
    if (direction === 'up' && actualIndex > 0) {
      const newProducts = [...products];
      const temp = newProducts[actualIndex];
      newProducts[actualIndex] = newProducts[actualIndex - 1];
      newProducts[actualIndex - 1] = temp;
      setProducts(newProducts);
    } else if (direction === 'down' && actualIndex < products.length - 1) {
      const newProducts = [...products];
      const temp = newProducts[actualIndex];
      newProducts[actualIndex] = newProducts[actualIndex + 1];
      newProducts[actualIndex + 1] = temp;
      setProducts(newProducts);
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
              ctx?.drawImage(img, 0, 0, width, height);
              resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      if (isGallery) {
        const promises = files.map(file => resizeImage(file));
        Promise.all(promises).then(results => {
          setFormData(prev => ({
            ...prev,
            gallery: [...(prev.gallery || []), ...results]
          }));
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } as Product : p));
    } else {
      setProducts([...products, { ...formData, id: Date.now().toString() } as Product]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Produtos</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
        >
          <Plus size={18} /> Novo Produto
        </button>
      </div>

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

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Produto</th>
                <th className="p-4 font-bold">Categoria</th>
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
                        className="w-10 h-10 rounded object-contain border border-gray-200 shrink-0" 
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 shrink-0"></div>
                    )}
                    <span className="font-medium text-sm text-gray-900 group-hover:text-cyan-600">{product.name}</span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{product.category}</td>
                  <td className="p-4 text-sm font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</td>
                  <td className="p-4 text-right">
                    {search === '' && (
                      <>
                        <button onClick={() => moveProduct(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-cyan-600 p-2 transition-colors inline-block align-middle disabled:opacity-30 disabled:hover:text-gray-400" title="Mover para cima">
                          <ChevronUp size={16} />
                        </button>
                        <button onClick={() => moveProduct(index, 'down')} disabled={index === filteredProducts.length - 1} className="text-gray-400 hover:text-cyan-600 p-2 transition-colors inline-block align-middle disabled:opacity-30 disabled:hover:text-gray-400" title="Mover para baixo">
                          <ChevronDown size={16} />
                        </button>
                      </>
                    )}
                    <button onClick={() => handleOpenModal(product)} className="text-gray-400 hover:text-cyan-600 p-2 transition-colors inline-block align-middle" title="Editar">
                      <Edit2 size={16} />
                    </button>
                    {confirmDeleteId === product.id ? (
                      <div className="inline-flex items-center gap-2 ml-2 bg-red-50 px-2 py-1 rounded">
                        <button onClick={() => handleDeleteConfirmed(product.id)} className="text-red-500 font-bold text-xs uppercase hover:underline">Confirmar</button>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-gray-400 text-xs font-bold uppercase hover:text-gray-600"><X size={14} /></button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDeleteId(product.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors inline-block align-middle" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">Nenhum produto encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl p-6 relative border border-gray-200 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-4 text-gray-900">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Produto</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                  <input type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Preço (R$)</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.price?.toString().replace('.', ',') || ''} 
                    onChange={e => {
                      const val = e.target.value.replace(',', '.');
                      const parsed = parseFloat(val);
                      setFormData({...formData, price: isNaN(parsed) ? (val === '' ? 0 : formData.price) : parsed});
                    }} 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                  />
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
                            src={img} 
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
                  <label className="text-[10px] uppercase font-bold text-gray-500">Descrição</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none resize-none" />
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

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg font-bold text-sm uppercase tracking-wider bg-[var(--color-primary)] text-white hover:brightness-110 transition-all">Salvar Produto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
