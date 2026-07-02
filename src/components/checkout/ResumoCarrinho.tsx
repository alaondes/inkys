import React, { MutableRefObject } from 'react';
import { formatPrice } from '../../data/products';
import { CartItem } from '../../storefront/Storefront';
import { Paperclip, FileText, RefreshCw } from 'lucide-react';

interface ResumoCarrinhoProps {
  cart: CartItem[];
  fileInputRefs: MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
  updateItemFile: (cartItemId: string, file: File | undefined) => void;
}

export function ResumoCarrinho({ cart, fileInputRefs, updateItemFile }: ResumoCarrinhoProps) {
  return (
    <div className="bg-white border border-gray-200 rounded shadow-sm mb-6">
      <div className="hidden md:grid grid-cols-12 border-b border-gray-100 p-4 text-sm font-bold text-gray-700 bg-gray-50">
        <div className="col-span-8">Produtos</div>
        <div className="col-span-2 text-center">Qtd.</div>
        <div className="col-span-2 text-right">Preço</div>
      </div>
      
      {cart.map((item) => (
        <div key={item.cartItemId} className="flex flex-col md:grid md:grid-cols-12 p-4 border-b border-gray-100 text-sm md:items-center gap-4">
          <div className="md:col-span-8 flex items-start gap-4">
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-20 h-20 object-cover rounded-md border border-gray-200 flex-shrink-0"
            />
            <div className="flex flex-col flex-1">
              <span className="text-gray-700 font-bold md:font-normal">{item.name} {item.selectedColor ? `- ${item.selectedColor}` : ''}</span>
              <span className="text-xs text-gray-500 mt-0.5">Cód: {(item.id || '').substring(0, 4).toUpperCase()}</span>
              
              <div className="mt-2">
                {item.file ? (
                  <div className="flex flex-wrap items-center gap-2 bg-gray-50 p-2 rounded w-fit border border-gray-100">
                    {item.file.type?.startsWith('image/') && (
                      <img 
                        src={URL.createObjectURL(item.file)} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded border border-gray-200" 
                      />
                    )}
                    <span className="text-xs text-[#3b9370] font-bold flex items-center gap-1 max-w-[150px] sm:max-w-[200px] truncate" title={item.file.name}>
                      <FileText size={12} className="flex-shrink-0" /> <span className="truncate">{item.file.name}</span>
                    </span>
                    <button type="button" onClick={() => fileInputRefs.current[item.cartItemId]?.click()} className="text-[11px] text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors ml-1">
                      <RefreshCw size={10} /> Alterar
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileInputRefs.current[item.cartItemId]?.click()} className="text-xs text-gray-500 hover:text-[#3b9370] flex items-center gap-1 transition-colors font-medium">
                    <Paperclip size={12} /> Anexar arquivo da arte
                  </button>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={el => fileInputRefs.current[item.cartItemId] = el}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      updateItemFile(item.cartItemId, e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
          </div>
          <div className="md:col-span-2 flex items-center justify-between md:justify-center text-gray-700 bg-gray-50 md:bg-transparent p-2 md:p-0 rounded">
            <span className="md:hidden text-xs text-gray-500 uppercase font-bold">Quantidade:</span>
            <span className="font-medium">{item.quantity}</span>
          </div>
          <div className="md:col-span-2 flex items-center justify-between md:justify-end font-bold text-[#5ba324] bg-green-50 md:bg-transparent p-2 md:p-0 rounded">
            <span className="md:hidden text-xs text-gray-500 uppercase font-bold text-gray-700">Total item:</span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </div>
        </div>
      ))}

      <div className="p-4 bg-gray-50 rounded-b flex flex-col items-end justify-center">
        <div className="flex justify-between w-full md:w-64 mb-1">
          <span className="text-gray-600 font-medium">Subtotal</span>
          <span className="text-gray-800 font-bold">{formatPrice(cart.reduce((acc, item) => acc + item.price * item.quantity, 0))}</span>
        </div>
      </div>
    </div>
  );
}
