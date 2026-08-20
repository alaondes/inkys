import React, { useState, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, X, PlusCircle, MinusCircle, ChevronUp, ChevronDown, Bold, Italic, AlignLeft, Tags, CheckCircle, Loader2, Barcode, Calculator, Sparkles, TrendingUp, DollarSign, Info, PieChart, Receipt, Package, Building2, LayoutGrid, List, Image as ImageIcon, RefreshCw, Lock } from 'lucide-react';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { formatPrice, Product } from '../../data/products';
import { SkuPatternManager } from '../components/SkuPatternManager';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import { calculateSuggestedPrice, calculateActualProductProfitability, calculateSuggestedPriceFromProfitVal } from '../../lib/pricingUtils';
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
  const [showBanners, setShowBanners] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isSkuModalOpen, setIsSkuModalOpen] = useState(false);
  const [skuPrefix, setSkuPrefix] = useState('PROD-');
  const [skuStartNumber, setSkuStartNumber] = useState(1);
  const [skuCategory, setSkuCategory] = useState('');
  const [overwriteSkus, setOverwriteSkus] = useState(false);
  const [editedSkus, setEditedSkus] = useState<Record<string, string>>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [profitModalProduct, setProfitModalProduct] = useState<Product | null>(null);
  const [initialCategory, setInitialCategory] = useState('');

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [localBanners, setLocalBanners] = useState<any[]>([]);
  const [isSavingBanners, setIsSavingBanners] = useState(false);

  React.useEffect(() => {
    if (settings?.productBanners) {
      setLocalBanners(settings.productBanners);
    }
  }, [settings]);

  const hasUnsavedBanners = JSON.stringify(localBanners) !== JSON.stringify(settings?.productBanners || []);

  const handleSaveBanners = async () => {
    setIsSavingBanners(true);
    const loadToast = toast.loading('Salvando banners...');
    try {
      await updateSettings({ productBanners: localBanners });
      toast.success('Banners salvos com sucesso!', { id: loadToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao salvar os banners no banco de dados.', { id: loadToast });
    } finally {
      setIsSavingBanners(false);
    }
  };

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

  const handleSaveBatchSkus = async () => {
    setIsSavingOrder(true);
    const loadToast = toast.loading('Salvando SKUs...');
    try {
      const batch = writeBatch(db);
      const updatedProducts = [...localProducts];
      let hasChanges = false;
      
      for (let i = 0; i < updatedProducts.length; i++) {
          const p = updatedProducts[i];
          const newSku = editedSkus[p.id];
          if (newSku !== undefined && newSku !== (p.sku || '')) {
              hasChanges = true;
              batch.set(doc(db, 'products', String(p.id)), { sku: newSku }, { merge: true });
              updatedProducts[i] = { ...p, sku: newSku };
          }
      }
      
      if (!hasChanges) {
          toast.success('Nenhuma alteração para salvar.', { id: loadToast });
          setIsSkuModalOpen(false);
          return;
      }
      
      await batch.commit();
      setLocalProducts(updatedProducts);
      setEditedSkus({});
      setIsSkuModalOpen(false);
      toast.success('SKUs salvos com sucesso!', { id: loadToast });
    } catch (err: any) {
      console.error('Erro ao salvar SKUs:', err);
      toast.error('Erro ao salvar SKUs.', { id: loadToast });
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

  const filteredProducts = localProducts.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategoryFilter === 'Todos' || (p.category || 'Sem Categoria') === selectedCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    localProducts.forEach(p => {
      const cat = p.category || 'Sem Categoria';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [localProducts]);

  const allCategoryList = Object.keys(categoriesWithCounts).sort();

  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category || 'Sem Categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, typeof filteredProducts>);

  const productCategories = Object.keys(groupedProducts).sort();

  const handleOpenModal = (product?: Product, category?: string) => {
    if (product) {
      setEditingProduct(product);
      setInitialCategory('');
    } else {
      setEditingProduct(null);
      setInitialCategory(category || '');
    }
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

  const handleRecalculateSingleProductPrice = async (product: Product) => {
    if (!product.costPrice || product.costPrice <= 0) {
      toast.error("Este produto não possui preço de custo cadastrado.");
      return;
    }

    const loadToast = toast.loading(`Recalculando preço para: ${product.name}...`);
    try {
      const rules: any = settings.pricingRules || {};
      
      // Calculate effective fixed cost pct with safeguard:
      let effectiveFixedCostPct = 0;
      if (rules.estimatedMonthlyRevenue && rules.estimatedMonthlyRevenue > 100) {
        const rent = rules.rentCostMonthly || 0;
        const utilities = rules.utilitiesCostMonthly || 0;
        const salaries = rules.salariesCostMonthly || 0;
        const marketing = rules.marketingCostMonthly || 0;
        const software = rules.softwareAccountingCostMonthly || 0;
        const other = rules.otherFixedCostsMonthly || 0;
        const totalFixed = rent + utilities + salaries + marketing + software + other;
        effectiveFixedCostPct = Math.min(80, (totalFixed / rules.estimatedMonthlyRevenue) * 100);
      }

      const taxRatePct = rules.taxRatePct || 0;
      const gatewayFeePct = rules.gatewayFeePct || 0;
      const commissionPct = rules.commissionPct || 0;
      const defaultPackagingCost = rules.defaultPackagingCost !== undefined ? rules.defaultPackagingCost : 2.00;
      const defaultProfitPct = rules.desiredProfitPct !== undefined ? rules.desiredProfitPct : 20;

      const costPrice = Number(product.costPrice) || 0;
      const customPackaging = product.selectedPackagingId === 'none' ? 0 : (
        product.selectedPackagingId === 'default' || !product.selectedPackagingId ? (
          product.packagingCost !== undefined ? Number(product.packagingCost) : defaultPackagingCost
        ) : (
          (settings.packagingModels || []).find((m: any) => m.id === product.selectedPackagingId)?.cost ?? (
            product.packagingCost !== undefined ? Number(product.packagingCost) : defaultPackagingCost
          )
        )
      );

      const profitVal = product.desiredProfit !== undefined ? Number(product.desiredProfit) : undefined;
      const desiredProfitPct = defaultProfitPct;

      let newPrice = 0;
      if (profitVal !== undefined && profitVal > 0) {
        const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct));
        const divisor = Math.max(0.01, 1 - (sumPct / 100));
        newPrice = (costPrice + customPackaging + profitVal) / divisor;
      } else {
        const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct + desiredProfitPct));
        const divisor = Math.max(0.01, 1 - (sumPct / 100));
        newPrice = (costPrice + customPackaging) / divisor;
      }

      const roundedPrice = Math.round(newPrice * 100) / 100;
      
      const updatedProduct = {
        ...product,
        price: roundedPrice
      };

      await updateProduct(updatedProduct);
      setLocalProducts(prev => prev.map(p => p.id === product.id ? updatedProduct : p));
      
      toast.success(`Preço recalculado com sucesso: R$ ${roundedPrice.toFixed(2).replace('.', ',')}`, { id: loadToast });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao recalcular o preço deste produto.', { id: loadToast });
    }
  };

  const handleRecalculatePrices = async () => {
    if (!window.confirm("Deseja realmente recalcular o preço de todos os produtos cadastrados? Os preços serão corrigidos com base nas regras financeiras atuais (sem a taxa de rateio de custos fixos, caso o faturamento mensal seja muito baixo). Isso atualizará todos os preços incorretos automaticamente.")) {
      return;
    }
    
    setIsRecalculating(true);
    const loadToast = toast.loading('Recalculando preços de todos os produtos...');
    
    try {
      const rules: any = settings.pricingRules || {};
      
      // Calculate effective fixed cost pct with safeguard:
      let effectiveFixedCostPct = 0;
      if (rules.estimatedMonthlyRevenue && rules.estimatedMonthlyRevenue > 100) {
        const rent = rules.rentCostMonthly || 0;
        const utilities = rules.utilitiesCostMonthly || 0;
        const salaries = rules.salariesCostMonthly || 0;
        const marketing = rules.marketingCostMonthly || 0;
        const software = rules.softwareAccountingCostMonthly || 0;
        const other = rules.otherFixedCostsMonthly || 0;
        const totalFixed = rent + utilities + salaries + marketing + software + other;
        effectiveFixedCostPct = (totalFixed / rules.estimatedMonthlyRevenue) * 100;
      }

      const taxRatePct = rules.taxRatePct || 0;
      const gatewayFeePct = rules.gatewayFeePct || 0;
      const commissionPct = rules.commissionPct || 0;
      const defaultPackagingCost = rules.defaultPackagingCost !== undefined ? rules.defaultPackagingCost : 2.00;
      const defaultProfitPct = rules.desiredProfitPct !== undefined ? rules.desiredProfitPct : 20;

      let count = 0;
      for (const productObj of products) {
        const product = productObj as any;
        const costPrice = Number(product.costPrice) || 0;
        
        const customPackaging = product.selectedPackagingId === 'none' ? 0 : (
          product.selectedPackagingId === 'default' || !product.selectedPackagingId ? (
            product.packagingCost !== undefined ? Number(product.packagingCost) : (product.customPackaging !== undefined ? Number(product.customPackaging) : defaultPackagingCost)
          ) : (
            (settings.packagingModels || []).find((m: any) => m.id === product.selectedPackagingId)?.cost ?? (
              product.packagingCost !== undefined ? Number(product.packagingCost) : (product.customPackaging !== undefined ? Number(product.customPackaging) : defaultPackagingCost)
            )
          )
        );
        
        const profitVal = product.profitVal !== undefined ? Number(product.profitVal) : undefined;
        const desiredProfitPct = product.desiredProfitPct !== undefined ? Number(product.desiredProfitPct) : defaultProfitPct;
        
        let newPrice = 0;
        
        if (profitVal !== undefined && profitVal > 0) {
          // Calculate from profit value
          const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct));
          const divisor = Math.max(0.01, 1 - (sumPct / 100));
          newPrice = (costPrice + customPackaging + profitVal) / divisor;
        } else {
          // Calculate from percentage
          const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct + desiredProfitPct));
          const divisor = Math.max(0.01, 1 - (sumPct / 100));
          newPrice = (costPrice + customPackaging) / divisor;
        }
        
        const roundedPrice = Math.round(newPrice * 100) / 100;
        
        if (product.price !== roundedPrice) {
          await updateProduct({
            ...product,
            price: roundedPrice
          });
          count++;
        }
      }
      
      toast.success(`Preços recalculados com sucesso! ${count} produtos foram atualizados no banco de dados.`, { id: loadToast });
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao recalcular os preços dos produtos.', { id: loadToast });
    } finally {
      setIsRecalculating(false);
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

  
  const handleProductBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 1200;
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
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
              }
              resolve(canvas.toDataURL('image/webp', 0.7));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      const loadToast = toast.loading('Processando imagens...');
      Promise.all(files.map(f => resizeImage(f))).then(results => {
        const newBanners = [...localBanners, ...results.map(r => ({ image: r, link: "" }))];
        setLocalBanners(newBanners);
        toast.success('Banners adicionados localmente! Clique em salvar para confirmar.', { id: loadToast });
      }).catch(err => {
        toast.error('Erro ao processar imagens', { id: loadToast });
      });
    }
    e.target.value = '';
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {
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
              resolve(canvas.toDataURL('image/webp', 0.7));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      if (target === "gallery") {
        const promises = files.map(file => resizeImage(file));
        Promise.all(promises).then(results => {
          setFormData(prev => {
            const newGallery = [...(prev[target] || []), ...results];
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

  const [draggedGalleryIndex, setDraggedGalleryIndex] = useState<number | null>(null);

  const handleGalleryDrop = (targetIndex: number) => {
    if (draggedGalleryIndex === null || draggedGalleryIndex === targetIndex) return;
    setFormData(prev => {
      const newGallery = [...(prev.gallery || [])];
      const draggedItem = newGallery[draggedGalleryIndex];
      newGallery.splice(draggedGalleryIndex, 1);
      newGallery.splice(targetIndex, 0, draggedItem);
      return { ...prev, gallery: newGallery };
    });
    setDraggedGalleryIndex(null);
  };

  const currentProductEmptyTemplate: Partial<Product> = {
    name: '', category: '', sku: '', description: '', price: 0, costPrice: undefined, packagingCost: undefined, compareAtPrice: undefined, image: '', colors: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(currentProductEmptyTemplate);
  const [modalActiveTab, setModalActiveTab] = React.useState<'geral' | 'precificacao' | 'estoque'>('geral');

  const isPrecedingFieldsFilled = !!(
    formData.name?.trim() && 
    formData.category && 
    ((formData.costPrice !== undefined && formData.costPrice > 0) || (formData.selectedMaterialIds && formData.selectedMaterialIds.length > 0))
  );

  const generateNextSku = (categoryName: string) => {
    if (!categoryName) return '';
    const catProds = localProducts.filter(p => p.category === categoryName && p.sku);
    let prefix = '';
    let maxNumber = 0;
    
    if (catProds.length > 0) {
      const newestProduct = [...catProds].sort((a, b) => b.id.localeCompare(a.id))[0];
      const matchNewest = newestProduct.sku?.match(/^(.+?)(\d+)$/);
      if (matchNewest) {
        prefix = matchNewest[1];
      }

      for (const p of catProds) {
        const match = p.sku?.match(/^(.+?)(\d+)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    } else {
      // Se a categoria estiver vazia, busca o maior número em todos os produtos
      // para manter a sequência global, caso o usuário use um prefixo único
      const allProds = localProducts.filter(p => p.sku);
      if (allProds.length > 0) {
        const newestProduct = [...allProds].sort((a, b) => b.id.localeCompare(a.id))[0];
        const matchNewest = newestProduct.sku?.match(/^(.+?)(\d+)$/);
        if (matchNewest) {
          prefix = matchNewest[1];
        }
      }
      for (const p of allProds) {
        const match = p.sku?.match(/^(.+?)(\d+)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    if (!prefix) {
      prefix = categoryName.substring(0, 3).toUpperCase() + '-';
    }
    
    return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
  };

  // Update formData when modal opens
  React.useEffect(() => {
    if (isModalOpen) {
      setModalActiveTab('geral');
      if (editingProduct) {
        const pkgId = (editingProduct as any).selectedPackagingId || (editingProduct.packagingCost === 0 ? 'none' : 'default');
        setFormData({ 
          ...editingProduct, 
          selectedPackagingId: pkgId,
          colors: editingProduct.colors ? [...editingProduct.colors] : [] 
        });
      } else {
        const autoSku = generateNextSku(initialCategory);
        const defaultPkg = settings?.pricingRules?.defaultPackagingCost ?? 2.00;
        setFormData({ 
          ...currentProductEmptyTemplate, 
          category: initialCategory, 
          sku: autoSku,
          selectedPackagingId: 'default',
          packagingCost: defaultPkg
        });
      }
    }
  }, [isModalOpen, editingProduct, initialCategory, settings]);

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-fallback main image to first gallery image if main image is empty/not set
    const mainImage = formData.image || (formData.gallery && formData.gallery[0]) || '';
    
    // Normalize promotional price & regular selling price
    let pSelling = formData.price || 0;
    let pCompare = formData.compareAtPrice;

    if (pCompare !== undefined && pCompare > 0 && pSelling > 0) {
      if (pCompare < pSelling) {
        // If user typed lower price in compareAtPrice (or vice-versa), normalize so
        // price = effective selling price (lower) and compareAtPrice = original list price (higher)
        const temp = pSelling;
        pSelling = pCompare;
        pCompare = temp;
      } else if (pCompare === pSelling) {
        pCompare = undefined;
      }
    }

    const finalFormData = { ...formData, price: pSelling, compareAtPrice: pCompare, image: mainImage };

    const loadToast = toast.loading(editingProduct ? 'Salvando alterações...' : 'Criando produto...');
    try {
      if (editingProduct) {
        const updatedProduct = { ...editingProduct, ...finalFormData } as Product;
        let productsToUpdate = [updatedProduct];
        
        // CHECK IF SKU PREFIX CHANGED
        const oldMatch = editingProduct.sku?.match(/^(.+?)(\d+)$/);
        const newMatch = updatedProduct.sku?.match(/^(.+?)(\d+)$/);
        
        if (oldMatch && newMatch && oldMatch[1] !== newMatch[1]) {
           const oldPrefix = oldMatch[1];
           const newPrefix = newMatch[1];
           
           const categoryProductsToUpdate = localProducts
             .filter(p => p.id !== updatedProduct.id && p.category === updatedProduct.category && p.sku?.startsWith(oldPrefix))
             .map(p => ({
                 ...p,
                 sku: p.sku!.replace(oldPrefix, newPrefix)
             }));
             
           if (categoryProductsToUpdate.length > 0) {
              productsToUpdate = [updatedProduct, ...categoryProductsToUpdate];
           }
        }
        
        if (productsToUpdate.length === 1) {
          await updateProduct(updatedProduct);
          setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          toast.success('Produto atualizado com sucesso!', { id: loadToast });
        } else {
          // Bulk update
          const newLocal = localProducts.map(p => {
             const found = productsToUpdate.find(pu => pu.id === p.id);
             return found || p;
          });
          setLocalProducts(newLocal);
          await setProducts(newLocal); // saves all and their orders
          toast.success(`Produto e ${productsToUpdate.length - 1} SKUs atualizados!`, { id: loadToast });
        }
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

  const handleRecalculateAllPrices = async () => {
    if (!localProducts || localProducts.length === 0) {
      toast.error('Nenhum produto cadastrado para recalcular.');
      return;
    }

    const confirm = window.confirm(`Deseja recalcular e aplicar o preço de venda sugerido para todos os ${localProducts.length} produtos da loja com base nas regras ativas de precificação?`);
    if (!confirm) return;

    const loadToast = toast.loading('Recalculando preços com base na precificação fixa...');
    try {
      let updatedCount = 0;
      const updatedProducts = localProducts.map(p => {
        if (p.costPrice !== undefined && p.costPrice > 0) {
          const calc = calculateSuggestedPrice(p.costPrice, settings?.pricingRules, p.packagingCost, undefined, p.desiredProfit);
          if (calc.suggestedPrice > 0) {
            updatedCount++;
            return {
              ...p,
              price: Math.round(calc.suggestedPrice * 100) / 100
            };
          }
        }
        return p;
      });

      setLocalProducts(updatedProducts);
      await setProducts(updatedProducts);
      toast.success(`Preço recalculado e aplicado em ${updatedCount} produtos!`, { id: loadToast });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao recalcular preços dos produtos.', { id: loadToast });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header do Catálogo */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Catálogo de Produtos</h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-0.5 rounded-full border border-blue-100">
              {localProducts.length} {localProducts.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            Gerencie seu catálogo, precificação DRE, categorias e banners de destaque em um único lugar.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button 
            type="button"
            onClick={() => setShowBanners(!showBanners)}
            className={`px-3.5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all border ${
              showBanners 
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs' 
                : 'bg-slate-100/80 text-slate-700 border-slate-200/80 hover:bg-slate-200/80'
            }`}
          >
            <ImageIcon size={15} />
            Banners ({localBanners.length})
          </button>
          
          <button 
            type="button"
            onClick={() => setIsSkuModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-slate-100/80 text-slate-700 border border-slate-200/80 hover:bg-slate-200/80 flex items-center gap-2 transition-all"
          >
            <Barcode size={15} /> SKUs
          </button>

          <button 
            type="button"
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 transition-all shadow-xs"
          >
            <Tags size={15} /> Categorias
          </button>

          <button 
            type="button"
            onClick={() => handleOpenModal()}
            className="px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            <Plus size={16} /> Novo Produto
          </button>
        </div>
      </div>

      {/* Accordion / Painel Colapsável de Banners */}
      {showBanners && (
        <div className="bg-white border border-amber-200/80 rounded-3xl p-6 shadow-xs animate-in fade-in duration-300 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-amber-100">
            <div>
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wider mb-1 flex items-center gap-2">
                <ImageIcon className="text-amber-500" size={18} />
                Banners de Destaque dos Produtos
              </h3>
              <p className="text-slate-500 text-xs">Estes banners aparecerão em carrossel na página de detalhes de todos os produtos do catálogo.</p>
            </div>
            <button
              type="button"
              disabled={isSavingBanners || !hasUnsavedBanners}
              onClick={handleSaveBanners}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-xs ${
                hasUnsavedBanners 
                  ? 'bg-amber-500 text-white hover:bg-amber-600 animate-pulse' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isSavingBanners ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  Salvar Banners
                </>
              )}
            </button>
          </div>

          <div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-6">
              <div className="sm:col-span-3">
                <label className="flex items-center justify-center gap-2 bg-slate-900 text-white w-full py-2.5 rounded-2xl text-xs font-bold cursor-pointer hover:bg-slate-800 transition-all shadow-xs min-h-[44px]">
                  <PlusCircle size={16} />
                  Fazer Upload
                  <input type="file" className="hidden" multiple accept="image/*" onChange={handleProductBannerUpload} />
                </label>
              </div>
              <div className="sm:col-span-9 flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  id="banner-url-input"
                  placeholder="Ou colar URL da imagem..." 
                  className="flex-1 bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs focus:border-amber-500 focus:bg-white outline-none transition-all min-h-[44px]" 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        setLocalBanners(prev => [...prev, { image: convertGoogleDriveUrl(val), link: "" }]);
                        e.currentTarget.value = '';
                        toast.success('Banner adicionado! Clique em Salvar Banners.');
                      }
                    }
                  }}
                />
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('banner-url-input') as HTMLInputElement;
                    const val = input?.value.trim();
                    if (val) {
                      setLocalBanners(prev => [...prev, { image: convertGoogleDriveUrl(val), link: "" }]);
                      input.value = '';
                      toast.success('Banner adicionado! Clique em Salvar Banners.');
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-amber-600 transition-all shadow-xs min-h-[44px]"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {(localBanners && localBanners.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {localBanners.map((item: any, index: number) => {
                  const img = typeof item === 'string' ? item : item.image;
                  const link = typeof item === 'string' ? '' : (item.link || '');
                  return (
                    <div key={index} className="flex flex-col gap-3 p-3.5 border border-slate-200/60 rounded-2xl bg-slate-50/50 relative group">
                      <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                        <img 
                          src={convertGoogleDriveUrl(img)} 
                          alt={`Banner Produto ${index + 1}`} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const newBanners = [...localBanners];
                            newBanners.splice(index, 1);
                            setLocalBanners(newBanners);
                            toast.success('Banner removido localmente!');
                          }}
                          className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg transition-colors shadow-md"
                          title="Remover banner"
                        >
                          <Trash2 size={14} />
                        </button>
                        <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[10px] font-black uppercase">
                          #{index + 1}
                        </span>
                        
                        {/* Controles de Ordem */}
                        <div className="absolute bottom-2 left-2 flex gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => {
                              if (index > 0) {
                                const newBanners = [...localBanners];
                                const temp = newBanners[index];
                                newBanners[index] = newBanners[index - 1];
                                newBanners[index - 1] = temp;
                                setLocalBanners(newBanners);
                              }
                            }}
                            className="text-white p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={index === localBanners.length - 1}
                            onClick={() => {
                              if (index < localBanners.length - 1) {
                                const newBanners = [...localBanners];
                                const temp = newBanners[index];
                                newBanners[index] = newBanners[index + 1];
                                newBanners[index + 1] = temp;
                                setLocalBanners(newBanners);
                              }
                            }}
                            className="text-white p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
                          >
                            <ChevronDown size={14} />
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text" 
                        placeholder="Link do banner (opcional)..." 
                        value={link}
                        onChange={(e) => {
                          const newBanners = [...localBanners];
                          newBanners[index] = { image: img, link: e.target.value };
                          setLocalBanners(newBanners);
                        }}
                        className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs focus:border-amber-500 outline-none" 
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Nenhum banner cadastrado. Adicione URLs de imagem ou faça upload.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filtro por Categorias em Pills Horizontal */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategoryFilter('Todos')}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 border ${
            selectedCategoryFilter === 'Todos'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          Todos ({localProducts.length})
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

      {/* Bar de Busca & Toggles */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="bg-white border border-slate-200/80 px-4 py-2.5 rounded-2xl flex items-center gap-3 w-full sm:max-w-md shadow-2xs focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
          <Search className="text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, SKU ou categoria..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none text-slate-900 text-xs w-full placeholder-slate-400"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button 
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            title="Visualização em Grid"
          >
            <LayoutGrid size={16} /> <span className="hidden sm:inline">Grid</span>
          </button>
          <button 
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            title="Visualização em Lista"
          >
            <List size={16} /> <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
      </div>

      {/* Alerta de Ordem Alterada */}
      {hasUnsavedOrder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>A ordenação dos produtos foi alterada. Clique em salvar para atualizar no site.</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <button
              type="button"
              onClick={handleDiscardOrder}
              disabled={isSavingOrder}
              className="flex-1 sm:flex-none text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl bg-white border border-slate-200 transition-all cursor-pointer"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSavingOrder}
              className="flex-1 sm:flex-none text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSavingOrder ? 'Salvando...' : 'Salvar Ordem'}
            </button>
          </div>
        </div>
      )}

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* VISUALIZAÇÃO EM GRID (Cards Clean) */}
          {filteredProducts.map((product) => {
            const prof = calculateActualProductProfitability(product.price, product.costPrice || 0, settings?.pricingRules, product.packagingCost);
            return (
              <div key={product.id} className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group">
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 mb-3">
                    <img 
                      src={convertGoogleDriveUrl(product.image || (product.gallery && product.gallery[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop')} 
                      alt={product.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                    />
                    <span className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                      {product.category}
                    </span>
                    {product.stock !== undefined && (
                      <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        product.stock > 0 ? 'bg-emerald-500 text-white shadow-xs' : 'bg-rose-500 text-white shadow-xs'
                      }`}>
                        {product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    {product.sku && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.2 rounded">{product.sku}</span>}
                    <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug">{product.name}</h4>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-base font-black text-slate-900">{formatPrice(product.price)}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${prof.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        +R$ {prof.netProfit.toFixed(0)} ({prof.marginPct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => handleOpenModal(product)} 
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                  <button 
                    type="button"
                    onClick={() => setProfitModalProduct(product)}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                    title="Ver DRE"
                  >
                    <PieChart size={15} />
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleRecalculateSingleProductPrice(product)}
                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                    title="Recalcular Preço Sugerido"
                  >
                    <RefreshCw size={15} />
                  </button>
                  {confirmDeleteId === product.id ? (
                    <button type="button" onClick={() => handleDeleteConfirmed(product.id)} className="px-3 py-2 bg-rose-600 text-white rounded-xl text-xs font-black uppercase">Sim</button>
                  ) : (
                    <button type="button" onClick={() => setConfirmDeleteId(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white border border-slate-200/80 rounded-3xl">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="p-4">Produto</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Categoria</th>
                <th className="p-4">Preço</th>
                <th className="p-4">Lucro</th>
                <th className="p-4">Estoque</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {filteredProducts.map((product) => {
                const prof = calculateActualProductProfitability(product.price, product.costPrice || 0, settings?.pricingRules, product.packagingCost);
                return (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                           <img 
                            src={convertGoogleDriveUrl(product.image || (product.gallery && product.gallery[0]) || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop')} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                           />
                        </div>
                        <span className="font-extrabold text-slate-900 line-clamp-1">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {product.sku ? <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200">{product.sku}</span> : <span className="text-[10px] text-slate-400">S/ SKU</span>}
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-full">{product.category || 'Sem categoria'}</span>
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      {formatPrice(product.price)}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full ${prof.netProfit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        +R$ {prof.netProfit.toFixed(0)}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.stock !== undefined ? (
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${product.stock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {product.stock > 0 ? `${product.stock} un.` : 'Esgotado'}
                        </span>
                      ) : <span className="text-slate-400">-</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setProfitModalProduct(product)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Ver DRE">
                          <PieChart size={15} />
                        </button>
                        <button onClick={() => handleRecalculateSingleProductPrice(product)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors" title="Recalcular Preço Sugerido">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => handleOpenModal(product)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors" title="Editar">
                          <Edit2 size={15} />
                        </button>
                        {confirmDeleteId === product.id ? (
                          <button type="button" onClick={() => handleDeleteConfirmed(product.id)} className="px-2 py-1 bg-rose-600 text-white rounded-md text-[10px] font-black uppercase">Sim</button>
                        ) : (
                          <button type="button" onClick={() => setConfirmDeleteId(product.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="Excluir">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">Nenhum produto encontrado.</div>
          )}
        </div>
      )}

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
                {/* Tabs Selector */}
                <div className="flex border-b border-gray-100 mb-4 pb-1 overflow-x-auto shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('geral')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      modalActiveTab === 'geral'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800'
                    }`}
                  >
                    📋 Cadastro Geral
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('precificacao')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      modalActiveTab === 'precificacao'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800'
                    }`}
                  >
                    💰 Precificação & Custos
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalActiveTab('estoque')}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                      modalActiveTab === 'estoque'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-gray-50 text-gray-500 border-gray-200 hover:text-gray-800'
                    }`}
                  >
                    📦 Estoque & Vitrine
                  </button>
                </div>

                {/* Tab Content */}
                <div className="grid grid-cols-2 gap-4">
                  {modalActiveTab === 'geral' && (
                    <>
                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Produto</label>
                        <input required type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                      </div>
                      
                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Código / SKU</label>
                        <input type="text" value={formData.sku || ""} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ex: CAN-001" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                      </div>

                      <div className="space-y-1 col-span-2 md:col-span-1">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                        <select 
                          value={formData.category || ""} 
                          onChange={e => {
                            const newCat = e.target.value;
                            const updates: Partial<Product> = { category: newCat };
                            if (!editingProduct) {
                              const previousAutoSku = generateNextSku(formData.category || "");
                              if (!formData.sku || formData.sku === previousAutoSku) {
                                updates.sku = generateNextSku(newCat);
                              }
                            }
                            setFormData({...formData, ...updates});
                          }} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                        >
                          <option value="">Selecione uma categoria...</option>
                          {settings.categories?.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1 col-span-2">
                        <label className="text-[10px] uppercase font-bold text-gray-500">Observação do Produto (Opcional)</label>
                        <input 
                          type="text" 
                          placeholder="Ex: O link de acesso será enviado após o pagamento" 
                          value={formData.observation || ''}
                          onChange={e => setFormData({...formData, observation: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                        />
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
                          <label className="text-[10px] uppercase font-bold text-gray-500">Tamanhos <span className="text-gray-400 lowercase">(opcional)</span></label>
                          <button type="button" onClick={handleAddSize} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
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
                                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none uppercase font-bold" 
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
                    </>
                  )}

                  {modalActiveTab === 'precificacao' && (
                    <>
                      {/* Insumos */}
                      {settings?.rawMaterials && settings.rawMaterials.length > 0 && (
                        <div className="col-span-2 bg-purple-50/50 border border-purple-100 rounded-2xl p-4 space-y-3 shadow-2xs">
                          <div className="flex items-center gap-1.5 text-purple-950">
                            <Tags size={16} className="text-purple-600" />
                            <span className="text-xs font-black uppercase tracking-wider">Composição de Custo por Insumos</span>
                          </div>
                          <p className="text-[10px] text-purple-800">
                            Selecione as matérias-primas e insumos para somar no custo deste produto automaticamente:
                          </p>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {settings.rawMaterials.map(mat => {
                              const isChecked = (formData.selectedMaterialIds || []).includes(mat.id);
                              return (
                                <label 
                                  key={mat.id}
                                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer select-none ${
                                    isChecked 
                                      ? 'bg-purple-100/80 border-purple-300 text-purple-950' 
                                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const currentIds = [...(formData.selectedMaterialIds || [])];
                                        let newIds: string[] = [];
                                        if (isChecked) {
                                          newIds = currentIds.filter(id => id !== mat.id);
                                        } else {
                                          newIds = [...currentIds, mat.id];
                                        }
                                        
                                        // Calculate total materials cost
                                        const newCostSum = settings.rawMaterials!
                                          .filter(m => newIds.includes(m.id))
                                          .reduce((sum, m) => sum + m.cost, 0);

                                        // Calculate suggested sale price
                                        const newCost = newCostSum;
                                        const newPkg = formData.packagingCost || 0;
                                        const profit = formData.desiredProfit || 0;
                                        const suggested = calculateSuggestedPriceFromProfitVal(newCost, settings?.pricingRules, newPkg, profit);

                                        setFormData(prev => ({
                                          ...prev,
                                          selectedMaterialIds: newIds,
                                          costPrice: newCostSum > 0 ? newCostSum : undefined,
                                          price: profit > 0 && suggested > 0 ? Math.round(suggested * 100) / 100 : prev.price
                                        }));
                                      }}
                                      className="accent-purple-600"
                                    />
                                    <span>{mat.name}</span>
                                  </div>
                                  <span className={isChecked ? 'text-purple-700' : 'text-emerald-600'}>
                                    R$ {mat.cost.toFixed(2).replace('.', ',')}
                                  </span>
                                </label>
                              );
                            })}
                          </div>

                          {(formData.selectedMaterialIds || []).length > 0 && (
                            <div className="text-[11px] font-extrabold text-purple-900 bg-purple-100/50 p-2 rounded-lg flex justify-between items-center">
                              <span>Total Insumos Selecionados:</span>
                              <span className="text-xs font-black">
                                R$ {(formData.costPrice || 0).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Preço de Custo */}
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Preço de Custo (R$)</label>
                          <span className="text-[9px] text-gray-400 font-semibold lowercase">(fornecedor)</span>
                        </div>
                        <div className="relative">
                          <input 
                            type="text" 
                            disabled={(formData.selectedMaterialIds || []).length > 0}
                            value={formData.costPrice !== undefined && formData.costPrice > 0 ? maskBRLCurrency(Math.round(formData.costPrice * 100).toString()) : ''} 
                            onChange={e => {
                              const raw = e.target.value;
                              let costVal = undefined;
                              if (raw !== '') {
                                costVal = parseBRLCurrency(raw);
                              }
                              
                              const newCost = costVal || 0;
                              const defaultPkg = settings?.pricingRules?.defaultPackagingCost !== undefined ? settings.pricingRules.defaultPackagingCost : 2.00;
                              const newPkg = formData.packagingCost !== undefined ? formData.packagingCost : defaultPkg;
                              const profit = formData.desiredProfit || 0;
                              const suggested = calculateSuggestedPriceFromProfitVal(newCost, settings?.pricingRules, newPkg, profit);

                              setFormData(prev => ({
                                ...prev,
                                costPrice: costVal,
                                price: profit > 0 && suggested > 0 ? Math.round(suggested * 100) / 100 : prev.price
                              }));
                            }} 
                            className={`w-full border rounded-lg p-3 text-sm outline-none font-bold ${
                              (formData.selectedMaterialIds || []).length > 0 
                                ? 'bg-purple-50 border-purple-200 text-purple-700 cursor-not-allowed pl-9' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-[var(--color-primary)]'
                            }`} 
                            placeholder="Ex: 12,00 (Opcional)"
                          />
                          {(formData.selectedMaterialIds || []).length > 0 && (
                            <span className="absolute left-3 top-3.5 text-purple-500">
                              <Lock size={14} />
                            </span>
                          )}
                        </div>
                        {(formData.selectedMaterialIds || []).length > 0 && (
                          <p className="text-[9px] text-purple-600 font-bold mt-1">Calculado de forma automática pelos insumos</p>
                        )}
                      </div>

                      {/* Modelo de Embalagem */}
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Modelo de Embalagem</label>
                          <span className="text-[9px] text-gray-400 font-semibold lowercase">
                            (Soma no custo)
                          </span>
                        </div>
                        <select 
                          value={formData.selectedPackagingId || 'default'} 
                          onChange={e => {
                            const val = e.target.value;
                            let costVal = undefined;
                            
                            if (val === 'default') {
                              costVal = settings?.pricingRules?.defaultPackagingCost ?? 2.00;
                            } else if (val === 'none') {
                              costVal = 0;
                            } else {
                              const selectedModel = settings.packagingModels?.find(m => m.id === val);
                              costVal = selectedModel ? selectedModel.cost : undefined;
                            }
                            
                            const newCost = formData.costPrice || 0;
                            const newPkg = costVal !== undefined ? costVal : 0;
                            const profit = formData.desiredProfit || 0;
                            const suggested = calculateSuggestedPriceFromProfitVal(newCost, settings?.pricingRules, newPkg, profit);

                            setFormData(prev => ({
                              ...prev,
                              selectedPackagingId: val,
                              packagingCost: costVal,
                              price: profit > 0 && suggested > 0 ? Math.round(suggested * 100) / 100 : prev.price
                            }));
                          }} 
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-semibold text-gray-800"
                        >
                          <option value="default">Embalagem Padrão (R$ {(settings?.pricingRules?.defaultPackagingCost ?? 2.00).toFixed(2).replace('.', ',')})</option>
                          <option value="none">Nenhuma Embalagem (R$ 0,00)</option>
                          {settings.packagingModels?.map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} (R$ {model.cost.toFixed(2).replace('.', ',')})
                            </option>
                          ))}
                        </select>
                      </div>

                      {isPrecedingFieldsFilled ? (
                        <>
                          {/* Dynamic Real Cost Summation Panel */}
                          {(() => {
                            const cost = formData.costPrice || 0;
                            const pkg = formData.packagingCost !== undefined ? formData.packagingCost : (settings?.pricingRules?.defaultPackagingCost ?? 2.00);
                            const totalDirect = cost + pkg;
                            
                            const price = formData.price || 0;
                            const taxPct = settings.pricingRules?.taxRatePct || 6;
                            const gatewayPct = settings.pricingRules?.gatewayFeePct || 4;
                            const commissionPct = settings.pricingRules?.commissionPct || 0;
                            
                            let fixedCostPct = settings.pricingRules?.fixedCostPct || 10;
                            if (settings.pricingRules?.useCalculatedFixedCost) {
                              const rent = settings.pricingRules.rentCostMonthly || 0;
                              const util = settings.pricingRules.utilitiesCostMonthly || 0;
                              const sal = settings.pricingRules.salariesCostMonthly || 0;
                              const mkt = settings.pricingRules.marketingCostMonthly || 0;
                              const soft = settings.pricingRules.softwareAccountingCostMonthly || 0;
                              const other = settings.pricingRules.otherFixedCostsMonthly || 0;
                              const totalFixed = rent + util + sal + mkt + soft + other;
                              const rev = Math.max(100, settings.pricingRules.estimatedMonthlyRevenue || 1);
                              fixedCostPct = Math.min(80, (totalFixed / rev) * 100);
                            }
                            
                            const taxAmount = (price * taxPct) / 100;
                            const gatewayAmount = (price * gatewayPct) / 100;
                            const commissionAmount = (price * commissionPct) / 100;
                            const fixedCostAmount = (price * fixedCostPct) / 100;
                            
                            const totalCostReal = totalDirect + taxAmount + gatewayAmount + commissionAmount + fixedCostAmount;
                            
                            return (
                              <div className="col-span-2 bg-purple-50/60 border border-purple-100 rounded-2xl p-4.5 space-y-3.5 shadow-sm">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-purple-100">
                                  <div>
                                    <h5 className="text-xs font-black text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                                      📊 Custo Real Total do Produto (Soma Tudo)
                                    </h5>
                                    <p className="text-[10px] text-purple-700/80 font-semibold">Preço de compra + embalagem + taxas + custos fixos rateados</p>
                                  </div>
                                  <span className="text-sm font-black text-purple-950 bg-purple-100/80 px-3 py-1.5 rounded-xl border border-purple-200">
                                    R$ {totalCostReal.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2 text-[11px] text-purple-900/90">
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold">
                                      🛠️ Insumos / Compra (Fornecedor):
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {cost.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold">
                                      📦 Embalagem Selecionada:
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {pkg.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold" title="Impostos sobre Nota Fiscal">
                                      🧾 Impostos ({taxPct}%):
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {taxAmount.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold" title="Taxas de Maquininha e Gateway">
                                      💳 Taxas Cartão/Gateway ({gatewayPct}%):
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {gatewayAmount.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold" title="Comissões de Vendedores e Marketplaces">
                                      👥 Comissões ({commissionPct}%):
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {commissionAmount.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between py-1 border-b border-dashed border-purple-100/50">
                                    <span className="flex items-center gap-1.5 font-bold" title="Rateio de Custos Fixos (Aluguel, Água/Luz, Salários, Mkt, ERP, etc)">
                                      🏠 Custo Fixo Rateado ({fixedCostPct.toFixed(1)}%):
                                    </span>
                                    <span className="font-extrabold text-purple-950">
                                      R$ {fixedCostAmount.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-[9px] text-purple-600/90 font-semibold italic bg-purple-100/30 p-2 rounded-lg border border-purple-100/40">
                                  * Este painel soma automaticamente as Despesas Fixas (Aluguel, Água, Luz, Internet, Salários/Pró-labore, Marketing, Sistemas/Contabilidade e Outras) e as taxas variáveis faturadas. Quando você as altera nas configurações, o Custo Real atualiza em todos os produtos instantaneamente.
                                </div>
                              </div>
                            );
                          })()}
 
                          {/* Lucro Desejado */}
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-emerald-700">Lucro Desejado (R$)</label>
                              <span className="text-[9px] text-emerald-600 font-bold lowercase">
                                (Valor líquido limpo)
                              </span>
                            </div>
                            <input 
                              type="text" 
                              value={formData.desiredProfit !== undefined && formData.desiredProfit > 0 ? maskBRLCurrency(Math.round(formData.desiredProfit * 100).toString()) : ''} 
                              onChange={e => {
                                const raw = e.target.value;
                                let profitVal = undefined;
                                if (raw !== '') {
                                  profitVal = parseBRLCurrency(raw);
                                }
                                
                                const newCost = formData.costPrice || 0;
                                const defaultPkg = settings?.pricingRules?.defaultPackagingCost !== undefined ? settings.pricingRules.defaultPackagingCost : 2.00;
                                const newPkg = formData.packagingCost !== undefined ? formData.packagingCost : defaultPkg;
                                const profit = profitVal || 0;
                                const suggested = calculateSuggestedPriceFromProfitVal(newCost, settings?.pricingRules, newPkg, profit);
 
                                setFormData(prev => ({
                                  ...prev,
                                  desiredProfit: profitVal,
                                  price: profit > 0 && suggested > 0 ? Math.round(suggested * 100) / 100 : prev.price
                                }));
                              }} 
                              className="w-full bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 text-sm focus:border-emerald-500 outline-none font-bold text-emerald-700" 
                              placeholder="Ex: 10,00"
                            />
                          </div>
 
                          {/* Preço de Venda */}
                          <div className="space-y-1 col-span-2 sm:col-span-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] uppercase font-bold text-gray-500">Preço Venda (R$)</label>
                              <button
                                type="button"
                                onClick={() => {
                                  const rules: any = settings.pricingRules || {};
                                  
                                  // Calculate effective fixed cost pct with safeguard:
                                  let effectiveFixedCostPct = 0;
                                  if (rules.estimatedMonthlyRevenue && rules.estimatedMonthlyRevenue > 100) {
                                    const rent = rules.rentCostMonthly || 0;
                                    const utilities = rules.utilitiesCostMonthly || 0;
                                    const salaries = rules.salariesCostMonthly || 0;
                                    const marketing = rules.marketingCostMonthly || 0;
                                    const software = rules.softwareAccountingCostMonthly || 0;
                                    const other = rules.otherFixedCostsMonthly || 0;
                                    const totalFixed = rent + utilities + salaries + marketing + software + other;
                                    effectiveFixedCostPct = Math.min(80, (totalFixed / rules.estimatedMonthlyRevenue) * 100);
                                  }
 
                                  const taxRatePct = rules.taxRatePct || 0;
                                  const gatewayFeePct = rules.gatewayFeePct || 0;
                                  const commissionPct = rules.commissionPct || 0;
                                  const defaultPackagingCost = rules.defaultPackagingCost !== undefined ? rules.defaultPackagingCost : 2.00;
                                  const defaultProfitPct = rules.desiredProfitPct !== undefined ? rules.desiredProfitPct : 20;
 
                                  const costPrice = Number(formData.costPrice) || 0;
                                  const customPackaging = formData.selectedPackagingId === 'none' ? 0 : (
                                    formData.selectedPackagingId === 'default' || !formData.selectedPackagingId ? (
                                      formData.packagingCost !== undefined ? Number(formData.packagingCost) : defaultPackagingCost
                                    ) : (
                                      (settings.packagingModels || []).find((m: any) => m.id === formData.selectedPackagingId)?.cost ?? (
                                        formData.packagingCost !== undefined ? Number(formData.packagingCost) : defaultPackagingCost
                                      )
                                    )
                                  );
 
                                  const profitVal = formData.desiredProfit !== undefined ? Number(formData.desiredProfit) : undefined;
                                  const desiredProfitPct = defaultProfitPct;
 
                                  let newPrice = 0;
                                  if (profitVal !== undefined && profitVal > 0) {
                                    const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct));
                                    const divisor = Math.max(0.01, 1 - (sumPct / 100));
                                    newPrice = (costPrice + customPackaging + profitVal) / divisor;
                                  } else {
                                    const sumPct = Math.min(99, Math.max(0, taxRatePct + gatewayFeePct + commissionPct + effectiveFixedCostPct + desiredProfitPct));
                                    const divisor = Math.max(0.01, 1 - (sumPct / 100));
                                    newPrice = (costPrice + customPackaging) / divisor;
                                  }
 
                                  const roundedPrice = Math.round(newPrice * 100) / 100;
                                  setFormData({ ...formData, price: roundedPrice });
                                  toast.success(`Preço sugerido calculado: R$ ${roundedPrice.toFixed(2).replace('.', ',')}`);
                                }}
                                className="text-[9px] uppercase font-black text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                title="Calcular com base nas regras de precificação"
                              >
                                <RefreshCw size={10} /> Sugerir Preço
                              </button>
                            </div>
                            <input 
                              required 
                              type="text" 
                              value={formData.price !== undefined ? maskBRLCurrency(Math.round(formData.price * 100).toString()) : ''} 
                              onChange={e => {
                                const numericValue = parseBRLCurrency(e.target.value);
                                setFormData({...formData, price: numericValue});
                              }} 
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-bold text-gray-900" 
                              placeholder="Ex: 36,90"
                            />
                          </div>
 
                          {/* Preço Promocional */}
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
 
                          {/* Beautiful DRE Real-time Demonstration */}
                          {(() => {
                            const price = formData.price || 0;
                            const cost = formData.costPrice || 0;
                            const pkg = formData.packagingCost || 0;
                            const totalDirectCost = cost + pkg;
 
                            const taxPct = settings.pricingRules?.taxRatePct || 6;
                            const gatewayPct = settings.pricingRules?.gatewayFeePct || 4;
                            const commissionPct = settings.pricingRules?.commissionPct || 0;
 
                            let fixedCostPct = settings.pricingRules?.fixedCostPct || 10;
                            if (settings.pricingRules?.useCalculatedFixedCost) {
                              const rent = settings.pricingRules.rentCostMonthly || 0;
                              const util = settings.pricingRules.utilitiesCostMonthly || 0;
                              const sal = settings.pricingRules.salariesCostMonthly || 0;
                              const mkt = settings.pricingRules.marketingCostMonthly || 0;
                              const soft = settings.pricingRules.softwareAccountingCostMonthly || 0;
                              const other = settings.pricingRules.otherFixedCostsMonthly || 0;
                              const totalFixed = rent + util + sal + mkt + soft + other;
                              const rev = Math.max(100, settings.pricingRules.estimatedMonthlyRevenue || 1);
                              fixedCostPct = Math.min(80, (totalFixed / rev) * 100);
                            }
 
                            const totalVariablePct = taxPct + gatewayPct + commissionPct + fixedCostPct;
                            const variableCostsVal = (price * totalVariablePct) / 100;
                            const realProfit = price - totalDirectCost - variableCostsVal;
                            const realMarginPct = price > 0 ? (realProfit / price) * 100 : 0;

                            const pixFeePct = settings.pricingRules?.pixFeeRatePct ?? 0.99;
                            const totalVariablePixPct = taxPct + pixFeePct + commissionPct + fixedCostPct;
                            const variableCostsPixVal = (price * totalVariablePixPct) / 100;
                            const realProfitPix = price - totalDirectCost - variableCostsPixVal;
                            const realMarginPixPct = price > 0 ? (realProfitPix / price) * 100 : 0;
 
                            return (
                              <div className="col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 mt-2 space-y-3.5 border border-slate-800 shadow-lg">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                  <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                                    <TrendingUp size={14} /> Demonstrativo do Preço (DRE Real-time)
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-bold lowercase">
                                    Para preço de venda: R$ {price.toFixed(2).replace('.', ',')}
                                  </span>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Custos Diretos</span>
                                    <span className="text-xs font-extrabold text-red-400 block">
                                      R$ {totalDirectCost.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-semibold italic block">
                                      Custo + Embalagem
                                    </span>
                                  </div>
                                  
                                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                    <span className="text-[9px] text-gray-400 uppercase font-bold block mb-0.5">Variáveis & Taxas</span>
                                    <span className="text-[10px] font-extrabold text-amber-400 block leading-tight">
                                      Card: R$ {variableCostsVal.toFixed(2).replace('.', ',')} ({totalVariablePct.toFixed(1)}%)
                                    </span>
                                    <span className="text-[10px] font-extrabold text-emerald-400 block leading-tight">
                                      PIX: R$ {variableCostsPixVal.toFixed(2).replace('.', ',')} ({totalVariablePixPct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  
                                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                    <span className="text-[9px] text-purple-300 uppercase font-black block mb-0.5">Sobra Cartão</span>
                                    <span className={`text-xs font-black block ${realProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      R$ {realProfit.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase block ${realProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      Margem: {realMarginPct.toFixed(1)}%
                                    </span>
                                  </div>

                                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                                    <span className="text-[9px] text-emerald-300 uppercase font-black block mb-0.5">Sobra PIX</span>
                                    <span className={`text-xs font-black block ${realProfitPix >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      R$ {realProfitPix.toFixed(2).replace('.', ',')}
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase block ${realProfitPix >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                      Margem: {realMarginPixPct.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </>
                      ) : (
                        <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center space-y-2 shadow-2xs">
                          <p className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center justify-center gap-1.5">
                            ⚠️ Preencha os Dados de Cadastro Primeiro
                          </p>
                          <p className="text-[11px] text-amber-800/90 leading-relaxed max-w-sm mx-auto">
                            O <strong>Preço de Venda</strong> e os <strong>Indicadores DRE</strong> só serão exibidos após você preencher o <strong>Nome do Produto</strong>, <strong>Categoria</strong> (aba Cadastro Geral) e o <strong>Preço de Custo / Insumos</strong>.
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {modalActiveTab === 'estoque' && (
                    <>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="space-y-2 col-span-2">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] uppercase font-bold text-gray-500">Imagem Principal (Destaque)</label>
                          <label className="text-[10px] uppercase font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg hover:brightness-110 cursor-pointer flex items-center gap-1 transition-all">
                            <PlusCircle size={14} /> Selecionar imagem principal
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "main")} />
                          </label>
                        </div>
                        <div className="flex gap-2 mb-2">
                          <input 
                            type="text" 
                            placeholder="Adicionar por URL da imagem principal..." 
                            value={formData.image || ''}
                            onChange={e => setFormData({...formData, image: convertGoogleDriveUrl(e.target.value)})}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                          />
                        </div>
                        {formData.image && (
                          <div className="relative group w-20 h-20 rounded border border-gray-200 overflow-hidden bg-white flex items-center justify-center">
                            <img 
                              src={convertGoogleDriveUrl(formData.image)} 
                              alt="Principal" 
                              className="w-full h-full object-contain" 
                              referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
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
                          <label className="text-[10px] uppercase font-bold bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg hover:brightness-110 cursor-pointer flex items-center gap-1 transition-all">
                            <PlusCircle size={14} /> Buscar múltiplas imagens
                            <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "gallery")} />
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
                                  const urls = val.split(/\s+/).filter(u => u.trim() !== '');
                                  setFormData(prev => ({
                                    ...prev,
                                    gallery: [...(prev.gallery || []), ...urls.map(convertGoogleDriveUrl)]
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
                                const urls = val.split(/\s+/).filter(u => u.trim() !== '');
                                setFormData(prev => ({
                                  ...prev,
                                  gallery: [...(prev.gallery || []), ...urls.map(convertGoogleDriveUrl)]
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
                              <div 
                                key={index} 
                                className={`relative group w-16 h-16 rounded border border-gray-200 overflow-hidden cursor-move transition-transform ${draggedGalleryIndex === index ? 'opacity-50 scale-95' : ''}`}
                                draggable
                                onDragStart={() => setDraggedGalleryIndex(index)}
                                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                                onDrop={(e) => { e.preventDefault(); handleGalleryDrop(index); }}
                                onDragEnd={() => setDraggedGalleryIndex(null)}
                              >
                                <img 
                                  src={convertGoogleDriveUrl(img || undefined)} 
                                  alt={`Galeria ${index}`} 
                                  className="w-full h-full object-contain pointer-events-none" 
                                  referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveGalleryImage(index)}
                                  className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Remover"
                                >
                                  <X size={10} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setFormData(prev => ({ ...prev, image: img }))}
                                  className="absolute bottom-0 inset-x-0 bg-blue-600 text-white text-[8px] uppercase font-black py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  Destaque
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-3 border-t border-gray-100 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 transition-all text-center border border-gray-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="w-full px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm text-center"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SKU Generator Modal */}
      {isSkuModalOpen && (
        <SkuPatternManager 
          onClose={() => setIsSkuModalOpen(false)} 
          products={localProducts} 
          onProductsUpdated={(updated) => {
            setLocalProducts(updated);
            setHasUnsavedOrder(true);
          }} 
        />
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
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id="new-group"
                    placeholder="Novo grupo..." 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = e.currentTarget.value.trim();
                        if (val) {
                          const newGroups = { ...(settings.categoryGroups || {}) };
                          if (!newGroups[val]) newGroups[val] = [];
                          updateSettings({ categoryGroups: newGroups });
                          toast.success(`Grupo "${val}" criado!`);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-group') as HTMLInputElement;
                      const val = input.value.trim();
                      if (val) {
                        const newGroups = { ...(settings.categoryGroups || {}) };
                        if (!newGroups[val]) newGroups[val] = [];
                        updateSettings({ categoryGroups: newGroups });
                        toast.success(`Grupo "${val}" criado!`);
                        input.value = '';
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg hover:brightness-110"
                    title="Adicionar Novo Grupo"
                  >
                    <Plus size={20} />
                  </button>
                </div>

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
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-500"
                >
                  <Plus size={20} />
                </button>
              </div>
              </div>

              <div className="space-y-2 mt-4">
                {settings.categories?.map((cat, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === (settings.categories?.length || 0) - 1;
                  return (
                    <div key={idx} className="flex flex-col bg-gray-50 p-3 rounded-lg border border-gray-100 gap-2 hover:border-gray-200 transition-all">
                      <div className="flex justify-between items-center gap-2">
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
                              const newName = prompt(`Editar categoria "${cat}":`, cat);
                              if (newName && newName.trim() && newName.trim() !== cat) {
                                const newCat = newName.trim();
                                if (settings.categories?.includes(newCat)) {
                                  toast.error('Esta categoria já existe!');
                                  return;
                                }
                                const cats = [...(settings.categories || [])];
                                cats[idx] = newCat;
                                
                                // Update group reference if it exists
                                const newGroups = { ...(settings.categoryGroups || {}) };
                                let groupChanged = false;
                                Object.keys(newGroups).forEach(g => {
                                  if (newGroups[g].includes(cat)) {
                                    newGroups[g] = newGroups[g].map(c => c === cat ? newCat : c);
                                    groupChanged = true;
                                  }
                                });

                                updateSettings({ 
                                  categories: cats, 
                                  ...(groupChanged ? { categoryGroups: newGroups } : {}) 
                                });
                                
                                products.forEach(p => {
                                  if (p.category === cat) {
                                    updateProduct({ ...p, category: newCat });
                                  }
                                });
                                toast.success('Categoria atualizada com sucesso!');
                              }
                            }}
                            className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-md transition-all cursor-pointer"
                            title="Editar categoria"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => {
                              if (confirm(`Tem certeza de que deseja excluir a categoria "${cat}"?`)) {
                                const newGroups = { ...(settings.categoryGroups || {}) };
                                Object.keys(newGroups).forEach(g => {
                                  newGroups[g] = newGroups[g].filter(c => c !== cat);
                                  if (newGroups[g].length === 0) {
                                    delete newGroups[g];
                                  }
                                });
                                updateSettings({ 
                                  categories: settings.categories?.filter(c => c !== cat),
                                  categoryGroups: newGroups
                                });
                              }
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-md transition-all cursor-pointer"
                            title="Excluir categoria"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      {/* Group Assignment */}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-gray-500 w-12 shrink-0">Grupo:</span>
                        <select
                          className="flex-1 bg-white border border-gray-200 rounded p-1 text-xs outline-none focus:border-gray-300"
                          value={Object.entries(settings.categoryGroups || {}).find(([_, cats]) => cats.includes(cat))?.[0] || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newGroups = { ...(settings.categoryGroups || {}) };
                            
                            // Remove from all existing groups first
                            Object.keys(newGroups).forEach(g => {
                              newGroups[g] = newGroups[g].filter(c => c !== cat);
                              if (newGroups[g].length === 0) {
                                delete newGroups[g];
                              }
                            });

                            if (val) {
                              if (!newGroups[val]) newGroups[val] = [];
                              newGroups[val].push(cat);
                              updateSettings({ categoryGroups: newGroups });
                            } else {
                              updateSettings({ categoryGroups: newGroups });
                            }
                          }}
                        >
                          <option value="">Nenhum (Solto no Menu)</option>
                          {Object.keys(settings.categoryGroups || {}).map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
                {(!settings.categories || settings.categories.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma categoria cadastrada.</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 shrink-0">
              <button 
                onClick={() => setIsCategoriesModalOpen(false)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl font-bold uppercase tracking-wider text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <CheckCircle size={18} /> Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhamento de Lucro e Custo Total do Produto (DRE) */}
      {profitModalProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-6 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <PieChart size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-gray-900">Formação de Preço e Lucro</h3>
                  <p className="text-xs text-gray-500 font-medium">{profitModalProduct.name} {profitModalProduct.sku ? `(${profitModalProduct.sku})` : ''}</p>
                </div>
              </div>
              <button 
                onClick={() => setProfitModalProduct(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Analysis Body */}
            {(() => {
              const prof = calculateActualProductProfitability(profitModalProduct.price, profitModalProduct.costPrice || 0, settings?.pricingRules, profitModalProduct.packagingCost, undefined, profitModalProduct.desiredProfit);
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm">
                      <span className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider block">Preço de Venda</span>
                      <span className="text-2xl font-black text-white">{formatPrice(prof.sellingPrice)}</span>
                    </div>
                    <div className="bg-emerald-950 text-white p-4 rounded-2xl border border-emerald-800 shadow-sm">
                      <span className="text-[10px] text-emerald-300 uppercase font-extrabold tracking-wider block">Lucro Líquido Real</span>
                      <span className="text-2xl font-black text-emerald-400">R$ {prof.netProfit.toFixed(2).replace('.', ',')}</span>
                      <span className="text-[10px] text-emerald-200 block font-bold mt-0.5">{prof.marginPct.toFixed(1)}% de margem limpa</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">Custo Total Absoluto</span>
                      <span className="text-sm font-black text-slate-900">R$ {prof.totalCost.toFixed(2).replace('.', ',')}</span>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Package size={14} className="text-blue-600" /> Matéria-prima / Fornecedor
                        </span>
                        <span className="font-bold text-gray-900">R$ {prof.baseCost.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Package size={14} className="text-blue-500" /> Embalagens e Etiquetas (Fixas)
                        </span>
                        <span className="font-bold text-gray-900">R$ {prof.packagingCost.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {prof.shippingInCost > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                          <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                            <Package size={14} className="text-blue-400" /> Frete de Entrada (Fornecedor)
                          </span>
                          <span className="font-bold text-gray-900">R$ {prof.shippingInCost.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Receipt size={14} className="text-amber-600" /> Impostos Nota Fiscal ({settings?.pricingRules?.taxRatePct ?? 6}%)
                        </span>
                        <span className="font-bold text-amber-700">R$ {prof.taxAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Receipt size={14} className="text-amber-500" /> Taxas de Cartão/Gateway ({settings?.pricingRules?.gatewayFeePct ?? 4}%)
                        </span>
                        <span className="font-bold text-amber-700">R$ {prof.gatewayFeeAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Receipt size={14} className="text-emerald-500" /> Taxa do PIX ({settings?.pricingRules?.pixFeeRatePct ?? 0.99}%)
                        </span>
                        <span className="font-bold text-emerald-700">R$ {prof.pixFeeAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                      {prof.commissionAmount > 0 && (
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                          <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                            <Receipt size={14} className="text-purple-500" /> Comissão de Vendas ({settings?.pricingRules?.commissionPct}%)
                          </span>
                          <span className="font-bold text-purple-700">R$ {prof.commissionAmount.toFixed(2).replace('.', ',')}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center py-1">
                        <span className="text-gray-600 flex items-center gap-1.5 font-medium">
                          <Building2 size={14} className="text-purple-600" /> Rateio de Custos Fixos (Aluguel, Luz, Salários)
                        </span>
                        <span className="font-bold text-purple-700">R$ {prof.fixedCostAmount.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 space-y-2">
                    <span className="font-extrabold block text-emerald-900">Resultado Financeiro por Unidade:</span>
                    <div className="text-[11px] text-emerald-800 leading-relaxed space-y-1">
                      <p>
                        💳 <strong>Venda em Cartão:</strong> Sobra <strong className="text-emerald-950 font-extrabold">R$ {prof.netProfit.toFixed(2).replace('.', ',')} ({prof.marginPct.toFixed(1)}%)</strong> de lucro líquido.
                      </p>
                      <p>
                        💸 <strong>Venda em PIX:</strong> Sobra <strong className="text-emerald-950 font-extrabold">R$ {prof.netProfitPix.toFixed(2).replace('.', ',')} ({prof.marginPctPix.toFixed(1)}%)</strong> de lucro líquido.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setProfitModalProduct(null)}
                className="bg-gray-900 text-white font-bold text-xs uppercase px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
