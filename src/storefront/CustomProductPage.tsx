import React, { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Paintbrush, ArrowLeft } from 'lucide-react';

export function CustomProductPage({ onBack }: { onBack: () => void }) {
  const { settings } = useSettings();
  const [productType, setProductType] = useState('Caneca');
  const [description, setDescription] = useState('');
  const [hasImage, setHasImage] = useState(false);

  const handleSend = () => {
    let message = `Olá! Gostaria de fazer um orçamento para um produto personalizado.\n\n`;
    message += `*Produto:* ${productType}\n`;
    message += `*Detalhes:* ${description}\n`;
    if (hasImage) {
      message += `\n*Nota:* Tenho uma imagem/logo e enviarei logo abaixo.\n`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    let number = settings.whatsappNumber ? settings.whatsappNumber.replace(/\D/g, '') : '';
    if (!number) number = '5511999999999';
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
      >
        <ArrowLeft size={20} /> Voltar para a loja
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-8 text-white text-center">
          <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Paintbrush size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2">Seu Produto, do Seu Jeito!</h1>
          <p className="text-pink-100 max-w-lg mx-auto">
            Faça um orçamento de canecas, azulejos, camisetas e muito mais com a sua cara, logo da sua empresa ou para presentear alguém especial.
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">O que você deseja personalizar?</label>
            <select 
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:border-pink-500 outline-none"
            >
              <option value="Caneca">Caneca</option>
              <option value="Azulejo">Azulejo</option>
              <option value="Camiseta">Camiseta</option>
              <option value="Garrafa/Squeeze">Garrafa / Squeeze</option>
              <option value="Mousepad">Mousepad</option>
              <option value="Almofada">Almofada</option>
              <option value="Outro">Outro (Descrever)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Como você imagina o produto?</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva a cor, se tem foto, frase, nome..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:border-pink-500 outline-none min-h-[120px] resize-y"
            ></textarea>
          </div>

          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 p-4 rounded-xl cursor-pointer" onClick={() => setHasImage(!hasImage)}>
            <input 
              type="checkbox" 
              checked={hasImage}
              onChange={(e) => setHasImage(e.target.checked)}
              className="accent-blue-600 w-5 h-5" 
            />
            <div className="flex items-center gap-2 text-blue-800 font-medium select-none">
              <ImageIcon size={20} />
              <span>Tenho uma foto/logo pronta para enviar junto</span>
            </div>
          </div>

          <button 
            onClick={handleSend}
            disabled={!description.trim()}
            className="w-full bg-[#25D366] text-white rounded-xl p-4 font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={24} /> Solicitar Orçamento no WhatsApp
          </button>
          
          <p className="text-center text-xs text-gray-400 mt-4">
            Você será redirecionado para o nosso WhatsApp para enviar os detalhes e concluir o orçamento.
          </p>
        </div>
      </div>
    </div>
  );
}
