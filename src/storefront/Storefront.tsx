import React, { useState } from 'react';
import { ShoppingCart, Search, Menu, MessageCircle, CreditCard, Truck, ShieldCheck, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice, Product } from '../data/products';
import { generateWhatsAppLink, CheckoutData } from '../utils/whatsapp';
import { ProductCard } from '../components/ProductCard';
import { ProductCarousel } from '../components/ProductCarousel';
import { CartPage } from '../components/CartPage';
import { CheckoutPage } from '../components/CheckoutPage';
import { ProductDetails } from './ProductDetails';
import { useProducts } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import { Link } from 'react-router-dom';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  cartItemId: string;
}

export function Storefront() {
  const { products } = useProducts();
  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'product' | 'cart' | 'checkout'>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
    setCurrentView('cart');
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

  const handleCheckout = () => {
    setCurrentView('checkout');
    window.scrollTo(0, 0);
  };

  const handleWhatsAppRedirect = (data: CheckoutData) => {
    if (cart.length === 0) return;
    const url = generateWhatsAppLink(cart, data, settings.whatsappNumber);
    window.open(url, '_blank');
    setCart([]);
    setCurrentView('home');
    window.scrollTo(0, 0);
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
  
  const getProductsByCategory = (cat: string) => {
    return products.filter(p => (p.category || 'Outros') === cat);
  };

  const categories = Array.from<string>(new Set(products.map(p => p.category || 'Outros')));

  return (
    <div className="min-h-screen bg-white">
      {/* Top Header - Purple */}
      <header className="text-white" style={{ backgroundColor: settings.headerColor }}>
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-24 gap-8">
            {/* Logo */}
            <div className="flex-shrink-0 cursor-pointer" onClick={goHome}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
              ) : (
                <div className="text-3xl font-extrabold italic tracking-tighter text-pink-300">
                  Amo<span className="text-white">Canecas</span><span className="text-sm font-normal">.com</span>
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
                onClick={() => setCurrentView('cart')}
                className="flex items-center gap-2 relative hover:text-pink-200 transition-colors"
              >
                <ShoppingCart size={28} />
                <span className="text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full absolute -top-1 -right-2" style={{ backgroundColor: settings.topBarColor }}>
                  {cartItemsCount}
                </span>
              </button>
              
              <Link to="/admin" className="text-xs opacity-50 hover:opacity-100 hidden sm:block">Admin</Link>
            </div>
          </div>
        </div>
      </header>

      {/* Nav Menu */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4">
          <ul className="flex items-center justify-center gap-8 text-[15px] text-gray-600 font-medium">
            <li className="flex items-center gap-2 py-4 cursor-pointer font-bold transition-colors" style={{ color: settings.topBarColor }}>
              <Menu size={18} /> Todas as categorias
            </li>
            <li className="py-4 cursor-pointer transition-colors" style={{ color: settings.headerColor }}>Coleção</li>
            <li className="py-4 cursor-pointer transition-colors" style={{ color: settings.headerColor }}>Caneca Mágica</li>
            <li className="py-4 cursor-pointer transition-colors" style={{ color: settings.headerColor }}>Canecas com Foto</li>
            <li className="py-4 cursor-pointer transition-colors" style={{ color: settings.headerColor }}>Presentes</li>
            <li className="py-4 cursor-pointer transition-colors" style={{ color: settings.headerColor }}>Personalize do seu Jeito</li>
            <li className="py-4 px-6 text-white font-bold cursor-pointer transition-colors hover:brightness-110" style={{ backgroundColor: settings.topBarColor }}>
              COPA DO MUNDO
            </li>
          </ul>
        </div>
      </nav>

      <main className="pb-20 bg-[#f9fafb] min-h-[calc(100vh-140px)]">
        {currentView === 'checkout' ? (
          <CheckoutPage 
            cart={cart}
            onComplete={handleWhatsAppRedirect}
          />
        ) : currentView === 'cart' ? (
          <CartPage 
            cart={cart}
            updateQuantity={updateQuantity}
            onCheckout={handleCheckout}
            onContinueShopping={goHome}
          />
        ) : currentView === 'product' && selectedProduct ? (
          <ProductDetails 
            product={selectedProduct} 
            onBack={goHome} 
            onAddToCart={addToCart} 
          />
        ) : (
          <>
            {/* Hero Banner */}
            <section className="w-full bg-[#f9e5e6]">
              <div className="w-full h-[400px] bg-cover bg-center flex items-center justify-center relative" style={{ backgroundImage: `url(${settings.heroBannerImage})`}}>
                 <div className="absolute inset-0 bg-white/40" />
                 <div className="relative z-10 text-center flex flex-col items-center">
                    <div dangerouslySetInnerHTML={{ __html: settings.heroBannerTitleHtml }} className="text-[#e84e70] font-bold mb-4" style={{ color: settings.topBarColor }} />
                    <p className="text-[#592c60] text-xl font-medium max-w-lg mb-6">{settings.heroBannerSubtitle}</p>
                    
                    <div className="flex gap-6 mb-8 text-[#592c60] font-bold text-sm">
                      <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: settings.topBarColor }}><User size={20}/></div> Personalizada com sua foto</div>
                      <div className="flex items-center gap-2"><div className="w-10 h-10 rounded-full text-white flex items-center justify-center" style={{ backgroundColor: settings.topBarColor }}><MessageCircle size={20}/></div> Estampa com sua música</div>
                    </div>
                    
                    <button className="text-white px-8 py-3 rounded-md font-bold text-lg hover:brightness-90 transition-colors shadow-lg" style={{ backgroundColor: settings.heroBannerButtonColor }}>
                      {settings.heroBannerButtonText}
                    </button>
                 </div>
              </div>
            </section>
            
            {/* Features Row */}
            <section className="border-b border-gray-200 bg-white">
              <div className="max-w-[1400px] mx-auto px-4 py-8">
                <div className="grid grid-cols-4 gap-4 divide-x divide-gray-200">
                  <div className="flex items-center justify-center gap-4 px-4">
                    <Truck size={32} className="text-gray-700" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold leading-tight" style={{ color: settings.topBarColor }}>Do Oiapoque ao Chuí</h4>
                      <p className="text-gray-500 text-sm">Entregas em Todo Brasil</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 px-4">
                    <CreditCard size={32} className="text-gray-700" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold leading-tight" style={{ color: settings.topBarColor }}>Parcelamento</h4>
                      <p className="text-gray-500 text-sm">Em até 6x sem juros</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 px-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M2 12l5.25 5 2.625-3 5.25 5 6.875-10"/></svg>
                    <div>
                      <h4 className="font-bold leading-tight" style={{ color: settings.topBarColor }}>Ganhe Desconto</h4>
                      <p className="text-gray-500 text-sm">Pagando com PIX</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-4 px-4">
                    <ShieldCheck size={32} className="text-gray-700" strokeWidth={1.5} />
                    <div>
                      <h4 className="font-bold leading-tight" style={{ color: settings.topBarColor }}>Segurança</h4>
                      <p className="text-gray-500 text-sm">Loja com SSL de proteção</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Promo Banners */}
            <section className="max-w-[1400px] mx-auto px-4 py-12 bg-[#f9fafb]">
               <div className="grid grid-cols-2 gap-6">
                  <div className="rounded-3xl overflow-hidden relative h-[250px] flex items-center px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner1ColorStart}, ${settings.promoBanner1ColorEnd})` }} onClick={() => {
                    const el = document.getElementById('category-Música');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>
                     <div className="z-10 text-white">
                       <h3 className="text-3xl font-bold text-yellow-300 mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner1TitleHtml }}></h3>
                       <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner1SubtitleHtml }}></p>
                       <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f]">{settings.promoBanner1ButtonText}</button>
                     </div>
                  </div>
                  <div className="rounded-3xl overflow-hidden relative h-[250px] flex items-center px-10 cursor-pointer group" style={{ background: `linear-gradient(to right, ${settings.promoBanner2ColorStart}, ${settings.promoBanner2ColorEnd})` }} onClick={() => {
                    const el = document.getElementById('category-Canecas com Foto') || document.getElementById('category-Canecas');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}>
                     <div className="z-10 text-white">
                       <h3 className="text-3xl font-bold text-white mb-2 drop-shadow-md" dangerouslySetInnerHTML={{ __html: settings.promoBanner2TitleHtml }}></h3>
                       <p className="mb-4 font-medium drop-shadow-sm" dangerouslySetInnerHTML={{ __html: settings.promoBanner2SubtitleHtml }}></p>
                       <button className="bg-[#5ba324] text-white px-8 py-2 font-bold rounded shadow-lg group-hover:bg-[#4d8b1f]">{settings.promoBanner2ButtonText}</button>
                     </div>
                  </div>
               </div>
            </section>

            {/* Category Sections */}
            <div className="space-y-16 max-w-[1400px] mx-auto px-4 bg-[#f9fafb]">
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
