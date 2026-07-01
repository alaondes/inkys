import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../storefront/Storefront';
import { formatPrice } from '../data/products';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  updateQuantity: (id: string, delta: number) => void;
  onCheckout: () => void;
}

export function CartSidebar({ isOpen, onClose, cart, updateQuantity, onCheckout }: CartSidebarProps) {
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          
          {/* Sidebar */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l border-gray-200 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-8 pb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                <span className="w-2 h-8 ink-gradient inline-block rounded-full"></span>
                Seu Pedido
              </h2>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-8 py-2 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                  <ShoppingBag size={48} className="mb-4 opacity-50" />
                  <p className="text-gray-500">Seu carrinho está vazio</p>
                </div>
              ) : (
                cart.map(item => (
                  <motion.div 
                    layout
                    key={item.cartItemId} 
                    className="flex items-center gap-3 glass-panel p-3 rounded-lg border-gray-100 relative"
                  >
                    <div className="w-16 h-16 bg-gray-100 rounded shrink-0 overflow-hidden">
                      <img src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow flex flex-col gap-1">
                      <h4 className="text-sm font-medium leading-tight text-gray-900">{item.name}</h4>
                      {item.selectedColor && (
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{item.selectedColor}</span>
                      )}
                      <p className="text-cyan-600 text-xs font-bold">{formatPrice(item.price)}</p>
                      
                      <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, -1)}
                            className="text-gray-400 hover:text-gray-900 disabled:opacity-50"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="text-xs font-medium text-gray-900">{item.quantity}x</span>
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, 1)}
                            className="text-gray-400 hover:text-gray-900"
                          >
                            <Plus size={12} />
                          </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, -item.quantity)}
                      className="absolute top-3 right-3 text-red-500 text-[10px] uppercase font-bold hover:text-red-400"
                    >
                      Remover
                    </button>
                  </motion.div>
                ))
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="p-8 pt-4 border-t border-gray-100 bg-white">
                <div className="flex justify-between items-end mb-6 font-bold">
                  <span className="text-gray-500">Total</span>
                  <span className="text-2xl text-pink-600">{formatPrice(total)}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-4 rounded-xl ink-gradient text-white font-[800] uppercase tracking-tighter text-lg hover:scale-[1.02] transition-transform block text-center"
                >
                  Continuar para Pagamento
                </button>
                <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">Inkys © 2026</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
