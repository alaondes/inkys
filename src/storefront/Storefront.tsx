import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, LayoutGrid, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatPrice, Product } from '../data/products';
import { generateWhatsAppLink, CheckoutData } from '../utils/whatsapp';
import { ProductCard } from '../components/ProductCard';
import { CartSidebar } from '../components/CartSidebar';
import { CheckoutModal } from '../components/CheckoutModal';
import { useProducts } from '../context/ProductContext';

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  cartItemId: string;
}

export function Storefront() {
  const { products } = useProducts();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [maxPrice, setMaxPrice] = useState<number>(100);
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('inkys-logo-url');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
      const matchPrice = p.price <= maxPrice;
      return matchCategory && matchPrice;
    });
  }, [selectedCategory, maxPrice, products]);

  const addToCart = (product: Product, selectedColor?: string) => {
    setCart(prev => {
      const cartItemId = `${product.id}-${selectedColor || 'default'}`;
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item => 
          item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedColor, cartItemId }];
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

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleWhatsAppRedirect = (data: CheckoutData) => {
    if (cart.length === 0) return;
    const url = generateWhatsAppLink(cart, data);
    window.open(url, '_blank');
    setIsCheckoutOpen(false);
    setCart([]); // Clear cart after order
  };

  const cartItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt="Inkys Logo" className="h-14 md:h-16 w-auto max-w-[200px] object-contain" />
              ) : (
                <div className="w-10 h-10 ink-gradient rounded-full"></div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link 
                to="/admin"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-all text-xs font-bold uppercase tracking-wider"
              >
                Admin
              </Link>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:border-fuchsia-500 transition-all">
                  <ShoppingCart size={20} />
                </div>
                <AnimatePresence>
                  {cartItemsCount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-0 right-0 w-5 h-5 bg-pink-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white shadow-[0_0_10px_rgba(219,39,119,0.6)]"
                    >
                      {cartItemsCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500 opacity-5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-500 opacity-5 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-display font-[800] mb-6 tracking-tighter uppercase text-gray-900"
          >
            Seu estilo, em cada detalhe.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 max-w-2xl mx-auto text-lg"
          >
            Encontre canecas e produtos exclusivos com designs incríveis. 
            Escolha, adicione ao carrinho e faça seu pedido via WhatsApp.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Sidebar Filters */}
          <div className="w-full lg:w-64 flex-shrink-0 sticky top-28 glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-2 font-display font-semibold text-lg mb-6 text-gray-900 border-b border-gray-200 pb-4">
              <Filter size={20} className="text-cyan-600" />
              Filtros
            </div>

            <div className="space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Categorias</h3>
                <div className="flex flex-col gap-2">
                  {categories.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`text-left px-4 py-2 rounded-lg text-sm transition-all ${
                        selectedCategory === category 
                          ? 'bg-gray-100 text-cyan-600 font-bold border border-gray-200' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <div className="flex items-center justify-between mb-3 text-sm">
                  <h3 className="font-bold text-gray-500 uppercase tracking-wider">Preço Máximo</h3>
                  <span className="text-cyan-600 font-bold">{formatPrice(maxPrice)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="150" 
                  step="5"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 w-full">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 glass-panel rounded-2xl">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-display font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500">Tente ajustar seus filtros para ver mais resultados.</p>
                <button 
                  onClick={() => { setSelectedCategory('Todos'); setMaxPrice(150); }}
                  className="mt-6 px-6 py-2 rounded-full border border-pink-600 text-pink-600 hover:bg-pink-50 transition-colors uppercase tracking-widest text-xs font-bold"
                >
                  Limpar filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={addToCart} 
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Modals */}
      <CartSidebar 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        updateQuantity={updateQuantity}
        onCheckout={handleCheckout}
      />

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmit={handleWhatsAppRedirect}
      />
    </div>
  );
}
