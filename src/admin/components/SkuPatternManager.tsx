import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, CheckCircle, Barcode, Loader2, Play } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { toast } from 'react-hot-toast';
import { db } from '../../lib/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { Product } from '../../data/products';

interface SkuPatternManagerProps {
  onClose: () => void;
  products: Product[];
  onProductsUpdated: (products: Product[]) => void;
}

export function SkuPatternManager({ onClose, products, onProductsUpdated }: SkuPatternManagerProps) {
  const { settings, updateSettings } = useSettings();
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [category, setCategory] = useState('');
  const [prefix, setPrefix] = useState('');
  const [nextNumber, setNextNumber] = useState(1);
  const [autoApply, setAutoApply] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  
  const patterns = settings.skuPatterns || [];

  const handleSave = async () => {
    if (!category || !prefix) {
      toast.error('Preencha a categoria e o prefixo.');
      return;
    }
    
    const toastId = toast.loading(autoApply ? 'Aplicando padrão e salvando...' : 'Salvando padrão...');
    try {
      let currentNum = nextNumber;
      let hasChanges = false;
      const updatedProducts = [...products];

      if (autoApply) {
        const batch = writeBatch(db);
        for (let i = 0; i < updatedProducts.length; i++) {
          const p = updatedProducts[i];
          if (p.category === category) {
              const newSku = `${prefix}${String(currentNum).padStart(3, '0')}`;
              currentNum++;
              hasChanges = true;
              batch.set(doc(db, 'products', String(p.id)), { sku: newSku }, { merge: true });
              updatedProducts[i] = { ...p, sku: newSku };
          }
        }
        if (hasChanges) {
          await batch.commit();
          onProductsUpdated(updatedProducts);
        }
      }

      let newPatterns = [...patterns];
      if (editingId) {
        newPatterns = newPatterns.map(p => p.id === editingId ? { ...p, category, prefix, nextNumber: currentNum } : p);
      } else {
        newPatterns.push({
          id: Math.random().toString(36).substring(7),
          category,
          prefix,
          nextNumber: currentNum
        });
      }
      
      await updateSettings({ skuPatterns: newPatterns });
      toast.success(autoApply && hasChanges ? 'Padrão salvo e produtos atualizados!' : 'Padrão salvo!', { id: toastId });
      setEditingId(null);
      setCategory('');
      setPrefix('');
      setNextNumber(1);
    } catch (e) {
      toast.error('Erro ao salvar.', { id: toastId });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Deseja excluir este padrão?')) return;
    const newPatterns = patterns.filter(p => p.id !== id);
    await updateSettings({ skuPatterns: newPatterns });
  };
  
  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setCategory(p.category);
    setPrefix(p.prefix);
    setNextNumber(p.nextNumber);
  };

  const handleApply = async (pattern: any) => {
     if (isApplying) return;
     setIsApplying(true);
     const toastId = toast.loading(`Aplicando padrão na categoria ${pattern.category}...`);
     
     try {
       const batch = writeBatch(db);
       let currentNum = pattern.nextNumber;
       let hasChanges = false;
       const updatedProducts = [...products];
       
       for (let i = 0; i < updatedProducts.length; i++) {
         const p = updatedProducts[i];
         if (p.category === pattern.category && !p.sku) {
             const newSku = `${pattern.prefix}${String(currentNum).padStart(3, '0')}`;
             currentNum++;
             hasChanges = true;
             batch.set(doc(db, 'products', String(p.id)), { sku: newSku }, { merge: true });
             updatedProducts[i] = { ...p, sku: newSku };
         }
       }
       
       if (!hasChanges) {
         toast.success('Nenhum produto sem SKU nesta categoria.', { id: toastId });
         setIsApplying(false);
         return;
       }
       
       await batch.commit();
       
       const newPatterns = patterns.map(p => p.id === pattern.id ? { ...p, nextNumber: currentNum } : p);
       await updateSettings({ skuPatterns: newPatterns });
       
       onProductsUpdated(updatedProducts);
       toast.success('SKUs aplicados com sucesso!', { id: toastId });
     } catch(e) {
       toast.error('Erro ao aplicar SKUs.', { id: toastId });
     } finally {
       setIsApplying(false);
     }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0">
          <h3 className="text-xl font-bold uppercase tracking-wider flex items-center gap-3">
            <Barcode size={24} className="text-[var(--color-primary)]" /> Padrões de SKU
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {/* Form */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl mb-6">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3">
              {editingId ? 'Editar Padrão' : 'Criar Novo Padrão'}
            </h4>
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="w-full sm:w-1/3">
                <label className="text-[10px] uppercase font-bold text-blue-700 mb-1 block">Categoria Vinculada</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)} 
                  className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="">Selecione a Categoria</option>
                  {settings.categories?.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-1/3">
                <label className="text-[10px] uppercase font-bold text-blue-700 mb-1 block">Prefixo</label>
                <input 
                  type="text" 
                  value={prefix} 
                  onChange={e => setPrefix(e.target.value)} 
                  placeholder="Ex: CAN/CRIST-"
                  className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="w-full sm:w-1/4">
                <label className="text-[10px] uppercase font-bold text-blue-700 mb-1 block">Número Atual</label>
                <input 
                  type="number" 
                  min="1"
                  value={nextNumber} 
                  onChange={e => setNextNumber(parseInt(e.target.value) || 1)} 
                  className="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-sm focus:border-blue-500 outline-none"
                />
              </div>
              <div className="w-full sm:w-auto">
                <button 
                  onClick={handleSave}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  {editingId ? <CheckCircle size={16} /> : <Plus size={16} />}
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-3">
              {prefix && (
                 <p className="text-xs text-blue-800 font-medium">
                   Exemplo do próximo código: <strong className="font-extrabold">{prefix}{String(nextNumber).padStart(3, '0')}</strong>
                 </p>
              )}
              <div className="flex items-center gap-2">
                 <input 
                   type="checkbox" 
                   id="auto-apply-pattern" 
                   checked={autoApply} 
                   onChange={e => setAutoApply(e.target.checked)} 
                   className="w-3.5 h-3.5 text-blue-600 rounded"
                 />
                 <label htmlFor="auto-apply-pattern" className="text-xs font-bold text-blue-700 cursor-pointer">
                   Aplicar automaticamente em todos os produtos da categoria ao salvar
                 </label>
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-3">
             <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Padrões Cadastrados</h4>
             {patterns.length === 0 ? (
               <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
                 Nenhum padrão de SKU criado ainda.
               </div>
             ) : (
               patterns.map((p) => (
                 <div key={p.id} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-blue-200 transition-colors bg-white">
                   <div className="flex-1">
                     <div className="flex items-center gap-2 mb-1">
                       <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{p.category}</span>
                       <span className="text-sm font-black text-gray-900">{p.prefix}</span>
                     </div>
                     <div className="text-xs text-gray-500 font-medium">
                       Próximo código será: <span className="font-bold text-gray-700">{p.prefix}{String(p.nextNumber).padStart(3, '0')}</span>
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2 w-full sm:w-auto">
                     <button
                       onClick={() => handleApply(p)}
                       disabled={isApplying}
                       className="flex-1 sm:flex-none bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                     >
                       {isApplying ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                       Aplicar aos Produtos
                     </button>
                     <button
                       onClick={() => handleEdit(p)}
                       className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                       title="Editar Padrão"
                     >
                       <Edit2 size={16} />
                     </button>
                     <button
                       onClick={() => handleDelete(p.id)}
                       className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                       title="Excluir Padrão"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
