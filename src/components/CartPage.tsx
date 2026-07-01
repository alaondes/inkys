import React from 'react';
import { formatPrice } from '../data/products';
import { Trash2, ShieldCheck } from 'lucide-react';
import { CartItem } from '../storefront/Storefront';
import { useSettings } from '../context/SettingsContext';

interface CartPageProps {
  cart: CartItem[];
  updateQuantity: (cartItemId: string, delta: number) => void;
  onCheckout: () => void;
  onContinueShopping: () => void;
}

export function CartPage({ cart, updateQuantity, onCheckout, onContinueShopping }: CartPageProps) {
  const { settings } = useSettings();
  
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const pixDiscount = 0.10;
  const pixTotal = subtotal * (1 - pixDiscount);
  const installments = 2;
  const installmentTotal = subtotal / installments;

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="flex items-end gap-2 mb-8">
        <h1 className="text-[#783884] text-3xl font-bold">Carrinho</h1>
        <p className="text-gray-500 mb-1">Clique em finalizar compra para efetuar o seu pedido.</p>
      </div>

      <div className="bg-[#f9f9f9] border border-gray-100 rounded-sm p-6 mb-8 text-center flex flex-col items-center">
        <h3 className="font-bold text-gray-800 text-lg mb-2">Ganhe 10% de desconto!</h3>
        <div className="flex items-center gap-2 mb-2 w-full max-w-md justify-center">
          <div className="h-1 bg-green-500 w-1/4 rounded-full"></div>
          <div className="w-8 h-8 rounded-full border-2 border-green-500 flex items-center justify-center text-green-500 font-bold text-xs">10%</div>
          <div className="h-1 bg-gray-200 w-1/4 rounded-full"></div>
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs">15%</div>
          <div className="h-1 bg-gray-200 w-1/4 rounded-full"></div>
          <div className="w-8 h-8 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 font-bold text-xs">20%</div>
        </div>
        <p className="text-sm text-gray-600">Adicione <strong className="font-bold">mais produtos</strong> para ganhar 10% de desconto.</p>
      </div>

      <div className="border border-gray-200 rounded-sm bg-white overflow-hidden mb-6">
        {cart.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Seu carrinho está vazio.</div>
        ) : (
          <>
            <div className="grid grid-cols-12 bg-[#fdfdfd] border-b border-gray-200 p-4 text-sm font-medium text-gray-600">
              <div className="col-span-6">Produto</div>
              <div className="col-span-2 text-center">Quantidade</div>
              <div className="col-span-2 text-center">Preço</div>
              <div className="col-span-2 text-center">Excluir</div>
            </div>

            {cart.map((item) => (
              <div key={item.cartItemId} className="grid grid-cols-12 items-center p-4 border-b border-gray-200 bg-white">
                <div className="col-span-6 flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 flex-shrink-0 flex items-center justify-center border border-gray-100 overflow-hidden">
                    <img src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} alt={item.name} className="w-16 h-16 object-contain mix-blend-multiply" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="text-gray-800 text-[15px] mb-1">{item.name}</h4>
                    {item.selectedColor && (
                      <p className="text-sm text-gray-500 mb-1">Cor: {item.selectedColor}</p>
                    )}
                    <p className="text-xs text-gray-500 mb-1">Cód: <span className="font-bold">{(item.id || '').substring(0,4).toUpperCase()}</span></p>
                    <p className="text-xs text-gray-500">Estoque: <span className="font-bold text-gray-800">Disponível</span></p>
                  </div>
                </div>
                
                <div className="col-span-2 flex justify-center">
                  <div className="flex items-center border border-gray-300 rounded-sm">
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, -1)}
                      className="px-3 py-1.5 text-gray-500 hover:bg-gray-50"
                    >-</button>
                    <span className="px-3 py-1.5 text-gray-800 font-medium border-x border-gray-300 min-w-[40px] text-center">
                      {item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.cartItemId, 1)}
                      className="px-3 py-1.5 text-gray-500 hover:bg-gray-50"
                    >+</button>
                  </div>
                </div>
                
                <div className="col-span-2 text-center">
                  <span className="font-bold text-[#5ba324]">{formatPrice(item.price)}</span>
                </div>
                
                <div className="col-span-2 text-center">
                  <button 
                    onClick={() => updateQuantity(item.cartItemId, -item.quantity)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            <div className="p-4 bg-gray-50 flex justify-end text-sm font-medium text-gray-800">
              Subtotal: <span className="font-bold ml-2">{formatPrice(subtotal)}</span>
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 border border-gray-200 p-6 bg-[#fdfdfd] mb-6">
          <div className="flex flex-col gap-6 w-full md:w-1/2">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2">Calcule o frete:</label>
              <div className="flex items-center gap-4">
                <div className="flex border border-gray-300 rounded-sm overflow-hidden h-10 w-48">
                  <input type="text" className="w-full px-3 outline-none" />
                </div>
                <button className="bg-gray-200 text-gray-700 px-4 h-10 rounded-sm text-sm hover:bg-gray-300">Calcular</button>
                <a href="#" className="text-xs text-gray-500 flex items-center gap-1 hover:underline">
                  <div className="w-3.5 h-3.5 rounded-full bg-gray-400 text-white flex items-center justify-center text-[9px] font-bold">?</div>
                  Não sei meu CEP
                </a>
              </div>
            </div>
            
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2">Cupom de desconto:</label>
              <div className="flex items-center gap-4">
                <div className="flex border border-gray-300 rounded-sm overflow-hidden h-10 w-48">
                  <input type="text" className="w-full px-3 outline-none" />
                </div>
                <button className="bg-gray-200 text-gray-700 px-4 h-10 rounded-sm text-sm hover:bg-gray-300">Usar cupom</button>
              </div>
            </div>
          </div>
          
          <div className="w-full md:w-1/2 text-right">
            <div className="text-gray-700 text-sm mb-1">
              Total: <span className="text-xl font-bold text-gray-900 ml-1">{formatPrice(subtotal)}</span>
            </div>
            <div className="text-[13px] text-gray-600 mb-1">
              via Pix por <span className="font-bold">{formatPrice(pixTotal)}</span> com <strong className="font-bold">10% de desconto</strong>
            </div>
            <div className="text-[13px] text-gray-600">
              ou em até <span className="font-bold">{installments}x</span> de <span className="font-bold">{formatPrice(installmentTotal)}</span> sem juros
            </div>
          </div>
        </div>
      )}

      {cart.length > 0 && (
        <div className="flex justify-between items-center border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2">
            <ShieldCheck size={32} className="text-[#5ba324]" strokeWidth={1.5} />
            <div className="leading-tight">
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Compra segura</div>
              <div className="text-[14px] font-bold text-gray-800 uppercase tracking-tighter">Site protegido</div>
              <div className="text-[9px] text-gray-400 uppercase tracking-wider">Certificado SSL</div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={onContinueShopping}
              className="bg-gray-100 text-gray-600 font-bold px-6 py-3 rounded-sm hover:bg-gray-200 transition-colors text-[15px]"
            >
              Continuar comprando
            </button>
            <button 
              onClick={onCheckout}
              className="bg-[#5ba324] text-white font-bold px-6 py-3 rounded-sm hover:bg-[#4d8b1f] transition-colors flex items-center gap-2 text-[15px]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              Finalizar compra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
