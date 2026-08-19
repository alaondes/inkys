import { convertGoogleDriveUrl } from '../lib/urlUtils';
import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, MessageCircle, CreditCard, Truck, ShieldCheck, User, Star, Heart, Gift, X, Plus, Minus, ChevronDown, ChevronRight, Mail, Clock, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice, Product } from '../data/products';
import { generateWhatsAppLink, CheckoutData } from '../utils/whatsapp';
import { ProductCard } from '../components/ProductCard';
import { ProductCarousel } from '../components/ProductCarousel';
import { CheckoutPage } from '../components/CheckoutPage';
import { CustomProductPage } from './CustomProductPage';
import { ProductDetails } from './ProductDetails';
import { useProducts } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import { Link, useSearchParams } from 'react-router-dom';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  cartItemId: string;
  file?: File;
  fileUrl?: string;
  customText?: string;
  customMusic?: string;
  customImage?: string;
}

export function Storefront() {
  const { products } = useProducts();
  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  const [isAdminHovered, setIsAdminHovered] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.dropdown-container')) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    import('localforage').then((localforage) => {
      const lf = localforage.default || localforage;
      lf.getItem<CartItem[]>('cart').then((savedCart) => {
        if (savedCart) {
          setCart(savedCart);
        }
        setIsCartLoaded(true);
      }).catch((e: any) => {
        console.error('Failed to load cart from localforage', e);
        setIsCartLoaded(true);
      });
    }).catch(e => {
      console.error('Failed to import localforage', e);
      setIsCartLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isCartLoaded) {
      import('localforage').then((localforage) => {
        const lf = localforage.default || localforage;
        lf.setItem('cart', cart).catch((e: any) => {
          console.error('Failed to save cart to localforage', e);
        });
      }).catch(e => {
        console.error('Failed to import localforage for saving', e);
      });
    }
  }, [cart, isCartLoaded]);

  const [searchParams, setSearchParams] = useSearchParams();
  const viewParam = searchParams.get('view');
  const categoryParam = searchParams.get('category');
  const productIdParam = searchParams.get('id');

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'checkout' | 'custom' | 'order-success'>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'custom' || view === 'personalizado' || view === 'personalizados') {
      return 'custom';
    }
    if (view === 'product') {
      return 'product';
    }
    return 'home';
  });
  
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    id: string;
    total: number;
    whatsappUrl: string;
    invoiceUrl?: string;
    paymentMethod?: string;
    pixCode?: string;
    pixQrCodeUrl?: string;
  } | null>(null);

  useEffect(() => {
    if (viewParam === 'product' && productIdParam) {
      if (products.length > 0) {
        const product = products.find(p => p.id === productIdParam);
        if (product) {
          setSelectedProduct(product);
          if (currentView !== 'product') {
            setCurrentView('product');
          }
        }
      }
    } else if (viewParam === 'custom' || viewParam === 'personalizado' || viewParam === 'personalizados') {
      if (currentView !== 'custom') {
        setCurrentView('custom');
      }
    } else if (!viewParam && (currentView === 'custom' || currentView === 'product')) {
      setCurrentView('home');
      setSelectedProduct(null);
    }
  }, [viewParam, productIdParam, products]);

  const [searchQuery, setSearchQuery] = useState('');

  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterPriceRange, setFilterPriceRange] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    const banners = settings.heroBanners || [];
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [settings.heroBanners]);

  const addToCart = (product: any, selectedColor?: string, selectedSize?: string, customData?: { text?: string, music?: string, image?: string }, initialQuantity: number = 1) => {
    // Generate unique ID based on customization to separate items
    const customHash = customData ? btoa(JSON.stringify(customData)).slice(0, 10) : 'default';
    const cartItemId = `${product.id}-${selectedColor || 'default'}-${selectedSize || 'default'}-${customHash}`;
    
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + initialQuantity } : item
        );
      }
      return [...prev, { 
        ...product, 
        quantity: initialQuantity, 
        selectedColor,
        selectedSize, 
        cartItemId,
        customText: customData?.text,
        customMusic: customData?.music,
        customImage: customData?.image
      }];
    });
    setIsCartOpen(true);
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartItemId === cartItemId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const updateItemFile = (cartItemId: string, file: File | undefined) => {
    setCart(prev => prev.map(item => 
      item.cartItemId === cartItemId ? { ...item, file } : item
    ));
  };

  const handleCheckout = () => {
    setCurrentView('checkout');
    window.scrollTo(0, 0);
  };

  const handleWhatsAppRedirect = async (data: CheckoutData) => {
    if (cart.length === 0) return;
    
    const toast = (await import('react-hot-toast')).default;
    const { db } = await import('../lib/firebase');
    const { collection, addDoc, setDoc, doc, writeBatch, increment, serverTimestamp } = await import('firebase/firestore');

    try {
      const updatedCart = [...cart];
      const batch = writeBatch(db);
      
      // Upload files and queue stock deduction
      for (let i = 0; i < updatedCart.length; i++) {
        const item = updatedCart[i];
        if (item.file) {
          const { resizeImage } = await import('../utils/image');
          const url = await resizeImage(item.file, 800, 800);
          updatedCart[i].fileUrl = url;
          // Don't send File object to firestore
          delete updatedCart[i].file;
        }
        
        // Deduct stock
        if (item.id && item.stock !== undefined) {
          batch.update(doc(db, 'products', item.id), {
            stock: increment(-item.quantity)
          });
        }
      }
      
      // Execute all stock deductions atomically
      batch.commit().catch(e => console.error('Failed to deduct stock in batch', e));

      const subtotal = updatedCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const discount = Number(data.couponDiscount) || 0;
      const subAfterCoupon = Math.max(0, subtotal - discount);
      const pixDiscount = data.paymentMethod === 'pix' ? subAfterCoupon * 0.10 : 0;
      const shippingCost = Number(data.shippingCost ?? data.shippingOption?.price ?? 0);
      const finalTotal = subAfterCoupon - pixDiscount + shippingCost;

      // Clean items and shipping info to prevent Firestore undefined errors
      const cleanItems = updatedCart.map(item => {
        const cleanItem: any = {
          id: item.id || '',
          name: item.name || '',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          category: item.category || 'Outros',
          image: item.image || '',
        };
        if (item.selectedColor !== undefined && item.selectedColor !== null) {
          cleanItem.selectedColor = item.selectedColor;
        }
        if (item.fileUrl !== undefined && item.fileUrl !== null) {
          cleanItem.fileUrl = item.fileUrl;
        }
        if (item.customText !== undefined && item.customText !== null) {
          cleanItem.customText = item.customText;
        }
        if (item.customMusic !== undefined && item.customMusic !== null) {
          cleanItem.customMusic = item.customMusic;
        }
        if (item.customImage !== undefined && item.customImage !== null) {
          cleanItem.customImage = item.customImage;
        }
        return cleanItem;
      });

      const cleanShippingInfo: any = {
        email: data.email || '',
        type: data.type || '',
        name: data.name || '',
        cpf: data.cpf || '',
        phone: data.phone || '',
        address: data.address || '',
        street: data.street || '',
        number: data.number || '',
        complement: data.complement || '',
        neighborhood: data.neighborhood || '',
        city: data.city || '',
        state: data.state || '',
        zipCode: data.zipCode || '',
        paymentMethod: data.paymentMethod || '',
        shippingCost: Number(data.shippingCost) || 0,
        couponDiscount: Number(data.couponDiscount) || 0,
      };

      if (data.gender) cleanShippingInfo.gender = data.gender;
      if (data.birthDate) cleanShippingInfo.birthDate = data.birthDate;
      if (data.landline) cleanShippingInfo.landline = data.landline;
      if (data.coupon) cleanShippingInfo.coupon = data.coupon;

      const { generateSequentialId } = await import('../lib/firestoreUtils');
      let orderId = "";
      try {
        orderId = await generateSequentialId(db, 'Pendente', settings.storeName);
      } catch (e) {
        console.warn("Failed to generate sequential ID, using fallback", e);
        orderId = `WEB-${Date.now().toString().slice(-6)}`;
      }

      let asaasInvoiceUrl = "";
      let asaasPaymentId = "";
      let asaasPixCode = "";
      let asaasPixQrCodeUrl = "";

      if (data.paymentMethod === 'credit' || data.paymentMethod === 'pix') {
        try {
          const asaasResponse = await fetch('/api/asaas/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderId,
              total: finalTotal,
              paymentMethod: data.paymentMethod,
              customer: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                cpf: data.cpf
              }
            })
          });

          if (!asaasResponse.ok) {
            const errData = await asaasResponse.json();
            throw new Error(errData.error || 'Erro ao gerar pagamento no Asaas');
          }

          const asaasData = await asaasResponse.json();
          asaasInvoiceUrl = asaasData.invoiceUrl;
          asaasPaymentId = asaasData.asaasPaymentId;
          asaasPixCode = asaasData.pixCode || "";
          asaasPixQrCodeUrl = asaasData.pixQrCodeUrl || "";
        } catch (err: any) {
          console.error("Erro no pagamento Asaas:", err);
          toast.error("Não foi possível gerar a cobrança no Asaas. Pedido continuará sem pagamento eletrônico: " + err.message);
        }
      }

      // Create order in Firestore
      const orderData: any = {
        customer: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        total: finalTotal || 0,
        status: 'Pendente',
        date: serverTimestamp(),
        items: cleanItems,
        shippingInfo: cleanShippingInfo
      };

      if (asaasInvoiceUrl) {
        orderData.asaasInvoiceUrl = asaasInvoiceUrl;
        orderData.asaasPaymentId = asaasPaymentId;
      }

      try {
        // We don't await these so they don't block the WhatsApp redirect if offline, 
        // Firestore will queue them and sync when online.
        setDoc(doc(db, 'orders', orderId), orderData).catch(e => console.error("Error saving order:", e));
        
        const identifier = data.email?.toLowerCase().trim() || data.phone?.trim() || data.name?.trim();
        if (identifier) {
          const cId = identifier.replace(/\//g, '_');
          setDoc(doc(db, 'customers', cId), {
            identifier,
            name: data.name || 'Cliente Site',
            email: data.email || '',
            phone: data.phone || '',
            doc: data.cpf || '',
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(e => console.error("Error saving customer:", e));
        }
        
        // Trigger automatic email
        fetch('/api/email/order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order: { ...orderData, date: new Date().toISOString(), id: orderId },
            customerEmail: data.email
          })
        }).catch(err => console.error("Error triggering email:", err));
        
      } catch (dbError: any) {
        console.warn("Could not save order to db, proceeding with WhatsApp only:", dbError);
        toast.error("Aviso: " + (dbError.message || 'Erro ao registrar no sistema. Contate a loja.'));
      }

      const whatsappUrl = generateWhatsAppLink(updatedCart, data, settings.whatsappNumber, orderId);

      // Open payment link automatically if card
      if (asaasInvoiceUrl) {
        try {
          window.open(asaasInvoiceUrl, '_blank');
        } catch (popupErr) {
          console.warn("Pop-up blocked from opening asaas invoice url directly", popupErr);
        }
      }

      setCompletedOrder({
        id: orderId,
        total: finalTotal,
        whatsappUrl: whatsappUrl,
        invoiceUrl: asaasInvoiceUrl || undefined,
        paymentMethod: data.paymentMethod,
        pixCode: asaasPixCode || undefined,
        pixQrCodeUrl: asaasPixQrCodeUrl || undefined
      });

      setCart([]);
      setCurrentView('order-success');
      window.scrollTo(0, 0);
      toast.success('Pedido finalizado com sucesso!');
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Erro ao processar seu pedido. Tente novamente.');
      throw error;
    }
  };

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('product');
    setSearchParams({ view: 'product', id: product.id });
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setSearchParams({});
    setCurrentView('home');
    setSelectedProduct(null);
    setCompletedOrder(null);
    window.scrollTo(0, 0);
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const visibleProducts = products.filter(p => !p.hidden);

  const getProductsByCategory = (cat: string) => {
    return visibleProducts.filter(p => (p.category || 'Outros') === cat);
  };

  const categories = Array.from<string>(new Set([
    ...(settings.categories || []),
    ...visibleProducts.map(p => p.category || 'Outros')
  ]));

  const superCategoryMap: Record<string, string> = {};
  const groupedCategories: Record<string, string[]> = {};
  
  if (settings.categoryGroups) {
    Object.entries(settings.categoryGroups).forEach(([group, cats]) => {
      groupedCategories[group] = [];
      cats.forEach(cat => {
        superCategoryMap[cat] = group;
      });
    });
  } else {
    // Fallback if not configured
    const defaultGroups = {
      'Datas Especiais': ['Dia dos Pais', 'Dia das Mães', 'Dia dos Avós', 'Dia dos Namorados', 'Dia dos Professores', 'Dia das Mulheres', 'Aniversário'],
      'Temas': ['Anos 80/90', '80/90', 'Música', 'Divertidas', 'Geek/Nerd'],
      'Para Quem': ['Casais', 'Amigo(a)', 'Família']
    };
    Object.entries(defaultGroups).forEach(([group, cats]) => {
      groupedCategories[group] = [];
      cats.forEach(cat => {
        superCategoryMap[cat] = group;
      });
    });
  }

  const ungroupedCategories: string[] = [];

  categories.forEach(cat => {
    const group = superCategoryMap[cat];
    if (group) {
      if (!groupedCategories[group].includes(cat)) {
        groupedCategories[group].push(cat);
      }
    } else {
      ungroupedCategories.push(cat);
    }
  });

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ backgroundColor: settings.siteBackgroundColor || '#f9fafb' }}>
      
      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setIsCartOpen(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Seu Carrinho</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {cart.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Seu carrinho está vazio.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.cartItemId} className="flex gap-4 border-b border-gray-50 pb-4">
                      <img src={convertGoogleDriveUrl(item.image)} alt={item.name} className="w-20 h-20 object-cover rounded-md" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-2">{item.name}</h4>
                        {item.selectedColor && <p className="text-xs text-gray-500 mt-1">Cor: {item.selectedColor}</p>}
                        {item.customText && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">Texto: "{item.customText}"</p>}
                        {item.customMusic && <p className="text-xs text-blue-500 mt-1 line-clamp-1 truncate hover:underline"><a href={item.customMusic} target="_blank" rel="noreferrer">Música (Link)</a></p>}
                        {item.customImage && (
                          <div className="mt-2 flex items-center gap-2 border border-gray-100 p-1 rounded-md w-fit bg-gray-50">
                             <img src={convertGoogleDriveUrl(item.customImage)} alt="Custom upload" className="w-8 h-8 object-cover rounded shadow-sm" referrerPolicy="no-referrer" />
                             <span className="text-[10px] text-gray-500 font-bold uppercase pr-2">Foto enviada</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                           <span className="font-bold text-[#111827]">{formatPrice(item.price)}</span>
                           <div className="flex items-center gap-3 bg-gray-50 rounded-full px-2 py-1">
                             <button onClick={() => updateQuantity(item.cartItemId, -1)} className="text-gray-500 hover:text-gray-800"><Minus size={14}/></button>
                             <span className="text-sm font-bold">{item.quantity}</span>
                             <button onClick={() => updateQuantity(item.cartItemId, 1)} className="text-gray-500 hover:text-gray-800"><Plus size={14}/></button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex justify-between font-bold text-lg mb-4 text-gray-800">
                    <span>Total:</span>
                    <span>{formatPrice(cart.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
                  </div>
                  <button onClick={() => { setIsCartOpen(false); setCurrentView('checkout'); window.scrollTo(0,0); }} className="w-full text-white py-3 rounded-md font-bold hover:brightness-110 transition-all text-center" style={{ backgroundColor: settings.buyButtonColor || '#5ba324' }}>
                    Finalizar Compra
                  </button>
                  <button onClick={() => setIsCartOpen(false)} className="w-full text-center mt-3 text-sm text-gray-500 hover:text-gray-800 font-medium cursor-pointer">
                    Continuar Comprando
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60] md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
             <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }} className="fixed top-0 left-0 h-full w-full max-w-[280px] bg-white z-[70] shadow-xl flex flex-col md:hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-100" style={{ backgroundColor: settings.headerColor }}>
                  <span className="text-white font-bold">Menu</span>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-white/80"><X size={24} /></button>
                </div>
                <div className="flex-1 overflow-y-auto flex flex-col">
                  {/* Categorias */}
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Categorias</h3>
                    <div className="flex flex-col gap-3">
                      <button onClick={() => { setSearchParams({ view: 'custom' }); setIsMobileMenuOpen(false); }} className="text-left font-bold text-[#713f12]">Personalizados ✨</button>
                      <button onClick={() => { goHome(); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-800">Início</button>
                      <button onClick={() => { setSearchParams({ category: 'all' }); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-800">Todos os Produtos</button>
                      
                      {Object.entries(groupedCategories).map(([groupName, groupCats]) => {
                        if (groupCats.length === 0) return null;
                        return (
                          <div key={groupName} className="flex flex-col gap-2 mt-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{groupName}</span>
                            {groupCats.map(cat => (
                              <button key={cat} onClick={() => { setSearchParams({ category: cat }); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-600 pl-2 border-l-2 border-gray-200">{cat}</button>
                            ))}
                          </div>
                        );
                      })}

                      {ungroupedCategories.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Outros Temas</span>
                          {ungroupedCategories.map(cat => (
                            <button key={cat} onClick={() => { setSearchParams({ category: cat }); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-600 pl-2 border-l-2 border-gray-200">{cat}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Atalhos */}
                  <div className="p-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Atalhos</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-gray-700">
                        <MessageCircle size={20} />
                        <span className="font-medium text-sm">Central de Atendimento</span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-700">
                        <User size={20} />
                        <span className="font-medium text-sm">Entrar ou Cadastrar</span>
                      </div>
                      <Link to="/admin" className="flex items-center gap-3 text-gray-700" onClick={() => setIsMobileMenuOpen(false)}>
                        <User size={20} />
                        <span className="font-medium text-sm">Painel Admin</span>
                      </Link>
                    </div>
                  </div>
                </div>
             </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Top Header - Purple */}
      <header className="sticky top-0 z-50 shadow-md backdrop-blur-md bg-opacity-95" style={{ backgroundColor: settings.headerColor, color: settings.headerTextColor || '#ffffff' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .header-hover-item:hover {
            color: ${settings.headerHoverTextColor || '#ffffff'} !important;
          }
        `}} />
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-3 md:gap-8">
            {/* Hamburger (Mobile) */}
            <button 
              className="md:hidden text-inherit hover:opacity-80 p-1 -ml-2"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={28} />
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer transition-transform hover:scale-105 duration-300" onClick={goHome}>
              {logoUrl ? (
                <img src={convertGoogleDriveUrl(logoUrl || undefined)} alt="Logo" className="h-10 sm:h-12 md:h-16 w-auto object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-tighter" style={{ color: settings.topBarColor || '#f9a8d4' }}>
                  {settings.storeName ? (
                    <>
                      {settings.storeName.substring(0, Math.ceil(settings.storeName.length / 2))}
                      <span style={{ color: settings.headerTextColor || '#ffffff' }}>
                        {settings.storeName.substring(Math.ceil(settings.storeName.length / 2))}
                      </span>
                    </>
                  ) : (
                    <>Amo<span style={{ color: settings.headerTextColor || '#ffffff' }}>Canecas</span></>
                  )}
                </div>
              )}
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-2xl relative hidden md:block group">
              <input 
                type="text" 
                placeholder="Digite o que você procura"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/95 backdrop-blur-sm text-gray-900 rounded-full py-3 px-6 pr-12 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-inner transition-all duration-300"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors">
                <Search size={20} />
              </button>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-2 cursor-pointer header-hover-item transition-colors">
                <MessageCircle size={28} />
                <div className="flex flex-col text-sm">
                  <span className="font-bold">Central de</span>
                  <span>Atendimento</span>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-2 cursor-pointer header-hover-item transition-colors">
                <User size={28} />
                <div className="flex flex-col text-sm">
                  <span className="font-bold">Bem-vindo(a)</span>
                  <span>Entrar ou Cadastrar</span>
                </div>
              </div>

              <button 
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 relative header-hover-item transition-colors"
              >
                <ShoppingCart size={28} />
                <span className="text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-2" style={{ backgroundColor: settings.topBarColor }}>
                  {cartItemsCount}
                </span>
              </button>
              
              <Link 
                to="/admin" 
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-white/10 transition-all flex items-center gap-1 shrink-0"
                style={{ 
                  backgroundColor: isAdminHovered 
                    ? (settings.adminButtonBgColorHover || 'rgba(255, 255, 255, 0.25)') 
                    : (settings.adminButtonBgColor || 'rgba(255, 255, 255, 0.15)'),
                  color: settings.adminButtonTextColor || settings.headerTextColor || '#ffffff' 
                }}
                onMouseEnter={() => setIsAdminHovered(true)}
                onMouseLeave={() => setIsAdminHovered(false)}
              >
                <User size={14} />
                <span>Admin</span>
              </Link>
            </div>
          </div>
          
          {/* Search Mobile */}
          <div className="md:hidden pb-4">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Digite o que você procura"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-white text-gray-900 rounded-full py-2 px-4 pr-10 text-sm focus:outline-none"
               />
               <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                 <Search size={18} />
               </button>
             </div>
          </div>
        </div>
        
        {/* Dynamic Navigation Menu */}
        {currentView === 'home' && (
          <div className="hidden md:block" style={{ backgroundColor: settings.navBarColor && settings.navBarColor !== 'transparent' ? settings.navBarColor : 'transparent' }}>
            <div className="max-w-[1400px] mx-auto">
              <nav className="flex items-center justify-center gap-x-4 lg:gap-x-8 gap-y-3 py-3 flex-wrap text-[13px] lg:text-sm font-bold px-4">
                <button 
                  onClick={() => setSearchParams({ view: 'custom' })}
                  className="px-3 py-1 rounded-full hover:brightness-110 transition-colors uppercase flex items-center gap-1 shadow-sm shrink-0"
                  style={{ backgroundColor: settings.customButtonBgColor || '#facc15', color: settings.customButtonTextColor || '#713f12' }}
                >
                  Personalizados ✨
                </button>
                <button 
                  onClick={goHome}
                  className={`hover:opacity-100 transition-all uppercase py-1 border-b-2 shrink-0 ${!categoryParam ? 'opacity-100 font-extrabold' : 'opacity-70 border-transparent'}`}
                  style={{ 
                    color: settings.navBarTextColor || 'inherit',
                    borderColor: !categoryParam ? (settings.navBarTextColor || 'currentColor') : 'transparent'
                  }}
                >
                  Início
                </button>
                <button 
                  onClick={() => setSearchParams({ category: 'all' })}
                  className={`hover:opacity-100 transition-all uppercase py-1 border-b-2 shrink-0 ${categoryParam === 'all' ? 'opacity-100 font-extrabold' : 'opacity-70 border-transparent'}`}
                  style={{ 
                    color: settings.navBarTextColor || 'inherit',
                    borderColor: categoryParam === 'all' ? (settings.navBarTextColor || 'currentColor') : 'transparent'
                  }}
                >
                  Todos os Produtos
                </button>
                
                {Object.entries(groupedCategories).map(([groupName, groupCats]) => {
                  if (groupCats.length === 0) return null;
                  const isActive = groupCats.includes(categoryParam || '');
                  const isOpen = activeDropdown === groupName;
                  return (
                    <div 
                      key={groupName} 
                      className="relative shrink-0 dropdown-container group"
                      onMouseEnter={() => setActiveDropdown(groupName)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      <button 
                        onClick={(e) => { e.preventDefault(); setActiveDropdown(isOpen ? null : groupName); }}
                        className={`hover:opacity-100 transition-all uppercase py-1 border-b-2 flex items-center gap-1 ${isActive ? 'opacity-100 font-extrabold' : 'opacity-70 border-transparent'}`}
                        style={{ 
                          color: settings.navBarTextColor || 'inherit',
                          borderColor: isActive ? (settings.navBarTextColor || 'currentColor') : 'transparent'
                        }}
                      >
                        {groupName} <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : 'group-hover:rotate-180'}`} />
                      </button>
                      <div className={`absolute top-[100%] left-0 pt-2 transition-all z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto'}`}>
                        <div className="bg-white shadow-xl rounded-xl py-2 min-w-[220px] border border-gray-100 flex flex-col overflow-hidden">
                          {groupCats.map(cat => (
                            <button 
                              key={cat}
                              onClick={() => { setSearchParams({ category: cat }); setActiveDropdown(null); }}
                              className={`block w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors ${categoryParam === cat ? 'text-[var(--color-primary)] font-bold bg-purple-50/50' : 'text-gray-700'}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {ungroupedCategories.map(category => (
                  <button 
                    key={category}
                    onClick={() => setSearchParams({ category })}
                    className={`hover:opacity-100 transition-all uppercase py-1 border-b-2 shrink-0 ${categoryParam === category ? 'opacity-100 font-extrabold' : 'opacity-70 border-transparent'}`}
                    style={{ 
                      color: settings.navBarTextColor || 'inherit',
                      borderColor: categoryParam === category ? (settings.navBarTextColor || 'currentColor') : 'transparent'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}
      </header>

      <main className="pb-20 min-h-[calc(100vh-140px)] bg-gray-50/30">
        {currentView === 'custom' ? (
          <CustomProductPage onBack={goHome} onAddToCart={(p, color, custom, qty) => addToCart(p, color, undefined, custom, qty)} />
        ) : currentView === 'checkout' ? (
          <CheckoutPage 
            cart={cart}
            updateItemFile={updateItemFile}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            clearCart={clearCart}
            onComplete={handleWhatsAppRedirect}
            onBack={goHome}
          />
        ) : currentView === 'order-success' && completedOrder ? (
          <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pedido Realizado!</h1>
              <p className="text-gray-500 font-medium">Obrigado por comprar conosco.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs text-left space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                <span className="text-gray-500 font-medium">Pedido</span>
                <span className="font-bold text-gray-900">#{completedOrder.id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Total</span>
                <span className="font-extrabold text-gray-900 text-lg">R$ {completedOrder.total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            {completedOrder.paymentMethod === 'pix' && (
              <div className="bg-sky-50 border border-sky-100 rounded-2xl p-6 text-center space-y-4">
                <div className="flex justify-center items-center gap-2 text-sky-950 font-bold text-base">
                  <span className="text-[#32bcad] text-lg font-black">pix</span>
                  <span>Pague para confirmar seu pedido</span>
                </div>
                
                {completedOrder.pixQrCodeUrl ? (
                  <>
                    <div className="flex flex-col items-center gap-2 bg-white p-4 rounded-xl border border-sky-100 max-w-[200px] mx-auto shadow-xs">
                      <img 
                        src={completedOrder.pixQrCodeUrl} 
                        alt="QR Code PIX" 
                        className="w-full h-auto aspect-square"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] text-gray-400 font-bold">Aponte a câmera do seu banco</span>
                    </div>

                    {completedOrder.pixCode && (
                      <div className="space-y-2">
                        <p className="text-xs text-sky-950 font-bold">Código PIX Copia e Cola:</p>
                        <div className="flex gap-2 bg-white border border-sky-200 rounded-xl p-2.5 items-center">
                          <input 
                            type="text" 
                            readOnly 
                            value={completedOrder.pixCode} 
                            className="text-xs text-gray-600 bg-transparent outline-none w-full font-mono overflow-ellipsis select-all"
                          />
                          <button 
                            onClick={async () => {
                              navigator.clipboard.writeText(completedOrder.pixCode || '');
                              const toast = (await import('react-hot-toast')).default;
                              toast.success('Código PIX copiado com sucesso!');
                            }}
                            className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-lg shrink-0 transition-colors"
                          >
                            Copiar
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white border border-amber-200 rounded-xl p-5 text-left space-y-3.5 shadow-xs">
                    <p className="text-xs text-amber-800 font-bold bg-amber-50 border border-amber-100 rounded-lg p-2.5 leading-relaxed">
                      ⚠️ **Aviso de Configuração**: A sua conta Asaas ainda não possui uma chave Pix cadastrada para gerar cobranças diretas por QR Code na loja.
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Não se preocupe! O seu cliente pode pagar via Pix (ou Cartão) clicando no botão abaixo para abrir a página de pagamento seguro do Asaas:
                    </p>
                    {completedOrder.invoiceUrl && (
                      <a 
                        href={completedOrder.invoiceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 px-6 rounded-xl shadow-sm w-full transition-colors text-sm"
                      >
                        Pagar com PIX no Asaas
                      </a>
                    )}
                    <div className="text-[10px] text-gray-400 border-t border-gray-100 pt-2 leading-relaxed">
                      💡 **Dica para o lojista**: Para que o QR Code e o Pix Copia e Cola apareçam diretamente aqui na loja, basta cadastrar qualquer chave Pix (celular, e-mail, CPF ou chave aleatória) no painel do seu Asaas.
                    </div>
                  </div>
                )}

                {completedOrder.invoiceUrl && completedOrder.pixQrCodeUrl && (
                  <div className="pt-2 border-t border-sky-100/60">
                    <a 
                      href={completedOrder.invoiceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 text-xs text-sky-700 font-bold hover:underline"
                    >
                      Ver comprovante / segunda via no Asaas ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {(completedOrder.paymentMethod === 'credit' || (!completedOrder.paymentMethod && completedOrder.invoiceUrl)) && completedOrder.invoiceUrl && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-2xl p-5 text-sm text-center space-y-3">
                <p className="font-semibold leading-relaxed">
                  💳 Abrimos a tela de pagamento do cartão de crédito em outra aba.
                </p>
                <p className="text-xs text-emerald-800">
                  Se a página não abriu, clique no botão abaixo para preencher os dados do cartão de forma 100% segura.
                </p>
                <a 
                  href={completedOrder.invoiceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-6 rounded-full shadow-sm w-full transition-colors"
                >
                  <CreditCard size={18} />
                  Pagar Agora com Cartão
                </a>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <a 
                href={completedOrder.whatsappUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white font-extrabold py-3.5 px-6 rounded-full shadow-sm w-full transition-colors"
              >
                <MessageCircle size={18} />
                Enviar Detalhes no WhatsApp
              </a>
              
              <button 
                onClick={goHome}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-full w-full transition-colors"
              >
                Voltar ao Início
              </button>
            </div>
          </div>
        ) : currentView === 'product' && selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            onBack={goHome} 
            onAddToCart={addToCart} 
          />
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 pt-6 md:pt-8">
            {(categoryParam || searchQuery) ? (
              // Category View (Dedicated Page)
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                  <button onClick={goHome} className="hover:text-gray-800 hover:underline cursor-pointer transition-all">Início</button>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">
                    {searchQuery ? `Busca: ${searchQuery}` : (categoryParam === 'all' ? 'Todos os Produtos' : categoryParam)}
                  </span>
                </div>

                {/* Header Title */}
                <div className="border-b border-gray-100 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: settings.headerTextColor || '#111827' }}>
                      {searchQuery ? 'Resultados da Busca' : (categoryParam === 'all' ? 'Todos os Produtos' : categoryParam)}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                      {(() => {
                        const count = products.filter(p => {
                          if (p.hidden) return false;
                          const matchesCategory = !categoryParam || categoryParam === 'all' || (p.category || 'Outros') === categoryParam;
                          const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                          return matchesCategory && matchesSearch;
                        }).length;
                        return `${count} ${count === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
                      })()}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <button 
                      onClick={() => setIsFilterOpen(!isFilterOpen)}
                      className="flex items-center gap-2 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 hover:bg-gray-50"
                    >
                      <Search size={16} /> Filtros { (filterInStock || filterPriceRange !== 'all') && <span className="w-2 h-2 rounded-full bg-purple-600"></span> }
                    </button>
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="newest">Lançamentos</option>
                      <option value="price_asc">Menor Preço</option>
                      <option value="price_desc">Maior Preço</option>
                    </select>

                    <button 
                      onClick={goHome}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-4 py-2 rounded-full bg-white transition-all w-fit cursor-pointer hidden sm:block"
                    >
                      ← Voltar para o início
                    </button>
                  </div>
                </div>

                {isFilterOpen && (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 mb-8 flex flex-col sm:flex-row gap-6 shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800 mb-2">Disponibilidade</h4>
                      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" checked={filterInStock} onChange={(e) => setFilterInStock(e.target.checked)} className="rounded text-purple-600 focus:ring-purple-500" />
                        Apenas em estoque
                      </label>
                    </div>
                    <div>
                       <h4 className="font-bold text-sm text-gray-800 mb-2">Faixa de Preço</h4>
                       <select value={filterPriceRange} onChange={(e) => setFilterPriceRange(e.target.value)} className="border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-700 bg-white w-full sm:w-auto">
                         <option value="all">Todos os preços</option>
                         <option value="under50">Até R$ 50,00</option>
                         <option value="50to100">R$ 50,00 a R$ 100,00</option>
                         <option value="over100">Acima de R$ 100,00</option>
                       </select>
                    </div>
                  </div>
                )}

                {/* Product Grid */}
                {(() => {
                  let filteredProducts = visibleProducts.filter(p => {
                    const matchesCategory = !categoryParam || categoryParam === 'all' || (p.category || 'Outros') === categoryParam;
                    const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          (p.description || '').toLowerCase().includes(searchQuery.toLowerCase());
                    
                    let matchesStock = true;
                    if (filterInStock) {
                      matchesStock = p.stock !== undefined && p.stock > 0;
                    }

                    let matchesPrice = true;
                    if (filterPriceRange === 'under50') matchesPrice = p.price < 50;
                    else if (filterPriceRange === '50to100') matchesPrice = p.price >= 50 && p.price <= 100;
                    else if (filterPriceRange === 'over100') matchesPrice = p.price > 100;

                    return matchesCategory && matchesSearch && matchesStock && matchesPrice;
                  });

                  if (sortBy === 'price_asc') {
                    filteredProducts.sort((a, b) => a.price - b.price);
                  } else if (sortBy === 'price_desc') {
                    filteredProducts.sort((a, b) => b.price - a.price);
                  }

                  if (filteredProducts.length === 0) {
                    return (
                      <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
                        <p className="text-gray-500 text-lg mb-4">Nenhum produto encontrado nesta categoria.</p>
                        {searchQuery && (
                          <button 
                            onClick={() => setSearchQuery('')}
                            className="text-sm text-purple-600 font-bold hover:underline cursor-pointer"
                          >
                            Limpar pesquisa
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {filteredProducts.map(product => (
                        <div key={product.id} className="h-full">
                          <ProductCard product={product} onAddToCart={openProduct} />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Standard Homepage View
              <div className="-mx-4 md:mx-0">
                {/* Hero Banner Carousel */}
                {(() => {
                  const banners = settings.heroBanners || [];
                  if (banners.length === 0) return null;

                  const currentBanner = banners[currentBannerIdx % banners.length];
                  
                  if (!currentBanner?.image) return null;

                  return (
                    <section className="w-full bg-[#f9e5e6] overflow-hidden relative rounded-2xl mb-12 aspect-[1920/633]">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentBannerIdx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.8 }}
                          className={`absolute inset-0 w-full h-full bg-cover bg-center flex items-center px-4 ${
                            currentBanner?.textAlign === 'left' ? 'justify-start md:px-16' : 
                            currentBanner?.textAlign === 'right' ? 'justify-end md:px-16' : 
                            'justify-center'
                          }`}
                          style={{ backgroundImage: `url(${currentBanner?.image})` }}
                        >
                          {currentBanner?.buttonLink && (
                            <a 
                              href={currentBanner.buttonLink}
                              onClick={(e) => {
                                try {
                                  const url = new URL(currentBanner.buttonLink, window.location.origin);
                                  if (url.hostname === window.location.hostname || url.hostname.includes('inkys.com.br')) {
                                    e.preventDefault();
                                    const params = new URLSearchParams(url.search);
                                    const newParams: Record<string, string> = {};
                                    params.forEach((value, key) => { newParams[key] = value; });
                                    setSearchParams(newParams);
                                  }
                                } catch (err) {
                                  if (currentBanner.buttonLink?.startsWith('#')) {
                                    e.preventDefault();
                                    const id = currentBanner.buttonLink.substring(1);
                                    const el = document.getElementById(id);
                                    if (el) {
                                      el.scrollIntoView({ behavior: 'smooth' });
                                    }
                                  } else if (currentBanner.buttonLink?.startsWith('?')) {
                                    e.preventDefault();
                                    const params = new URLSearchParams(currentBanner.buttonLink);
                                    const newParams: Record<string, string> = {};
                                    params.forEach((value, key) => { newParams[key] = value; });
                                    setSearchParams(newParams);
                                  }
                                }
                              }}
                              target={currentBanner.buttonLink?.startsWith('http') && !currentBanner.buttonLink.includes('inkys.com.br') && !currentBanner.buttonLink.includes(window.location.hostname) ? '_blank' : '_self'}
                              className="absolute inset-0 z-20 cursor-pointer block"
                              aria-label={currentBanner.titleHtml?.replace(/<[^>]+>/g, '') || 'Banner link'}
                            >
                              <span className="sr-only">Ver detalhes da promoção</span>
                            </a>
                          )}
                           <div className={`relative z-10 flex flex-col pointer-events-none ${
                            currentBanner?.textAlign === 'left' ? 'text-left items-start' : 
                            currentBanner?.textAlign === 'right' ? 'text-right items-end' : 
                            'text-center items-center'
                           }`}>
                              <div dangerouslySetInnerHTML={{ __html: currentBanner?.titleHtml || '' }} className={`font-bold mb-4 ${currentBanner?.titleSize || 'text-5xl'} ${currentBanner?.titleFont || 'font-sans'}`} style={{ color: currentBanner?.titleColor || settings.topBarColor }} />
                              <p className={`font-medium max-w-lg ${currentBanner?.description ? 'mb-2' : 'mb-6'} ${currentBanner?.subtitleSameSize ? (currentBanner?.titleSize || 'text-5xl') : (currentBanner?.subtitleSize || 'text-xl')} ${currentBanner?.subtitleFont || 'font-sans'}`} style={{ color: currentBanner?.subtitleColor || '#592c60' }}>{currentBanner?.subtitle}</p>
                              
                              {currentBanner?.description && (
                                <p className={`font-medium max-w-lg mb-6 ${currentBanner?.descriptionSize || 'text-xl'} ${currentBanner?.descriptionFont || 'font-sans'}`} style={{ color: currentBanner?.descriptionColor || '#592c60' }}>{currentBanner?.description}</p>
                              )}

                              {currentBanner?.buttonText && (
                                <div className="relative z-30 inline-block mt-2 pointer-events-none">
                                  <span className="font-bold text-lg uppercase tracking-wider" style={{ color: currentBanner?.buttonColor || '#000' }}>
                                    {currentBanner.buttonText} &rarr;
                                  </span>
                                </div>
                              )}
                           </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* Dots indicator */}
                      {settings.heroBanners && settings.heroBanners.length > 1 && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                          {settings.heroBanners.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setCurrentBannerIdx(idx)}
                              className={`w-3 h-3 rounded-full transition-colors ${
                                idx === currentBannerIdx % settings.heroBanners.length ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })()}

                {/* Features Row */}
                {settings.storeFeatures && settings.storeFeatures.length > 0 && (
                  <section className="border-b border-gray-200 bg-white rounded-2xl mb-12 shadow-xs">
                    <div className="max-w-[1400px] mx-auto px-4 py-8">
                      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(settings.storeFeatures.filter(f => f.enabled).length, 4)} gap-6 sm:gap-4 lg:divide-x divide-gray-200`}>
                        {settings.storeFeatures.filter(f => f.enabled).map((feature, idx) => {
                          let IconComponent: any = Search;
                          if (feature.icon === 'Truck') IconComponent = Truck;
                          else if (feature.icon === 'CreditCard') IconComponent = CreditCard;
                          else if (feature.icon === 'Zap') IconComponent = ShieldCheck;
                          else if (feature.icon === 'ShieldCheck') IconComponent = ShieldCheck;
                          else if (feature.icon === 'User') IconComponent = User;
                          else if (feature.icon === 'MessageCircle') IconComponent = MessageCircle;
                          else if (feature.icon === 'ShoppingCart') IconComponent = ShoppingCart;
                          else if (feature.icon === 'Menu') IconComponent = Menu;
                          else if (feature.icon === 'Star') IconComponent = Star;
                          else if (feature.icon === 'Heart') IconComponent = Heart;
                          else if (feature.icon === 'Gift') IconComponent = Gift;

                          return (
                            <div key={feature.id || idx} className="flex items-center justify-center gap-4 px-4">
                              {feature.icon === 'Zap' ? (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                              ) : feature.icon === 'Pix' ? (
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M2 12l5.25 5 2.625-3 5.25 5 6.875-10"/></svg>
                              ) : (
                                <IconComponent size={32} className="text-gray-700" strokeWidth={1.5} />
                              )}
                              <div>
                                <h4 className="font-bold leading-tight" style={{ color: settings.topBarColor }}>{feature.title}</h4>
                                <p className="text-gray-500 text-sm">{feature.subtitle}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </section>
                )}

                {/* Promo Banners */}
                {(settings.promoBanner1TitleHtml || settings.promoBanner2TitleHtml) && (
                  <section className="max-w-[1400px] mx-auto py-4 mb-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {settings.promoBanner1TitleHtml && (
                          <div className="rounded-3xl overflow-hidden relative h-[200px] md:h-[250px] flex items-center px-6 md:px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner1ColorStart}, ${settings.promoBanner1ColorEnd})` }} onClick={() => {
                            const link = settings.promoBanner1Link || '?category=Música';
                            if (link.startsWith('#')) {
                              const id = link.substring(1);
                              const el = document.getElementById(id);
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            } else if (link.startsWith('?')) {
                              const params = new URLSearchParams(link);
                              const newParams: Record<string, string> = {};
                              params.forEach((value, key) => { newParams[key] = value; });
                              setSearchParams(newParams);
                            } else {
                              window.location.href = link;
                            }
                          }}>
                             <div className="z-10 text-white pointer-events-none">
                               <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner1TitleHtml }} />
                               {settings.promoBanner1SubtitleHtml && <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner1SubtitleHtml }} />}
                               <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg">{settings.promoBanner1ButtonText}</button>
                             </div>
                          </div>
                        )}
                        {settings.promoBanner2TitleHtml && (
                          <div className="rounded-3xl overflow-hidden relative h-[200px] md:h-[250px] flex items-center px-6 md:px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner2ColorStart}, ${settings.promoBanner2ColorEnd})` }} onClick={() => {
                            const link = settings.promoBanner2Link || '?category=Canecas';
                            if (link.startsWith('#')) {
                              const id = link.substring(1);
                              const el = document.getElementById(id);
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            } else if (link.startsWith('?')) {
                              const params = new URLSearchParams(link);
                              const newParams: Record<string, string> = {};
                              params.forEach((value, key) => { newParams[key] = value; });
                              setSearchParams(newParams);
                            } else {
                              window.location.href = link;
                            }
                          }}>
                             <div className="z-10 text-white pointer-events-none">
                               <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner2TitleHtml }} />
                               {settings.promoBanner2SubtitleHtml && <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner2SubtitleHtml }} />}
                               <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg">{settings.promoBanner2ButtonText}</button>
                             </div>
                          </div>
                        )}
                     </div>
                  </section>
                )}

                {/* Category Sections */}
                <div className="space-y-16 max-w-[1400px] mx-auto">
                  <section id="category-all">
                    <h2 className="text-[#111827] text-3xl font-bold text-center mb-10">Todos os Produtos</h2>
                    <ProductCarousel products={products} onAddToCart={openProduct} />
                  </section>

                  {categories.map(category => {
                    const categoryProducts = getProductsByCategory(category);
                    if (categoryProducts.length === 0) return null;
                    return (
                      <section key={category} id={`category-${category}`}>
                        <h2 className="text-[#111827] text-3xl font-bold text-center mb-10">{category}</h2>
                        <ProductCarousel products={categoryProducts} onAddToCart={openProduct} />
                      </section>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-12 md:py-16" style={{ backgroundColor: settings.footerBgColor || '#111827', color: settings.footerTextColor || '#9ca3af' }}>
        <div className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            {settings.footerLogoUrl ? (
              <img src={convertGoogleDriveUrl(settings.footerLogoUrl)} alt={settings.storeName || 'Logo'} className="h-12 w-auto mb-4 object-contain" referrerPolicy="no-referrer" />
            ) : settings.logoUrl ? (
              <img src={convertGoogleDriveUrl(settings.logoUrl)} alt={settings.storeName || 'Logo'} className="h-12 w-auto mb-4 object-contain brightness-0 invert" referrerPolicy="no-referrer" />
            ) : (
              <h2 className="text-2xl font-bold mb-4 tracking-tight" style={{ color: settings.footerHeadingColor || '#ffffff' }}>{settings.storeName || 'Nossa Loja'}</h2>
            )}
            <p className="text-sm leading-relaxed mb-6" style={{ color: settings.footerTextColor || '#9ca3af' }}>
              {settings.footerDescription || 'Especializados em produtos criativos e personalizados. Transforme suas ideias em presentes inesquecíveis.'}
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:opacity-75 transition-opacity" style={{ color: settings.footerTextColor || '#9ca3af' }}><Star size={20} /></a>
              <a href="#" className="hover:opacity-75 transition-opacity" style={{ color: settings.footerTextColor || '#9ca3af' }}><Heart size={20} /></a>
            </div>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 uppercase text-sm tracking-wider" style={{ color: settings.footerHeadingColor || '#ffffff' }}>Navegação</h3>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:opacity-75 transition-opacity">Página Inicial</button></li>
              <li><button onClick={() => setSearchParams({ category: 'all' })} className="hover:opacity-75 transition-opacity">Todos os Produtos</button></li>
              <li><button onClick={() => setIsCartOpen(true)} className="hover:opacity-75 transition-opacity">Meu Carrinho</button></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 uppercase text-sm tracking-wider" style={{ color: settings.footerHeadingColor || '#ffffff' }}>Atendimento</h3>
            <ul className="space-y-3 text-sm">
              {settings.whatsappNumber && (
                <li>
                  <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:opacity-75 transition-opacity">
                    <MessageCircle size={16} /> WhatsApp
                  </a>
                </li>
              )}
              {settings.adminEmail && (
                <li>
                  <a href={`mailto:${settings.adminEmail}`} className="flex items-center gap-2 hover:opacity-75 transition-opacity">
                    <Mail size={16} /> E-mail
                  </a>
                </li>
              )}
              <li>
                <span className="flex items-center gap-2">
                  <Clock size={16} /> Seg - Sáb, 9h às 18h
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 uppercase text-sm tracking-wider" style={{ color: settings.footerHeadingColor || '#ffffff' }}>Pagamento Seguro</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {settings.paymentMethods?.pix && <div className="bg-black/20 p-2 rounded" title="PIX"><CreditCard size={20} /></div>}
              {settings.paymentMethods?.credit && <div className="bg-black/20 p-2 rounded" title="Cartão de Crédito"><CreditCard size={20} /></div>}
              {settings.paymentMethods?.boleto && <div className="bg-black/20 p-2 rounded" title="Boleto"><FileText size={20} /></div>}
            </div>
            <p className="text-xs opacity-75">
              Ambiente 100% seguro. Seus dados são criptografados e protegidos.
            </p>
          </div>
        </div>
        
        <div className="max-w-[1400px] mx-auto px-4 mt-12 pt-8 border-t border-black/20 text-sm flex flex-col md:flex-row justify-between items-center gap-4 opacity-75">
          <p>© {new Date().getFullYear()} {settings.storeName || 'Nossa Loja'}. Todos os direitos reservados.</p>
          <p>
            Desenvolvido por {settings.storeName || 'Nossa Loja'}
          </p>
        </div>
      </footer>
    </div>
  );
}
