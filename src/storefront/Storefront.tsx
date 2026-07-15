import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, MessageCircle, CreditCard, Truck, ShieldCheck, User, Star, Heart, Gift, X, Plus, Minus } from 'lucide-react';
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

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'checkout' | 'custom'>(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    if (view === 'custom' || view === 'personalizado' || view === 'personalizados') {
      return 'custom';
    }
    return 'home';
  });

  useEffect(() => {
    if (viewParam === 'custom' || viewParam === 'personalizado' || viewParam === 'personalizados') {
      if (currentView !== 'custom') {
        setCurrentView('custom');
      }
    } else if (!viewParam && currentView === 'custom') {
      setCurrentView('home');
    }
  }, [viewParam, currentView]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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

  const addToCart = (product: any, selectedColor?: string, customData?: { text?: string, music?: string, image?: string }, initialQuantity: number = 1) => {
    // Generate unique ID based on customization to separate items
    const customHash = customData ? btoa(JSON.stringify(customData)).slice(0, 10) : 'default';
    const cartItemId = `${product.id}-${selectedColor || 'default'}-${customHash}`;
    
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
    const { collection, addDoc, doc, writeBatch, increment, serverTimestamp } = await import('firebase/firestore');

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
      const discount = data.couponDiscount || 0;
      const subAfterCoupon = Math.max(0, subtotal - discount);
      const pixDiscount = data.paymentMethod === 'pix' ? subAfterCoupon * 0.10 : 0;
      const finalTotal = subAfterCoupon - pixDiscount + data.shippingCost;

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
        paymentMethod: data.paymentMethod || '',
        shippingCost: Number(data.shippingCost) || 0,
        couponDiscount: Number(data.couponDiscount) || 0,
      };

      if (data.gender) cleanShippingInfo.gender = data.gender;
      if (data.birthDate) cleanShippingInfo.birthDate = data.birthDate;
      if (data.landline) cleanShippingInfo.landline = data.landline;
      if (data.coupon) cleanShippingInfo.coupon = data.coupon;

      // Create order in Firestore
      const orderData = {
        customer: data.name,
        email: data.email,
        phone: data.phone,
        total: finalTotal,
        status: 'Pendente',
        date: serverTimestamp(),
        items: cleanItems,
        shippingInfo: cleanShippingInfo
      };

      const { withTimeout } = await import('../lib/firestoreUtils');
      let orderId = "";
      try {
        const docRef = await withTimeout(addDoc(collection(db, 'orders'), orderData));
        orderId = docRef.id;
      } catch (dbError) {
        console.warn("Could not save order to db, proceeding with WhatsApp only:", dbError);
      }
      const url = generateWhatsAppLink(updatedCart, data, settings.whatsappNumber, orderId);
      window.open(url, '_blank');
      setCart([]);
      setCurrentView('home');
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
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setSearchParams({});
    setCurrentView('home');
    setSelectedProduct(null);
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
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-md" />
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-gray-800 line-clamp-2">{item.name}</h4>
                        {item.selectedColor && <p className="text-xs text-gray-500 mt-1">Cor: {item.selectedColor}</p>}
                        {item.customText && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">Texto: "{item.customText}"</p>}
                        {item.customMusic && <p className="text-xs text-blue-500 mt-1 line-clamp-1 truncate hover:underline"><a href={item.customMusic} target="_blank" rel="noreferrer">Música (Link)</a></p>}
                        {item.customImage && (
                          <div className="mt-2 flex items-center gap-2 border border-gray-100 p-1 rounded-md w-fit bg-gray-50">
                             <img src={item.customImage} alt="Custom upload" className="w-8 h-8 object-cover rounded shadow-sm" />
                             <span className="text-[10px] text-gray-500 font-bold uppercase pr-2">Foto enviada</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                           <span className="font-bold text-[#783884]">{formatPrice(item.price)}</span>
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
                      {categories.map(cat => (
                        <button key={cat} onClick={() => { setSearchParams({ category: cat }); setIsMobileMenuOpen(false); }} className="text-left font-medium text-gray-600">{cat}</button>
                      ))}
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
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: settings.headerColor, color: settings.headerTextColor || '#ffffff' }}>
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
            <div className="flex-shrink-0 cursor-pointer" onClick={goHome}>
              {logoUrl ? (
                <img src={logoUrl || undefined} alt="Logo" className="h-10 sm:h-12 md:h-16 w-auto object-contain" />
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
            <div className="flex-1 max-w-2xl relative hidden md:block">
              <input 
                type="text" 
                placeholder="Digite o que você procura"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-gray-900 rounded-full py-3 px-6 pr-12 focus:outline-none"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
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
          <div style={{ backgroundColor: settings.navBarColor && settings.navBarColor !== 'transparent' ? settings.navBarColor : 'transparent' }}>
            <div className="max-w-[1400px] mx-auto px-4">
              <nav className="flex items-center justify-start md:justify-center gap-6 py-4 overflow-x-auto whitespace-nowrap hide-scrollbar text-sm font-bold px-2 md:px-0">
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
                {categories.map(category => (
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

      <main className="pb-20 min-h-[calc(100vh-140px)]">
        {currentView === 'custom' ? (
          <CustomProductPage onBack={goHome} onAddToCart={addToCart} />
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
        ) : currentView === 'product' && selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            onBack={goHome} 
            onAddToCart={addToCart} 
          />
        ) : (
          <div className="max-w-[1400px] mx-auto px-4 pt-6 md:pt-8">
            {categoryParam ? (
              // Category View (Dedicated Page)
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 font-medium">
                  <button onClick={goHome} className="hover:text-gray-800 hover:underline cursor-pointer transition-all">Início</button>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-400">
                    {categoryParam === 'all' ? 'Todos os Produtos' : categoryParam}
                  </span>
                </div>

                {/* Header Title */}
                <div className="border-b border-gray-100 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight" style={{ color: settings.headerColor || '#783884' }}>
                      {categoryParam === 'all' ? 'Todos os Produtos' : categoryParam}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                      {(() => {
                        const count = products.filter(p => !p.hidden && (categoryParam === 'all' || (p.category || 'Outros') === categoryParam)).length;
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
                    const matchesCategory = categoryParam === 'all' || (p.category || 'Outros') === categoryParam;
                    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
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
                    <section className="w-full bg-[#f9e5e6] overflow-hidden relative rounded-2xl mb-12" style={{ height: '400px' }}>
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
                           <div className="absolute inset-0 bg-white/40" />
                           <div className={`relative z-10 flex flex-col ${
                            currentBanner?.textAlign === 'left' ? 'text-left items-start' : 
                            currentBanner?.textAlign === 'right' ? 'text-right items-end' : 
                            'text-center items-center'
                           }`}>
                              <div dangerouslySetInnerHTML={{ __html: currentBanner?.titleHtml || '' }} className={`font-bold mb-4 ${currentBanner?.titleSize || 'text-5xl'} ${currentBanner?.titleFont || 'font-sans'}`} style={{ color: currentBanner?.titleColor || settings.topBarColor }} />
                              <p className={`font-medium max-w-lg ${currentBanner?.description ? 'mb-2' : 'mb-6'} ${currentBanner?.subtitleSameSize ? (currentBanner?.titleSize || 'text-5xl') : (currentBanner?.subtitleSize || 'text-xl')} ${currentBanner?.subtitleFont || 'font-sans'}`} style={{ color: currentBanner?.subtitleColor || '#592c60' }}>{currentBanner?.subtitle}</p>
                               {currentBanner?.description && (
                                 <p className={`font-medium max-w-lg mb-6 ${currentBanner?.descriptionSize || 'text-xl'} ${currentBanner?.descriptionFont || 'font-sans'}`} style={{ color: currentBanner?.descriptionColor || '#592c60' }}>{currentBanner?.description}</p>
                               )}
                              
                              {currentBanner?.buttonLink ? (
                                <a 
                                  href={currentBanner.buttonLink}
                                  onClick={(e) => {
                                    if (currentBanner.buttonLink?.startsWith('#')) {
                                      e.preventDefault();
                                      const id = currentBanner.buttonLink.substring(1);
                                      const el = document.getElementById(id);
                                      if (el) {
                                        el.scrollIntoView({ behavior: 'smooth' });
                                      }
                                    }
                                  }}
                                  className="text-white px-8 py-3 rounded-md font-bold text-lg hover:brightness-90 transition-colors shadow-lg inline-block text-center cursor-pointer"
                                  style={{ backgroundColor: currentBanner?.buttonColor }}
                                >
                                  {currentBanner?.buttonText}
                                </a>
                              ) : (
                                <button className="text-white px-8 py-3 rounded-md font-bold text-lg hover:brightness-90 transition-colors shadow-lg cursor-pointer" style={{ backgroundColor: currentBanner?.buttonColor }}>
                                  {currentBanner?.buttonText}
                                </button>
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
                            setSearchParams({ category: 'Música' });
                          }}>
                             <div className="z-10 text-white">
                               <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner1TitleHtml }} />
                               {settings.promoBanner1SubtitleHtml && <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner1SubtitleHtml }} />}
                               <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f] cursor-pointer">{settings.promoBanner1ButtonText}</button>
                             </div>
                          </div>
                        )}
                        {settings.promoBanner2TitleHtml && (
                          <div className="rounded-3xl overflow-hidden relative h-[200px] md:h-[250px] flex items-center px-6 md:px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner2ColorStart}, ${settings.promoBanner2ColorEnd})` }} onClick={() => {
                            setSearchParams({ category: 'Canecas' });
                          }}>
                             <div className="z-10 text-white">
                               <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner2TitleHtml }} />
                               {settings.promoBanner2SubtitleHtml && <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner2SubtitleHtml }} />}
                               <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f] cursor-pointer">{settings.promoBanner2ButtonText}</button>
                             </div>
                          </div>
                        )}
                     </div>
                  </section>
                )}

                {/* Category Sections */}
                <div className="space-y-16 max-w-[1400px] mx-auto">
                  <section id="category-all">
                    <h2 className="text-[#783884] text-3xl font-bold text-center mb-10">Todos os Produtos</h2>
                    <ProductCarousel products={products} onAddToCart={openProduct} />
                  </section>

                  {categories.map(category => {
                    const categoryProducts = getProductsByCategory(category);
                    if (categoryProducts.length === 0) return null;
                    return (
                      <section key={category} id={`category-${category}`}>
                        <h2 className="text-[#783884] text-3xl font-bold text-center mb-10">{category}</h2>
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
    </div>
  );
}
