import React, { useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import { useSettings } from '../../context/SettingsContext';
import { Search, Plus, Trash2, ShoppingCart, Save, User, FileText, XCircle, Printer, X, Image as ImageIcon, Truck, Store, Edit2, MessageCircle, Download, CreditCard } from 'lucide-react';
import { formatPrice } from '../../data/products';
import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { maskCEP } from '../../utils/validation';
import { generateSequentialId } from '../../lib/firestoreUtils';
import { useLocation } from 'react-router-dom';

export function Pos() {
  const { products } = useProducts();
  const location = useLocation();
  
  React.useEffect(() => {
    const q = query(collection(db, 'avulso_products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvulsos(data);
    });
    return () => unsubscribe();
  }, []);
  const { settings } = useSettings();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'online' | 'avulsos'>('todos');
  const [avulsos, setAvulsos] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', doc: '' });
  const [notes, setNotes] = useState('');
  const [paymentPolicy, setPaymentPolicy] = useState(`Política de Pagamento

Para garantir a qualidade do atendimento e o início da produção do seu pedido, trabalhamos com a seguinte forma de pagamento:

50% do valor no momento da confirmação do pedido, destinados à aquisição de materiais, reserva da produção e desenvolvimento do projeto.
50% restantes na entrega do produto, antes da retirada ou do envio.

Essa política nos permite manter um processo organizado, assegurar a disponibilidade dos materiais e oferecer um serviço com a qualidade e o prazo que nossos clientes esperam.

Agradecemos pela compreensão, confiança e preferência. Estamos à disposição para esclarecer qualquer dúvida e tornar sua experiência a melhor possível.`);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  React.useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      const customerMap = new Map();
      orders.forEach(order => {
        const email = order.email?.toLowerCase().trim();
        const phone = order.phone?.trim();
        const name = order.customer?.trim();
        const identifier = email || phone || name;
        
        if (identifier && !customerMap.has(identifier)) {
          customerMap.set(identifier, {
            name: name || '',
            email: email || '',
            phone: phone || ''
          });
        }
      });
      setCustomersList(Array.from(customerMap.values()));
    });
    return () => unsubscribe();
  }, []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  React.useEffect(() => {
    if (location.state?.editOrder) {
      const order = location.state.editOrder;
      setEditingOrderId(order.id);
      setCart(order.items.map((i: any) => ({ ...i, id: i.id || Date.now().toString() + Math.random().toString() })));
      setCustomerInfo({
        name: order.customer || '',
        email: order.email || '',
        phone: order.phone || '',
        doc: order.doc || order.shippingInfo?.cpf || ''
      });
      setNotes(order.notes || '');
      setPaymentPolicy(order.paymentPolicy || paymentPolicy);
      setShippingMode(order.shippingMode || 'retirada');
      setShippingCost(order.shippingCost || 0);
      if (order.shippingInfo && order.shippingMode !== 'retirada') {
        setShippingAddress({
          zipCode: order.shippingInfo.zipCode || '',
          street: order.shippingInfo.street || '',
          number: order.shippingInfo.number || '',
          complement: order.shippingInfo.complement || '',
          neighborhood: order.shippingInfo.neighborhood || '',
          city: order.shippingInfo.city || '',
          state: order.shippingInfo.state || ''
        });
      }
      setExtraDiscount(order.discount || 0);
      setPaymentMethod(order.paymentMethod || '');
      setInstallments(order.installments || 1);
      setDownPayment(order.downPayment || 0);
      if (order.paymentConditions === 'Sinal 50% / Entrega 50%') {
        setPaymentCondition('50_50');
      } else {
        setPaymentCondition('a_vista');
      }
      
      // Clean up state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditAvulsoModal, setShowEditAvulsoModal] = useState<any>(null);
  const [customItem, setCustomItem] = useState<{ name: string; price: number; costPrice?: number; image: string; quantity: number; saveToAvulsos: boolean }>({
    name: '',
    price: 0,
    costPrice: undefined,
    image: '',
    quantity: 1,
    saveToAvulsos: false
  });

  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [savedOrder, setSavedOrder] = useState<any>(null);
  const [shippingMode, setShippingMode] = useState<'retirada' | 'gratis' | 'pago'>('retirada');
  const [shippingCost, setShippingCost] = useState(0);
  const [shippingAddress, setShippingAddress] = useState({
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [applyPixDiscount, setApplyPixDiscount] = useState(false);
  const [extraDiscount, setExtraDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [installments, setInstallments] = useState(1);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [paymentCondition, setPaymentCondition] = useState('a_vista');

  const allItems = [...products.map(p => ({...p, isAvulso: false})), ...avulsos.map(a => ({...a, isAvulso: true}))];


  const filteredProducts = allItems.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    
    if (filterType === 'online') return !p.isAvulso;
    if (filterType === 'avulsos') return p.isAvulso;
    return true;
  });

  const addToCart = (product: any) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { 
        id: product.id, 
        name: product.name, 
        price: product.price, 
        costPrice: product.costPrice !== undefined ? product.costPrice : undefined,
        image: product.image, 
        quantity: 1, 
        isCustom: false, 
        isAvulso: product.isAvulso,
        colors: product.colors,
        sizes: product.sizes,
        selectedColor: product.colors?.[0]?.name,
        selectedSize: product.sizes?.[0],
      }]);
    }
  };

  const handleUpdateAvulso = async () => {
    if (!showEditAvulsoModal || !showEditAvulsoModal.name) return;
    try {
      await updateDoc(doc(db, 'avulso_products', showEditAvulsoModal.id), {
        name: showEditAvulsoModal.name,
        price: showEditAvulsoModal.price,
        costPrice: showEditAvulsoModal.costPrice !== undefined ? showEditAvulsoModal.costPrice : undefined,
        image: showEditAvulsoModal.image || ''
      });
      toast.success('Produto avulso atualizado com sucesso!');
      setShowEditAvulsoModal(null);
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar produto avulso');
    }
  };

  const handleAddCustomItem = async () => {
    if (!customItem.name) {
      toast.error('Informe o nome do produto/serviço');
      return;
    }
    
    if (customItem.saveToAvulsos) {
      try {
        await addDoc(collection(db, 'avulso_products'), {
          name: customItem.name,
          price: customItem.price,
          costPrice: customItem.costPrice !== undefined ? customItem.costPrice : undefined,
          image: customItem.image || '',
          createdAt: serverTimestamp()
        });
        toast.success(`Produto salvo na lista de ${settings.posCustomItemLabel || 'Personalizáveis'}!`);
      } catch (e) {
        console.error(e);
        toast.error('Erro ao salvar produto avulso.');
      }
    }

    setCart([...cart, { 
      id: Date.now().toString(), 
      name: customItem.name, 
      price: customItem.price, 
      costPrice: customItem.costPrice !== undefined ? customItem.costPrice : undefined,
      image: customItem.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop', 
      quantity: customItem.quantity, 
      isCustom: true 
    }]);
    setShowCustomModal(false);
    setCustomItem({ name: '', price: 0, costPrice: undefined, image: '', quantity: 1, saveToAvulsos: false });
  };

  const updateCartItem = (id: string, field: string, value: any) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const pixDiscountAmount = applyPixDiscount ? subtotal * (settings.pixDiscount || 0) : 0;
  const discountAmount = pixDiscountAmount + (extraDiscount || 0);
  const total = subtotal - discountAmount + (shippingMode === 'pago' ? shippingCost : 0);

  React.useEffect(() => {
    if ((paymentMethod === 'Pix' || paymentMethod === 'Dinheiro') && paymentCondition === '50_50') {
      setDownPayment(total / 2);
    }
  }, [total, paymentMethod, paymentCondition]);

  const handleSave = async (status: 'Pendente' | 'Orçamento') => {
    if (cart.length === 0) {
      toast.error("O carrinho está vazio.");
      return;
    }
    if (!customerInfo.name) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    setIsSaving(true);
    try {
      const orderData = {
        customer: customerInfo.name || 'Cliente Balcão',
        email: customerInfo.email || '',
        phone: customerInfo.phone || '',
        doc: customerInfo.doc || '',
        date: serverTimestamp(),
        subtotal,
        discount: discountAmount,
        total,
        status,
        items: cart.map(item => ({
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          costPrice: item.costPrice !== undefined ? item.costPrice : undefined,
          image: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        })),
        shippingMode,
        shippingCost: shippingMode === 'pago' ? shippingCost : 0,
        shippingInfo: shippingMode === 'retirada' ? {
          mode: 'retirada',
          cost: 0
        } : {
          mode: shippingMode,
          cost: shippingMode === 'pago' ? shippingCost : 0,
          zipCode: shippingAddress.zipCode,
          street: shippingAddress.street,
          number: shippingAddress.number,
          complement: shippingAddress.complement,
          neighborhood: shippingAddress.neighborhood,
          city: shippingAddress.city,
          state: shippingAddress.state,
          cpf: customerInfo.doc || '',
        },
        notes,
        paymentPolicy,
        paymentMethod,
        paymentConditions: (paymentMethod === 'Pix' || paymentMethod === 'Dinheiro') 
                           ? (paymentCondition === '50_50' ? 'Sinal 50% / Entrega 50%' : 'À vista') 
                           : '',
        installments,
        downPayment,
      };

      let finalId;
      if (editingOrderId) {
        finalId = editingOrderId;
        await setDoc(doc(db, 'orders', finalId), { ...orderData, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        finalId = await generateSequentialId(db, status, settings.storeName);
        await setDoc(doc(db, 'orders', finalId), { ...orderData, createdAt: serverTimestamp() });
      }
      
      const identifier = customerInfo.email?.toLowerCase().trim() || customerInfo.phone?.trim() || customerInfo.name?.trim();
      if (identifier) {
        const cId = identifier.replace(/\//g, '_');
        await setDoc(doc(db, 'customers', cId), {
          identifier,
          name: customerInfo.name || 'Cliente Balcão',
          email: customerInfo.email || '',
          phone: customerInfo.phone || '',
          doc: customerInfo.doc || '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      toast.success(status === 'Orçamento' ? "Orçamento gerado com sucesso!" : "Venda registrada com sucesso!");
      
      setSavedOrder({ ...orderData, id: finalId, displayDate: new Date().toLocaleDateString('pt-BR') });
      setShowReceiptPreview(true);
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const closeReceipt = () => {
    setShowReceiptPreview(false);
    setCart([]);
    setCustomerInfo({ name: '', email: '', phone: '', doc: '' });
    setNotes('');
    setSavedOrder(null);
    setEditingOrderId(null);
    setShippingAddress({
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    });
  };

  const handleDownloadPDF = async () => {
    if (!savedOrder) return;
    const element = document.getElementById('printable-receipt-area');
    if (!element) {
      toast.error("Erro: Área de impressão não encontrada.");
      return;
    }
    
    // Temporarily set a fixed width to ensure the PDF layout is correctly proportioned
    const originalWidth = element.style.width;
    const originalMaxWidth = element.style.maxWidth;
    const originalHeight = element.style.height;
    
    element.style.width = '800px';
    element.style.minWidth = '800px';
    element.style.maxWidth = '800px';
    element.style.height = 'max-content';
    
    // If parent has overflow, it might clip. Temporarily change parent overflow
    const parent = element.parentElement;
    const originalParentOverflow = parent ? parent.style.overflow : '';
    if (parent) {
      parent.style.overflow = 'visible';
    }
    
    const loadingToast = toast.loading("Gerando PDF...");
    try {
      const html2pdfModule = await import('html2pdf.js');
      const html2pdf = (html2pdfModule.default || html2pdfModule) as any;

      const opt = {
        margin:       10,
        filename:     `${savedOrder.status === 'Orçamento' ? 'orcamento' : 'recibo'}-${savedOrder.id}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: true, windowWidth: 800, width: 800, scrollY: 0, scrollX: 0 },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      await html2pdf().from(element).set(opt).save();
      
      toast.success("PDF gerado com sucesso!", { id: loadingToast });
    } catch (e: any) {
      console.error("Failed to generate PDF", e);
      if (e.message && e.message.includes('Failed to fetch dynamically imported module')) {
        toast.error("Nova versão detectada. Atualizando a página...", { id: loadingToast });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast.error(`Erro ao gerar PDF: ${e.message || 'Erro desconhecido'}`, { id: loadingToast });
      }
    } finally {
      element.style.width = originalWidth;
      element.style.maxWidth = originalMaxWidth;
      element.style.height = originalHeight;
      if (parent) {
        parent.style.overflow = originalParentOverflow;
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Novo Orçamento / Venda (PDV)</h1>
          <p className="text-sm text-gray-500 mt-1">Crie pedidos ou orçamentos internos com produtos da loja ou adicione produtos personalizados.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Products List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar produto ou SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <button
                onClick={() => setShowCustomModal(true)}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:brightness-110 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Item Personalizado Único
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterType('todos')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'todos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('online')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'online' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Loja Online
              </button>
              <button
                onClick={() => setFilterType('avulsos')}
                className={`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${filterType === 'avulsos' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
              >
                {settings.posCustomItemLabel || 'Personalizáveis'}
              </button>
            </div>
          </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-shadow" onClick={() => addToCart(product)}>
                <div className="h-32 bg-gray-100 relative">
                  <img src={convertGoogleDriveUrl(product.image)} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {product.isAvulso && (
                    <span className="absolute top-2 left-2 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shadow-sm">{settings.posCustomItemLabel || 'Personalizáveis'}</span>
                  )}
                  {product.isAvulso && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowEditAvulsoModal(product); }}
                      className="absolute top-2 right-2 bg-white/90 text-gray-700 p-1.5 rounded shadow-sm hover:bg-white hover:text-purple-600 transition-colors"
                      title="Editar Avulso"
                    >
                      <Edit2 size={14} />
                    </button>
                  )}
                  {product.hidden && (
                    <span className="absolute top-2 right-2 bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Oculto</span>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-xs font-semibold text-gray-800 line-clamp-2" title={product.name}>{product.name}</h3>
                  <div className="mt-2 text-sm font-bold text-[var(--color-primary)]">{formatPrice(product.price)}</div>
                </div>
              </div>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500 text-sm">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Cart / Order Details */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit sticky top-6 space-y-6">
          <div className="flex items-center gap-2 text-gray-800 font-bold border-b border-gray-100 pb-3">
            <ShoppingCart size={20} className="text-[var(--color-primary)]" />
            <h2>Resumo do Pedido</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <ShoppingCart size={32} className="mb-2 opacity-40" />
                  <p className="text-xs text-gray-400 font-medium">O carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-3 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    {item.isCustom && item.image ? (
                      <div className="w-12 h-12 shrink-0 bg-white border border-gray-200 rounded overflow-hidden">
                        <img src={item.image ? convertGoogleDriveUrl(item.image) : ''} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ) : null}
                    <div className="flex-1 space-y-2">
                      {item.isCustom || item.isAvulso ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateCartItem(item.id, 'name', e.target.value)}
                          className="w-full text-xs font-semibold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-[var(--color-primary)] outline-none pb-0.5"
                        />
                      ) : (
                        <h4 className="text-xs font-semibold text-gray-800 leading-tight">{item.name}</h4>
                      )}
                      
                      {/* Variações */}
                      {(item.colors || item.sizes) && (
                        <div className="flex gap-2">
                          {item.colors && item.colors.length > 0 && (
                            <select
                              value={item.selectedColor || ''}
                              onChange={(e) => updateCartItem(item.id, 'selectedColor', e.target.value)}
                              className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white outline-none focus:border-[var(--color-primary)] flex-1"
                            >
                              <option value="">Cor...</option>
                              {item.colors.map((c: any) => (
                                <option key={c.name} value={c.name}>{c.name}</option>
                              ))}
                            </select>
                          )}
                          {item.sizes && item.sizes.length > 0 && (
                            <select
                              value={item.selectedSize || ''}
                              onChange={(e) => updateCartItem(item.id, 'selectedSize', e.target.value)}
                              className="text-[10px] border border-gray-200 rounded px-1 py-0.5 bg-white outline-none focus:border-[var(--color-primary)] w-16"
                            >
                              <option value="">Tam...</option>
                              {item.sizes.map((s: any) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 uppercase">Qtd:</span>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateCartItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-12 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[var(--color-primary)] text-center"
                          />
                        </div>
                        {item.isCustom || item.isAvulso ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">R$</span>
                            <input
                              type="text"
                              value={item.price ? item.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                updateCartItem(item.id, 'price', val ? parseInt(val, 10) / 100 : 0);
                              }}
                              className="w-16 text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-[var(--color-primary)] text-right"
                            />
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-gray-700">{formatPrice(item.price * item.quantity)}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-400 hover:text-red-500 transition-colors self-start mt-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><Truck size={14} /> Entrega / Retirada</h3>
              <div className="flex p-1 bg-gray-100/80 rounded-lg">
                <button
                  onClick={() => setShippingMode('retirada')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${shippingMode === 'retirada' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Retirada
                </button>
                <button
                  onClick={() => setShippingMode('gratis')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${shippingMode === 'gratis' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Frete Grátis
                </button>
                <button
                  onClick={() => setShippingMode('pago')}
                  className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${shippingMode === 'pago' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Frete Pago
                </button>
              </div>
              {shippingMode === 'pago' && (
                <div className="mt-2">
                  <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Valor do Frete (R$)</label>
                  <input
                    type="text"
                    value={shippingCost ? shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setShippingCost(val ? parseInt(val, 10) / 100 : 0);
                    }}
                    placeholder="0,00"
                    className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] focus:bg-white outline-none transition-colors"
                  />
                </div>
              )}
              {shippingMode !== 'retirada' && (
                <div className="mt-3 p-3.5 bg-gray-50/50 rounded-xl border border-gray-200/50 space-y-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-gray-200/50">
                    <Truck size={14} className="text-[var(--color-primary)]" />
                    <span className="text-[11px] font-black uppercase text-gray-700 tracking-wider">Endereço de Entrega</span>
                  </div>
                  
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={async (e) => {
                          const val = e.target.value;
                          const masked = maskCEP(val);
                          const raw = val.replace(/\D/g, '');
                          setShippingAddress(prev => ({ ...prev, zipCode: masked }));
                          
                          if (raw.length === 8) {
                            setCepLoading(true);
                            try {
                              const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
                              const data = await res.json();
                              if (!data.erro) {
                                setShippingAddress(prev => ({
                                  ...prev,
                                  street: data.logradouro || '',
                                  neighborhood: data.bairro || '',
                                  city: data.localidade || '',
                                  state: data.uf || ''
                                }));
                                toast.success("Endereço preenchido automaticamente!");
                              } else {
                                toast.error("CEP não encontrado.");
                              }
                            } catch (err) {
                              console.error(err);
                              toast.error("Erro ao buscar o CEP.");
                            } finally {
                              setCepLoading(false);
                            }
                          }
                        }}
                        placeholder="00000-000"
                        maxLength={9}
                        className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-3">
                          <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-[var(--color-primary)] border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Rua / Logradouro</label>
                    <input
                      type="text"
                      value={shippingAddress.street}
                      onChange={e => setShippingAddress(prev => ({ ...prev, street: e.target.value }))}
                      placeholder="Nome da rua ou avenida"
                      className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Número</label>
                      <input
                        type="text"
                        value={shippingAddress.number}
                        onChange={e => setShippingAddress(prev => ({ ...prev, number: e.target.value }))}
                        placeholder="Número"
                        className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Complemento</label>
                      <input
                        type="text"
                        value={shippingAddress.complement}
                        onChange={e => setShippingAddress(prev => ({ ...prev, complement: e.target.value }))}
                        placeholder="Apto, Sala, Bloco, etc"
                        className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Bairro</label>
                    <input
                      type="text"
                      value={shippingAddress.neighborhood}
                      onChange={e => setShippingAddress(prev => ({ ...prev, neighborhood: e.target.value }))}
                      placeholder="Ex: Centro"
                      className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Cidade</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={e => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Ex: São Paulo"
                        className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">UF</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={e => setShippingAddress(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                        placeholder="UF"
                        maxLength={2}
                        className="w-full bg-white border border-gray-200/60 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none text-center transition-colors font-bold text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={applyPixDiscount} 
                  onChange={(e) => setApplyPixDiscount(e.target.checked)}
                  className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] w-4 h-4"
                />
                <span className="text-sm font-bold text-gray-700">Aplicar Desconto PIX/Dinheiro ({(settings.pixDiscount || 0) * 100}%)</span>
              </label>

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-700">Desconto Extra (R$):</span>
                <input 
                  type="number"
                  min="0"
                  step="0.01"
                  value={extraDiscount || ''}
                  onChange={(e) => setExtraDiscount(Number(e.target.value))}
                  className="w-24 bg-white border border-gray-200/60 rounded-lg p-1.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800 text-right"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Forma de Pagamento:</span>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-40 bg-white border border-gray-200/60 rounded-lg p-1.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
                
                {paymentMethod === 'Cartão de Crédito' && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Parcelas:</span>
                    <select
                      value={installments}
                      onChange={(e) => setInstallments(Number(e.target.value))}
                      className="w-24 bg-white border border-gray-200/60 rounded-lg p-1.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
                        <option key={num} value={num}>{num}x</option>
                      ))}
                    </select>
                  </div>
                )}

                {(paymentMethod === 'Pix' || paymentMethod === 'Dinheiro') && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">Condição:</span>
                    <select
                      value={paymentCondition}
                      onChange={(e) => setPaymentCondition(e.target.value)}
                      className="w-40 bg-white border border-gray-200/60 rounded-lg p-1.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800"
                    >
                      <option value="a_vista">À vista</option>
                      <option value="50_50">Sinal 50% / Entrega 50%</option>
                    </select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">Valor de Entrada (R$):</span>
                  <input 
                    type="number"
                    min="0"
                    step="0.01"
                    value={downPayment || ''}
                    onChange={(e) => setDownPayment(Number(e.target.value))}
                    className="w-24 bg-white border border-gray-200/60 rounded-lg p-1.5 text-sm focus:border-[var(--color-primary)] outline-none transition-colors font-medium text-gray-800 text-right"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              {applyPixDiscount && (
                <div className="flex justify-between items-center text-xs text-green-600 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                  <span>Desconto PIX/Dinheiro</span>
                  <span>-{formatPrice(pixDiscountAmount)}</span>
                </div>
              )}
              {extraDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-green-600 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                  <span>Desconto Extra</span>
                  <span>-{formatPrice(extraDiscount)}</span>
                </div>
              )}
              {shippingMode !== 'retirada' && (
                <div className="flex justify-between items-center text-xs text-gray-500 font-medium pb-2 border-b border-gray-200/50 border-dashed">
                  <span>Frete {shippingMode === 'gratis' && '(Grátis)'}</span>
                  <span>{shippingMode === 'gratis' ? 'Grátis' : formatPrice(shippingCost)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">Total</span>
                <span className="text-xl font-black text-[var(--color-primary)]">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 font-bold flex items-center gap-1.5"><User size={14} /> Cliente</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Nome do Cliente *"
                value={customerInfo.name}
                onFocus={() => setShowCustomerDropdown(true)}
                onChange={(e) => {
                  setCustomerInfo({...customerInfo, name: e.target.value});
                  setShowCustomerDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
              />
              {showCustomerDropdown && customersList.filter(c => c.name.toLowerCase().includes(customerInfo.name.toLowerCase()) || (c.phone && c.phone.includes(customerInfo.name))).length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {customersList
                    .filter(c => c.name.toLowerCase().includes(customerInfo.name.toLowerCase()) || (c.phone && c.phone.includes(customerInfo.name)))
                    .map((c, idx) => (
                      <div 
                        key={idx} 
                        className="p-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                        onClick={() => {
                          setCustomerInfo({ ...customerInfo, name: c.name, phone: c.phone, email: c.email });
                          setShowCustomerDropdown(false);
                        }}
                      >
                        <div className="text-sm font-medium text-gray-800">{c.name}</div>
                        {(c.phone || c.email) && (
                          <div className="text-xs text-gray-500">{c.phone} {c.email ? `• ${c.email}` : ''}</div>
                        )}
                      </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Telefone / WhatsApp"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
              />
              <input
                type="email"
                placeholder="E-mail (opcional)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors"
              />
            </div>
            <textarea
              placeholder="Observações do pedido/orçamento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[60px] resize-y"
            />
            <textarea
              placeholder="Política de Pagamento"
              value={paymentPolicy}
              onChange={(e) => setPaymentPolicy(e.target.value)}
              className="w-full text-sm bg-gray-50/50 hover:bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-primary)] focus:bg-white transition-colors min-h-[120px] resize-y mt-3"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => handleSave('Pendente')}
              disabled={isSaving || cart.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <Save size={18} />
              Concluir Venda
            </button>
            <button
              onClick={() => handleSave('Orçamento')}
              disabled={isSaving || cart.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-transparent text-[var(--color-primary)] py-2.5 rounded-xl font-bold text-xs hover:bg-blue-50/50 transition-colors disabled:opacity-50"
            >
              <FileText size={14} />
              Salvar como Orçamento
            </button>
          </div>
        </div>
      </div>

      {/* Modal Novo Item Avulso */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative border border-gray-200 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowCustomModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Plus size={24} className="text-[var(--color-primary)]" />
              Produto Personalizado
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Nome do Produto *</label>
                <input
                  type="text"
                  value={customItem.name}
                  onChange={e => setCustomItem({...customItem, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  placeholder="Ex: Caneca Mágica Especial"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Preço Venda (R$) *</label>
                  <input
                    type="text"
                    value={customItem.price ? customItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomItem({...customItem, price: val ? parseInt(val, 10) / 100 : 0});
                    }}
                    placeholder="0,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none font-bold"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Custo (R$)</label>
                  <input
                    type="text"
                    value={customItem.costPrice !== undefined && customItem.costPrice > 0 ? customItem.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setCustomItem({...customItem, costPrice: val ? parseInt(val, 10) / 100 : undefined});
                    }}
                    placeholder="Ex: 15,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
                <div className="w-24">
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Qtd</label>
                  <input
                    type="number"
                    min="1"
                    value={customItem.quantity}
                    onChange={e => setCustomItem({...customItem, quantity: parseInt(e.target.value) || 1})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none text-center font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">URL da Imagem (Opcional)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customItem.image}
                    onChange={e => setCustomItem({...customItem, image: convertGoogleDriveUrl(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                    placeholder="Cole o link da imagem (Google Drive, etc)"
                  />
                </div>
                {customItem.image && (
                  <div className="mt-3 w-20 h-20 rounded border border-gray-200 overflow-hidden bg-white">
                    <img src={convertGoogleDriveUrl(customItem.image)} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="saveToAvulsos"
                  checked={customItem.saveToAvulsos}
                  onChange={e => setCustomItem({...customItem, saveToAvulsos: e.target.checked})}
                  className="w-4 h-4 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="saveToAvulsos" className="text-xs font-bold text-purple-900 cursor-pointer">
                  Salvar produto na lista de {settings.posCustomItemLabel || 'Personalizáveis'} para usos futuros
                </label>
              </div>

              <button
                onClick={handleAddCustomItem}
                className="w-full mt-4 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-colors shadow-sm"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Avulso Modal */}
      {showEditAvulsoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Editar Produto Avulso</h2>
              <button onClick={() => setShowEditAvulsoModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Nome do Produto *</label>
                <input
                  type="text"
                  value={showEditAvulsoModal.name}
                  onChange={e => setShowEditAvulsoModal({...showEditAvulsoModal, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Preço Venda (R$) *</label>
                  <input
                    type="text"
                    value={showEditAvulsoModal.price ? showEditAvulsoModal.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setShowEditAvulsoModal({...showEditAvulsoModal, price: val ? parseInt(val, 10) / 100 : 0});
                    }}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">Custo (R$)</label>
                  <input
                    type="text"
                    value={showEditAvulsoModal.costPrice !== undefined && showEditAvulsoModal.costPrice > 0 ? showEditAvulsoModal.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      setShowEditAvulsoModal({...showEditAvulsoModal, costPrice: val ? parseInt(val, 10) / 100 : undefined});
                    }}
                    placeholder="Ex: 15,00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase mb-1 block">URL da Imagem (Opcional)</label>
                <input
                  type="text"
                  value={showEditAvulsoModal.image || ''}
                  onChange={e => setShowEditAvulsoModal({...showEditAvulsoModal, image: convertGoogleDriveUrl(e.target.value)})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <button
                onClick={handleUpdateAvulso}
                className="w-full mt-4 bg-[var(--color-primary)] text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:brightness-110 transition-colors shadow-sm"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceiptPreview && savedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:z-0">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-receipt-area, #printable-receipt-area * {
                visibility: visible !important;
              }
              #printable-receipt-area {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                border: none !important;
                box-shadow: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }
            }
          `}</style>
          <div className="bg-white w-full max-w-3xl rounded-2xl p-6 relative border border-gray-200 shadow-2xl flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:p-0 print:w-full print:h-auto print:static">
            
            {/* Header hidden on print */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100 shrink-0 print:hidden">
              <h3 className="text-lg font-black uppercase tracking-wider text-gray-900 flex items-center gap-2">
                <FileText className={savedOrder.status === 'Orçamento' ? "text-purple-600" : "text-green-600"} size={20} /> 
                {savedOrder.status === 'Orçamento' ? 'Orçamento' : 'Recibo'} #{savedOrder.id.substring(0, 8)}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const docUrl = `${window.location.origin}/document/${savedOrder.id}`;
                    let message = `Olá, *${savedOrder.customer || ''}*!\n\n`;
                    message += `Aqui está o resumo do seu *${savedOrder.status === 'Orçamento' ? 'ORÇAMENTO' : 'PEDIDO'}* #${savedOrder.id.substring(0, 8)}:\n\n`;
                    
                    savedOrder.items.forEach((item) => {
                      message += `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}\n`;
                    });
                    
                    message += `\n*SUBTOTAL:* ${formatPrice(savedOrder.subtotal || savedOrder.total)}\n`;
                    if (savedOrder.discount > 0) {
                      message += `*DESCONTO:* -${formatPrice(savedOrder.discount)}\n`;
                    }
                    if (savedOrder.shippingMode !== 'retirada') {
                      message += `*FRETE:* ${savedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(savedOrder.shippingCost || 0)}\n`;
                    }
                    message += `*TOTAL:* ${formatPrice(savedOrder.total)}\n\n`;
                    
                    message += `Você pode visualizar, imprimir ou baixar o documento profissional em PDF com o nosso logotipo, fotos dos produtos e nossa *Política de Pagamento* clicando no link abaixo:\n`;
                    message += `🔗 ${docUrl}\n\n`;
                    
                    if (savedOrder.notes) {
                      message += `*Observações:*\n${savedOrder.notes}\n\n`;
                    }
                    
                    message += `Qualquer dúvida, estamos à disposição!`;
                
                    const encodedMessage = encodeURIComponent(message);
                    const phoneNumber = savedOrder.phone ? savedOrder.phone.replace(/\D/g, '') : '';
                    
                    if (phoneNumber) {
                      const prefix = phoneNumber.startsWith('55') || phoneNumber.length > 11 ? '' : '55';
                      window.open(`https://wa.me/${prefix}${phoneNumber}?text=${encodedMessage}`, '_blank');
                    } else {
                      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
                    }
                  }}
                  className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1DA851] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Printer size={14} /> Imprimir
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Download size={14} /> Baixar PDF
                </button>
                <button 
                  onClick={closeReceipt} 
                  className="text-gray-400 hover:text-gray-900 p-1 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  title="Fechar e Novo Pedido"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Receipt Printable Content */}
            <div className="flex-1 overflow-y-auto pr-1 print:overflow-visible print:pr-0">
              <div id="printable-receipt-area" className="bg-white p-6 sm:p-10 rounded-2xl border border-gray-100 text-gray-800 min-h-[650px] print:border-none print:p-0 flex flex-col justify-between">
                
                <div className="space-y-6">
                  {/* Store Header with Logo */}
                  <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6">
                    <div>
                      {settings.logoUrl ? (
                        <img src={convertGoogleDriveUrl(settings.logoUrl)} alt="Logo" className="h-16 object-contain mb-2" referrerPolicy="no-referrer" />
                      ) : (
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-2">
                          {settings.storeName || 'Inkys'}
                        </h2>
                      )}
                      {settings.whatsappNumber && (
                        <p className="text-xs text-gray-500 font-semibold tracking-wide">
                          WhatsApp: {settings.whatsappNumber}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <h1 className="text-2xl font-black uppercase tracking-widest text-gray-300 mb-1">
                        {savedOrder.status === 'Orçamento' ? 'ORÇAMENTO' : 'RECIBO'}
                      </h1>
                      <p className="text-xs text-gray-600 font-medium"><strong>Data:</strong> {savedOrder.displayDate}</p>
                      <p className="text-xs text-gray-600 font-medium">
                        <strong>{savedOrder.status === 'Orçamento' ? 'Ref ID' : 'Pedido ID'}:</strong> #{savedOrder.id}
                      </p>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">CLIENTE:</h3>
                    <p className="text-base font-extrabold text-gray-900">{savedOrder.customer}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-xs text-gray-600 font-medium">
                      {(savedOrder.doc || savedOrder.shippingInfo?.cpf) && <p><strong>CPF/CNPJ:</strong> {savedOrder.doc || savedOrder.shippingInfo?.cpf}</p>}
                      {savedOrder.phone && <p><strong>WhatsApp:</strong> {savedOrder.phone}</p>}
                      {savedOrder.email && <p className="truncate"><strong>E-mail:</strong> {savedOrder.email}</p>}
                    </div>
                  </div>

                  {/* Delivery Info */}
                  {savedOrder.shippingInfo && savedOrder.shippingInfo.mode !== 'retirada' && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Endereço de Entrega</h3>
                      <div className="text-xs text-gray-700 space-y-1 font-medium">
                        {savedOrder.shippingInfo.street ? (
                          <>
                            <p className="font-extrabold text-gray-900">
                              {savedOrder.shippingInfo.street}, {savedOrder.shippingInfo.number} {savedOrder.shippingInfo.complement && <span className="text-gray-500 font-normal">- {savedOrder.shippingInfo.complement}</span>}
                            </p>
                            <p>{savedOrder.shippingInfo.neighborhood} - {savedOrder.shippingInfo.city} / {savedOrder.shippingInfo.state}</p>
                            {savedOrder.shippingInfo.zipCode && <p className="text-[10px] text-gray-400 font-mono pt-0.5">CEP: {savedOrder.shippingInfo.zipCode}</p>}
                          </>
                        ) : (
                          <p className="whitespace-pre-line leading-relaxed">{savedOrder.shippingInfo.address}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-800 text-xs font-black uppercase tracking-wider text-gray-400">
                          <th className="py-3 pl-2">DESCRIÇÃO</th>
                          <th className="py-3 text-center w-16">QTD</th>
                          <th className="py-3 text-right w-24">UNIT.</th>
                          <th className="py-3 text-right pr-2 w-28">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedOrder.items.map((item: any, i: number) => (
                          <tr key={i} className="border-b border-gray-100 text-xs">
                            <td className="py-3 pl-2 font-semibold text-gray-900 leading-relaxed">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img 
                                    src={item.image ? convertGoogleDriveUrl(item.image) : ''} 
                                    alt={item.name} 
                                    className="w-10 h-10 object-cover rounded-lg border border-gray-200 shadow-2xs shrink-0" 
                                    referrerPolicy="no-referrer" 
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
                                    <ImageIcon size={14} className="text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-extrabold text-gray-900">{item.name}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                            <td className="py-3 text-right text-gray-600 font-semibold">{formatPrice(item.price)}</td>
                            <td className="py-3 text-right pr-2 font-extrabold text-gray-900">{formatPrice(item.price * item.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Notes */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-gray-100">
                    <div className="w-full sm:w-1/2 space-y-4">
                      {savedOrder.notes && (
                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 text-xs leading-relaxed">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">OBSERVAÇÕES</h4>
                          <p className="text-gray-600 font-medium whitespace-pre-wrap">{savedOrder.notes}</p>
                        </div>
                      )}

                    </div>
                    
                    <div className="w-full sm:w-64 space-y-2 text-xs font-semibold">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal:</span>
                        <span>{formatPrice(savedOrder.subtotal || savedOrder.total)}</span>
                      </div>
                      {savedOrder.discount > 0 && (
                        <div className="flex justify-between text-red-600 font-bold">
                          <span>Desconto:</span>
                          <span>-{formatPrice(savedOrder.discount)}</span>
                        </div>
                      )}
                      {savedOrder.shippingMode && savedOrder.shippingMode !== 'retirada' && (
                        <div className="flex justify-between text-gray-500">
                          <span>Frete {savedOrder.shippingMode === 'gratis' ? '(Grátis)' : ''}:</span>
                          <span>{savedOrder.shippingMode === 'gratis' ? 'Grátis' : formatPrice(savedOrder.shippingCost || 0)}</span>
                        </div>
                      )}
                      
                      {savedOrder.paymentMethod && (
                        <div className="flex justify-between text-gray-700 font-semibold border-t border-dashed border-gray-200 pt-2 mt-2">
                          <span>Forma de Pagamento:</span>
                          <span>
                            {savedOrder.paymentMethod}
                            {savedOrder.paymentMethod === 'Cartão de Crédito' && savedOrder.installments > 1 ? ` (${savedOrder.installments}x)` : ''}
                            {(savedOrder.paymentMethod === 'Pix' || savedOrder.paymentMethod === 'Dinheiro') && savedOrder.paymentConditions ? ` - ${savedOrder.paymentConditions}` : ''}
                          </span>
                        </div>
                      )}

                      {savedOrder.downPayment > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-semibold pt-1">
                            <span>Entrada:</span>
                            <span>-{formatPrice(savedOrder.downPayment)}</span>
                          </div>
                          <div className="flex justify-between text-blue-600 font-semibold pt-1">
                            <span>Falta Pagar:</span>
                            <span>{formatPrice(savedOrder.total - savedOrder.downPayment)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between text-lg font-black border-t-2 pt-2 border-gray-800 text-gray-900 mt-2">
                        <span>Total Geral:</span>
                        <span className="text-gray-900">{formatPrice(savedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {savedOrder.shippingMode && savedOrder.shippingMode !== 'retirada' && savedOrder.shippingInfo && (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mt-4">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">ENDEREÇO DE ENTREGA:</h3>
                    <p className="text-xs text-gray-700 font-medium whitespace-pre-line">
                      {savedOrder.shippingInfo.street}, {savedOrder.shippingInfo.number} {savedOrder.shippingInfo.complement ? `- ${savedOrder.shippingInfo.complement}` : ''}
                      <br />
                      {savedOrder.shippingInfo.neighborhood} - {savedOrder.shippingInfo.city}/{savedOrder.shippingInfo.state}
                      <br />
                      CEP: {savedOrder.shippingInfo.zipCode}
                    </p>
                  </div>
                )}

                {/* Payment Policy Block */}
                {savedOrder.paymentPolicy && (
                  <div className="bg-blue-50/40 border border-blue-100 p-5 rounded-2xl space-y-2 mt-4 print:mt-6">
                    <div className="flex items-center gap-1.5 text-blue-900 font-extrabold uppercase tracking-wide text-xs">
                      <CreditCard size={14} className="text-blue-700" />
                      <span>Política de Pagamento</span>
                    </div>
                    <p className="text-xs text-blue-900/90 whitespace-pre-line font-medium leading-relaxed">
                      {savedOrder.paymentPolicy}
                    </p>
                  </div>
                )}

                {/* Additional Notes */}
                {savedOrder.notes && (
                  <div className="text-xs text-gray-600 border-t border-gray-100 pt-4 mt-4 bg-gray-50/50 p-4 rounded-xl leading-relaxed">
                    <p className="font-extrabold uppercase tracking-wider text-gray-400 mb-1">Observações:</p>
                    <p className="whitespace-pre-line font-medium">{savedOrder.notes}</p>
                  </div>
                )}

                {/* Bottom Declaration / Footer */}
                <div className="mt-8 border-t border-gray-100 pt-6 text-center text-[10px] text-gray-400 space-y-4">
                  <p className="font-medium">
                    {savedOrder.status === 'Orçamento'
                      ? 'Este documento trata-se de uma proposta comercial sujeita a aprovação das partes.'
                      : `Recebemos de ${savedOrder.customer || 'Cliente'} a quantia líquida de ${formatPrice(savedOrder.total)} descrita neste documento.`}
                  </p>
                  <p className="text-[9px] text-gray-300">Documento gerado eletronicamente por {settings.storeName || 'Inkys'}</p>
                  
                  {/* Centered signature logo */}
                  <div className="flex justify-center pt-2">
                    {settings.logoUrl ? (
                      <img src={convertGoogleDriveUrl(settings.logoUrl)} alt="Assinatura" className="h-12 object-contain opacity-40 grayscale" referrerPolicy="no-referrer" />
                    ) : (
                      <p className="text-[12px] font-black uppercase tracking-widest text-gray-300">{settings.storeName || 'Inkys'}</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
