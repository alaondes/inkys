import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Paintbrush, ArrowLeft, Upload, X, Loader2 } from 'lucide-react';

export function CustomProductPage({ onBack }: { onBack: () => void }) {
  const { settings } = useSettings();
  const customProducts = settings.customProducts && settings.customProducts.length > 0 
    ? settings.customProducts 
    : [{ name: 'Caneca', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400' }];
  
  const [productType, setProductType] = useState(customProducts[0].name);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProduct = customProducts.find(p => p.name === productType) || customProducts[0];
  const guideText = selectedProduct.guideText || settings.customPageGuideText;
  const guideImage = selectedProduct.guideImage || settings.customPageGuideImage;
  const unitPrice = selectedProduct.price || 0;
  const totalPrice = unitPrice * quantity;
  const pixDiscount = settings.pixDiscount || 0;
  const discountAmount = totalPrice * pixDiscount;
  const totalPixPrice = totalPrice - discountAmount;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    setIsUploading(true);
    let imageUrl = '';
    
    if (imageFile) {
      try {
        const { storage } = await import('../lib/firebase');
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const fileRef = ref(storage, `custom_requests/${Date.now()}_${imageFile.name}`);
        await uploadBytes(fileRef, imageFile);
        imageUrl = await getDownloadURL(fileRef);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    
    setIsUploading(false);

    let message = `Olá! Gostaria de fazer um pedido personalizado.\n\n`;
    message += `*Produto:* ${productType}\n`;
    message += `*Quantidade:* ${quantity}\n`;
    if (unitPrice > 0) {
      message += `*Valor:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n`;
      if (pixDiscount > 0) {
        message += `*Valor no PIX:* R$ ${totalPixPrice.toFixed(2).replace('.', ',')}\n`;
      }
    }
    message += `*Detalhes:* ${description}\n`;
    if (imageUrl) {
      message += `\n*Arte em anexo:* ${imageUrl}\n`;
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
          <h1 className="text-3xl font-extrabold mb-2">{settings.customPageTitle || 'Seu Produto, do Seu Jeito!'}</h1>
          <p className="text-pink-100 max-w-lg mx-auto">
            {settings.customPageDescription || 'Faça um orçamento de canecas, azulejos, camisetas e muito mais com a sua cara, logo da sua empresa ou para presentear alguém especial.'}
          </p>
        </div>

        <div className="p-8 flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">O que você deseja personalizar?</label>
              <select 
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-900 focus:border-pink-500 outline-none"
              >
                {customProducts.map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
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

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Tem alguma arte ou logo pronta?</label>
              
              {(guideText || guideImage) && (
                <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-2 space-y-3">
                  {guideImage && (
                    <img 
                      src={guideImage} 
                      alt="Guia de Medidas" 
                      className="w-full max-h-48 object-contain rounded-lg"
                    />
                  )}
                  {guideText && (
                    <p className="text-sm text-blue-800 whitespace-pre-line">
                      {guideText}
                    </p>
                  )}
                </div>
              )}

              <input 
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              {!imageFile ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl p-6 text-gray-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all"
                >
                  <Upload size={24} />
                  <span className="font-medium">Clique para anexar sua imagem</span>
                  <span className="text-xs text-gray-400">JPG, PNG ou SVG</span>
                </button>
              ) : (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <ImageIcon className="text-blue-600 flex-shrink-0" size={20} />
                    <span className="text-blue-900 font-medium truncate">{imageFile.name}</span>
                  </div>
                  <button 
                    onClick={() => setImageFile(null)}
                    className="text-gray-400 hover:text-red-500 p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 w-full sm:w-[140px]">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider ml-1">Quantidade</label>
                <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white h-[52px] shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xl font-light"
                  >
                    -
                  </button>
                  <input 
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-gray-50 text-center font-bold text-lg outline-none appearance-none border-x border-gray-100"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xl font-light"
                  >
                    +
                  </button>
                </div>
              </div>

              {unitPrice > 0 && (
                <div className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center justify-between shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold leading-none mb-1">Unitário</span>
                    <span className="text-sm text-gray-700 font-semibold leading-none">R$ {unitPrice.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="h-8 w-px bg-gray-200 mx-2"></div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] uppercase tracking-wider text-[var(--color-primary)] font-bold leading-none mb-1">Total ({quantity}x)</span>
                    <div className="flex flex-col items-end">
                      <span className="text-xl font-black text-gray-900 leading-none tracking-tight">
                        R$ {totalPrice.toFixed(2).replace('.', ',')}
                      </span>
                      {pixDiscount > 0 && (
                        <span className="text-xs text-[#25D366] font-bold mt-1">
                          ou R$ {totalPixPrice.toFixed(2).replace('.', ',')} no PIX
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={handleSend}
              disabled={!description.trim() || isUploading}
              className="w-full bg-[#25D366] text-white rounded-xl p-4 font-bold text-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" size={24} /> Enviando Arte...
                </>
              ) : (
                <>
                  <Send size={24} /> Solicitar Orçamento no WhatsApp
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
              Você será redirecionado para o nosso WhatsApp para enviar os detalhes e concluir o orçamento.
            </p>
          </div>

          <div className="w-full md:w-1/3 flex flex-col items-center justify-start mt-6 md:mt-0">
            <div className="w-full max-w-[240px] rounded-2xl overflow-hidden shadow-md border border-gray-100 aspect-square relative bg-gray-50">
              {(() => {
                const imgUrl = customProducts.find(p => p.name === productType)?.image || customProducts[0]?.image;
                if (!imgUrl) return <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>;
                return (
                  <img 
                    src={imgUrl} 
                    alt={`Exemplo de ${productType}`} 
                    className="w-full h-full object-cover transition-all duration-500"
                    referrerPolicy="no-referrer"
                  />
                );
              })()}
            </div>
            <p className="text-center text-xs text-gray-400 mt-3 uppercase tracking-wider font-bold">
              Imagem ilustrativa
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
