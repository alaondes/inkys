import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, User, CreditCard, Send } from 'lucide-react';
import { CheckoutData } from '../utils/whatsapp';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CheckoutData) => void;
}

export function CheckoutModal({ isOpen, onClose, onSubmit }: CheckoutModalProps) {
  const [formData, setFormData] = useState<CheckoutData>({
    name: '',
    address: '',
    paymentMethod: 'Pix'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className="bg-white border border-gray-200 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl relative z-50 p-8"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
                  <span className="w-2 h-8 ink-gradient inline-block rounded-full"></span>
                  Finalizar Pedido
                </h2>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-900 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Nome Completo</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Como deseja ser chamado?"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Endereço de Entrega</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Rua, Número, Bairro"
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-cyan-500 outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Forma de Pagamento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Pix', 'Crédito', 'Débito'].map((method) => (
                      <label key={method} className="cursor-pointer">
                        <input 
                          type="radio" 
                          name="pay" 
                          className="hidden peer"
                          checked={formData.paymentMethod === method}
                          onChange={() => setFormData({...formData, paymentMethod: method})}
                        />
                        <div className={`text-center py-3 rounded-lg border text-[10px] font-bold uppercase transition-all ${
                          formData.paymentMethod === method
                            ? method === 'Pix' ? 'bg-pink-50 border-pink-500 text-pink-600' 
                            : method === 'Crédito' ? 'bg-cyan-50 border-cyan-500 text-cyan-600'
                            : 'bg-yellow-50 border-yellow-500 text-yellow-600'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                          {method}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full py-4 rounded-xl ink-gradient text-white font-[800] uppercase tracking-tighter text-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                  >
                    <Send size={20} />
                    Enviar Pedido
                  </button>
                  <p className="text-center text-[10px] text-gray-400 mt-4 uppercase tracking-widest">
                    Você será redirecionado para o WhatsApp com o resumo do pedido.
                  </p>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
