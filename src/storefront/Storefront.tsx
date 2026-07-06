import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Menu, MessageCircle, CreditCard, Truck, ShieldCheck, User, Star, Heart, Gift } from 'lucide-react';
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
import { Link } from 'react-router-dom';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  cartItemId: string;
  file?: File;
  fileUrl?: string;
}

export function Storefront() {
  const { products } = useProducts();
  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

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

  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'checkout' | 'custom'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  
  useEffect(() => {
    const banners = settings.heroBanners || [];
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIdx((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [settings.heroBanners]);

  const addToCart = (product: any, selectedColor?: string) => {
    const cartItemId = `${product.id}-${selectedColor || 'default'}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedColor, cartItemId }];
    });
    setCurrentView('checkout');
    window.scrollTo(0, 0);
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
    const { collection, addDoc, doc, updateDoc, increment, serverTimestamp } = await import('firebase/firestore');

    try {
      const updatedCart = [...cart];
      // Upload files
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
        if (item.stock !== undefined) {
          try {
            await updateDoc(doc(db, 'products', item.id), {
              stock: increment(-item.quantity)
            });
          } catch(e) {
            console.error('Failed to deduct stock', e);
          }
        }
      }

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

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      const url = generateWhatsAppLink(updatedCart, data, settings.whatsappNumber, docRef.id);
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
      {/* Top Header - Purple */}
      <header style={{ backgroundColor: settings.headerColor, color: settings.headerTextColor || '#ffffff' }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20 md:h-24 gap-3 md:gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={goHome}>
              {logoUrl ? (
                <img src={logoUrl || undefined} alt="Logo" className="h-10 sm:h-12 md:h-16 w-auto object-contain" />
              ) : (
                <div className="text-xl sm:text-2xl md:text-3xl font-extrabold italic tracking-tighter" style={{ color: settings.topBarColor || '#f9a8d4' }}>
                  Amo<span style={{ color: settings.headerTextColor || '#ffffff' }}>Canecas</span><span className="text-sm font-normal">.com</span>
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
              <div className="hidden lg:flex items-center gap-2 cursor-pointer hover:text-pink-200 transition-colors">
                <MessageCircle size={28} />
                <div className="flex flex-col text-sm">
                  <span className="font-bold">Central de</span>
                  <span>Atendimento</span>
                </div>
              </div>
              
              <div className="hidden lg:flex items-center gap-2 cursor-pointer hover:text-pink-200 transition-colors">
                <User size={28} />
                <div className="flex flex-col text-sm">
                  <span className="font-bold">Bem-vindo(a)</span>
                  <span>Entrar ou Cadastrar</span>
                </div>
              </div>

              <button 
                onClick={() => setCurrentView('checkout')}
                className="flex items-center gap-2 relative hover:text-pink-200 transition-colors"
              >
                <ShoppingCart size={28} />
                <span className="text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-2" style={{ backgroundColor: settings.topBarColor }}>
                  {cartItemsCount}
                </span>
              </button>
              
              <Link 
                to="/admin" 
                className="text-xs bg-white/15 hover:bg-white/25 font-bold px-3 py-1.5 rounded-full border border-white/10 transition-all flex items-center gap-1 shrink-0"
                style={{ color: settings.headerTextColor || '#ffffff' }}
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
                  onClick={() => setCurrentView('custom')}
                  className="px-3 py-1 rounded-full hover:brightness-110 transition-colors uppercase flex items-center gap-1 shadow-sm"
                  style={{ backgroundColor: settings.customButtonBgColor || '#facc15', color: settings.customButtonTextColor || '#713f12' }}
                >
                  Personalizados ✨
                </button>
                <button 
                  onClick={() => {
                    const el = document.getElementById('category-all');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hover:opacity-80 transition-opacity uppercase"
                  style={{ color: settings.navBarTextColor || 'inherit' }}
                >
                  Todos os Produtos
                </button>
                {categories.map(category => (
                  <button 
                    key={category}
                    onClick={() => {
                      const el = document.getElementById(`category-${category}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:opacity-80 transition-opacity uppercase"
                    style={{ color: settings.navBarTextColor || 'inherit' }}
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
          <CustomProductPage onBack={goHome} />
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
          <>
            {/* Hero Banner Carousel */}
            <section className="w-full bg-[#f9e5e6] overflow-hidden relative" style={{ height: '400px' }}>
              <AnimatePresence mode="wait">
                {(() => {
                  const banners = settings.heroBanners && settings.heroBanners.length > 0 
                    ? settings.heroBanners 
                    : [{
                        id: 'legacy',
                        image: settings.heroBannerImage,
                        titleHtml: settings.heroBannerTitleHtml,
                        subtitle: settings.heroBannerSubtitle,
                        buttonText: settings.heroBannerButtonText,
                        buttonColor: settings.heroBannerButtonColor
                      }];
                  const currentBanner = banners[currentBannerIdx % banners.length];
                  
                  return (
                    <motion.div
                      key={currentBannerIdx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 w-full h-full bg-cover bg-center flex items-center justify-center"
                      style={{ backgroundImage: `url(${currentBanner?.image})` }}
                    >
                       <div className="absolute inset-0 bg-white/40" />
                       <div className="relative z-10 text-center flex flex-col items-center">
                          <div dangerouslySetInnerHTML={{ __html: currentBanner?.titleHtml || '' }} className={`font-bold mb-4 ${currentBanner?.titleSize || 'text-5xl'} ${currentBanner?.titleFont || 'font-sans'}`} style={{ color: currentBanner?.titleColor || settings.topBarColor }} />
                          <p className={`font-medium max-w-lg mb-6 ${currentBanner?.subtitleSameSize ? (currentBanner?.titleSize || 'text-5xl') : (currentBanner?.subtitleSize || 'text-xl')} ${currentBanner?.subtitleFont || 'font-sans'}`} style={{ color: currentBanner?.subtitleColor || '#592c60' }}>{currentBanner?.subtitle}</p>
                          
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
                  );
                })()}
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
            
            {/* Features Row */}
            {settings.storeFeatures && settings.storeFeatures.length > 0 && (
              <section className="border-b border-gray-200 bg-white">
                <div className="max-w-[1400px] mx-auto px-4 py-8">
                  <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(settings.storeFeatures.filter(f => f.enabled).length, 4)} gap-6 sm:gap-4 lg:divide-x divide-gray-200`}>
                    {settings.storeFeatures.filter(f => f.enabled).map((feature, idx) => {
                      let IconComponent: any = Search;
                      if (feature.icon === 'Truck') IconComponent = Truck;
                      else if (feature.icon === 'CreditCard') IconComponent = CreditCard;
                      else if (feature.icon === 'Zap') IconComponent = ShieldCheck; // We don't have Zap imported, let's use ShieldCheck or something else, or import Zap
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
            <section className="max-w-[1400px] mx-auto px-4 py-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-3xl overflow-hidden relative h-[200px] md:h-[250px] flex items-center px-6 md:px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner1ColorStart}, ${settings.promoBanner1ColorEnd})` }} onClick={() => {
                    const el = document.getElementById('category-Música');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>
                     <div className="z-10 text-white">
                       <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner1TitleHtml || '' }}></h3>
                       <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner1SubtitleHtml || '' }}></p>
                       <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f]">{settings.promoBanner1ButtonText}</button>
                     </div>
                  </div>
                  <div className="rounded-3xl overflow-hidden relative h-[200px] md:h-[250px] flex items-center px-6 md:px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner2ColorStart}, ${settings.promoBanner2ColorEnd})` }} onClick={() => {
                    const el = document.getElementById('category-Canecas com Foto') || document.getElementById('category-Canecas');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>
                     <div className="z-10 text-white">
                       <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner2TitleHtml || '' }}></h3>
                       <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner2SubtitleHtml || '' }}></p>
                       <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f]">{settings.promoBanner2ButtonText}</button>
                     </div>
                  </div>
               </div>
            </section>

            {/* Category Sections */}
            <div className="space-y-16 max-w-[1400px] mx-auto px-4">
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
          </>
        )}
      </main>
    </div>
  );
}
