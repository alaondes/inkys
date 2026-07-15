import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Paintbrush, ArrowLeft, Upload, X, Loader2, Download, FileText, ChevronRight, ChevronLeft, ShoppingCart } from 'lucide-react';
import { toast } from 'react-hot-toast';

const getProductPlaceholderIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('caneca') || lower.includes('copo') || lower.includes('xícara')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.9 1.9 0 01-2-2V4h10v4z" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Caneca</span>
      </div>
    );
  }
  if (lower.includes('camiseta') || lower.includes('camisa') || lower.includes('vestuário') || lower.includes('moletom')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Camiseta</span>
      </div>
    );
  }
  if (lower.includes('mousepad') || lower.includes('mouse')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <path d="M12 3v18M12 12h9" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Mousepad</span>
      </div>
    );
  }
  if (lower.includes('almofada') || lower.includes('travesseiro')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16v16H4zm0 8h16M12 4v16" strokeDasharray="2 2" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Almofada</span>
      </div>
    );
  }
  if (lower.includes('azulejo') || lower.includes('quadro') || lower.includes('placa')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Azulejo</span>
      </div>
    );
  }
  if (lower.includes('garrafa') || lower.includes('squeeze') || lower.includes('copo térmico') || lower.includes('copo termico')) {
    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M8.5 2h7M10 2v3M14 2v3M9 5h6v4H9z" />
            <rect x="8" y="9" width="8" height="13" rx="2" />
          </svg>
        </div>
        <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Squeeze</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-600 shadow-xs">
        <Paintbrush className="w-5 h-5 text-slate-500" />
      </div>
      <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Produto</span>
    </div>
  );
};

export function CustomProductPage({ onBack, onAddToCart }: { onBack: () => void, onAddToCart?: (product: any, color?: string, customData?: any, quantity?: number) => void }) {
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

  const [formErrors, setFormErrors] = useState<{[key: string]: boolean}>({});

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

  const handleAddToCart = async () => {
    const errors: {[key: string]: boolean} = {};
    if (!description.trim()) errors.description = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Por favor, descreva como imagina seu produto.');
      
      // Scroll to first error
      setTimeout(() => {
        const firstErrorEl = document.querySelector('.border-red-500');
        if (firstErrorEl) {
          firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setIsUploading(true);
    let imageUrl = '';
    
    if (imageFile) {
      try {
        const { resizeImage } = await import('../utils/image');
        imageUrl = await resizeImage(imageFile, 800, 800);
      } catch (error) {
        console.error("Error uploading image:", error);
      }
    }
    
    setIsUploading(false);

    if (onAddToCart) {
      const customProductObj = {
        id: `custom-${productType.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${productType} Personalizado`,
        price: unitPrice,
        image: selectedProduct.image,
        description: 'Produto Personalizado sob demanda',
        category: 'Personalizados',
        stock: 9999
      };
      
      onAddToCart(customProductObj, undefined, { text: description, image: imageUrl || undefined }, quantity);
      toast.success(`${quantity}x ${productType} adicionado(s) ao carrinho com sucesso!`);
      
      // Reset form to allow adding another different product
      setDescription('');
      setImageFile(null);
      setQuantity(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans pb-24" id="configurator-top">
      {/* Header Minimalista */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm/50">
        <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-full cursor-pointer"
          >
            <ArrowLeft size={16} /> Voltar para a loja
          </button>
        </div>
      </div>

      {/* Banner / Header Title Area */}
      <div 
        className="relative w-full max-w-[1200px] mx-auto mt-6 rounded-3xl overflow-hidden px-8 py-16 md:py-24 text-center shadow-sm"
        style={{
          background: `linear-gradient(135deg, ${settings.topBarColor || '#f6d365'} 0%, ${settings.buyButtonColor || '#fda085'} 100%)`
        }}
      >
        <div className="relative z-10 text-white max-w-2xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/30">
            <Paintbrush className="text-white" size={24} />
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
            Seu Produto, do Seu Jeito!
          </h1>
          <p className="text-white/90 text-sm md:text-base font-medium max-w-lg mx-auto leading-relaxed">
            Faça um orçamento de canecas, azulejos, camisetas e muito mais com a sua cara, logo da sua empresa ou para presentear alguém especial.
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Form Steps */}
          <div className="flex-1 max-w-3xl">

            <div className="space-y-6">
              {/* Step 1: Product Selection */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">1</span>
                    Selecione o Produto para Personalizar
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {customProducts.map((p) => (
                    <div 
                      key={p.name}
                      onClick={() => setProductType(p.name)}
                      className={`relative flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        productType === p.name 
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md shadow-purple-100 scale-[1.02]' 
                          : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {productType === p.name && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-sm">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                      )}
                      {p.image ? (
                        <div className="w-20 h-20 rounded-xl overflow-hidden mb-3 shadow-inner border border-gray-100 bg-white">
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        getProductPlaceholderIcon(p.name)
                      )}
                      <span className={`font-bold text-center text-sm ${productType === p.name ? 'text-gray-900' : 'text-gray-600'}`}>{p.name}</span>
                      {p.price !== undefined && (
                        <span className="text-[10px] text-gray-400 mt-1 font-medium">A partir de R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Idea Description & Files */}
              <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-6 shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-gray-50 pb-3 relative z-10">
                  <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">2</span>
                    Como imagina o seu produto?
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
                </div>
                
                <div className="space-y-4 relative z-10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Descreva a sua ideia *</label>
                    <textarea 
                      required
                      placeholder="Descreva detalhadamente a cor, tema, nome, frase ou logo que deseja estampar. Nossa equipe usará esta descrição para criar a arte perfeita."
                      rows={4}
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        if (formErrors.description) setFormErrors(prev => ({...prev, description: false}));
                      }}
                      className={`w-full bg-gray-50/50 border ${formErrors.description ? 'border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-4 text-sm outline-none transition-all resize-none focus:bg-white focus:ring-4 shadow-sm`}
                    />
                    {formErrors.description && <p className="text-xs text-red-500 font-medium ml-1">Por favor, descreva sua ideia</p>}
                  </div>

                  {/* Informational Guidelines / Templates for the specific product */}
                  {(guideText || guideImage || selectedProduct.templateFile) && (
                    <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
                      
                      {selectedProduct.templateFile && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-blue-100">
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <FileText size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2">MOLDES / GABARITOS DE ARTE <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black uppercase">MOLDES DISPONÍVEIS</span></h4>
                              <p className="text-xs text-gray-500 mt-0.5 max-w-sm">
                                Se você prefere criar sua própria arte, baixe os nossos moldes oficiais com as dimensões ideais de impressão.
                              </p>
                            </div>
                          </div>
                          
                          <a 
                            href={selectedProduct.templateFile} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-[var(--color-primary)] text-white hover:brightness-110 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
                          >
                            <Download size={16} /> BAIXAR
                          </a>
                        </div>
                      )}

                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-white text-blue-500 flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01"/></svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-800 mb-1">DICAS DE ENVIO DE ARQUIVOS</h4>
                          {guideText && (
                            <p className="text-xs text-blue-800 whitespace-pre-line leading-relaxed font-medium">
                              {guideText}
                            </p>
                          )}
                          {guideImage && (
                            <img 
                              src={guideImage} 
                              alt="Guia de Medidas" 
                              className="w-full max-h-48 object-contain rounded-xl mt-3 border border-blue-100/50 bg-white"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  
                  <div className="space-y-1.5 mt-6">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Anexar Arte / Imagem (Opcional)</label>
                    {!imageFile ? (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-200 hover:border-[var(--color-primary)] rounded-2xl p-6 text-gray-500 hover:text-[var(--color-primary)] hover:bg-purple-50/10 transition-all cursor-pointer bg-gray-50/40 group"
                      >
                        <Upload size={22} className="text-gray-400 group-hover:text-[var(--color-primary)] transition-colors" />
                        <span className="font-bold text-xs text-gray-700">Possui alguma arte, foto ou logotipo pronto?</span>
                        <span className="text-[11px] text-gray-400">Clique aqui para anexar seu arquivo</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-purple-50/20 border border-purple-100 rounded-2xl p-4">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                            <ImageIcon className="text-[var(--color-primary)]" size={20} />
                          </div>
                          <div className="flex flex-col overflow-hidden text-left">
                            <span className="text-sm font-bold text-gray-800 truncate">{imageFile.name}</span>
                            <span className="text-xs text-gray-400">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setImageFile(null)}
                          className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Sticky Resumo / Preview Receipt */}
          <div className="w-full lg:w-[320px] xl:w-[360px] flex-shrink-0">
            <div className="lg:sticky lg:top-8 space-y-6">
              
              {/* Card de Visualização do Modelo */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] bg-purple-50 px-3 py-1 rounded-full mb-4">
                  Visualização do Modelo
                </span>
                <div className="w-full aspect-square max-w-[200px] rounded-2xl overflow-hidden shadow-inner border border-gray-100 relative bg-gray-50 flex items-center justify-center mb-4 group">
                  {(() => {
                    const imgUrl = customProducts.find(p => p.name === productType)?.image || customProducts[0]?.image;
                    if (!imgUrl) return <ImageIcon className="text-gray-300" size={48} />;
                    return (
                      <img 
                        src={imgUrl} 
                        alt={`Exemplo de ${productType}`} 
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    );
                  })()}
                </div>
                <h4 className="font-extrabold text-gray-800 text-lg leading-tight">{productType} Personalizado</h4>
                <p className="text-[10px] text-gray-400 mt-1.5 uppercase tracking-wider font-bold">Imagem Ilustrativa</p>
              </div>

              {/* Recibo Didático de Orçamento */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden relative">
                {/* Paper fringe top decoration effect with small circles */}
                <div className="absolute top-0 left-0 right-0 flex justify-between px-4 -translate-y-1/2">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="w-2.5 h-2.5 bg-gray-50 rounded-full border-b border-gray-100"></div>
                  ))}
                </div>
                
                <div className="p-6 pt-8 space-y-5">
                  <div className="text-center border-b border-dashed border-gray-150 pb-4">
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">Resumo da Configuração</h3>
                  </div>

                  {/* Detalhes listados no recibo */}
                  <div className="space-y-3 font-mono text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Produto:</span>
                      <span className="font-bold text-gray-900">{productType}</span>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                       <label className="font-sans font-bold text-[10px] uppercase text-gray-400">Quantidade</label>
                       <div className="flex border border-gray-200 rounded-lg overflow-hidden bg-white h-8 shadow-sm w-32">
                         <button 
                           type="button"
                           onClick={() => setQuantity(Math.max(1, quantity - 1))}
                           className="w-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                         >
                           -
                         </button>
                         <input 
                           type="number"
                           min="1"
                           value={quantity}
                           onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                           className="w-full bg-transparent text-center font-bold text-gray-800 outline-none appearance-none border-x border-gray-100"
                         />
                         <button 
                           type="button"
                           onClick={() => setQuantity(quantity + 1)}
                           className="w-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                         >
                           +
                         </button>
                       </div>
                    </div>

                    {unitPrice > 0 ? (
                      <>
                        <div className="flex justify-between mt-3">
                          <span>Preço Unitário:</span>
                          <span>R$ {unitPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="border-t border-dashed border-gray-100 my-2"></div>
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-gray-800">Subtotal:</span>
                          <span className="font-bold text-gray-900">R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        {pixDiscount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Desconto PIX ({(pixDiscount * 100).toFixed(0)}%):</span>
                            <span>- R$ {discountAmount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-dashed border-gray-200 my-2"></div>
                        <div className="flex flex-col items-end pt-1">
                          <span className="text-[10px] text-gray-400 uppercase font-sans font-bold mb-1">Total Estimado</span>
                          <span className="text-2xl font-black text-gray-900 tracking-tight">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </span>
                          {pixDiscount > 0 && (
                            <span className="text-xs text-green-600 font-bold mt-1 font-sans">
                              ou R$ {totalPixPrice.toFixed(2).replace('.', ',')} no PIX
                            </span>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4 bg-gray-50 rounded-xl text-gray-400 font-sans italic text-xs">
                        Preço a combinar no WhatsApp
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 border-t border-gray-100">
                  <button 
                    onClick={handleAddToCart}
                    disabled={isUploading}
                    className="w-full bg-[var(--color-primary)] text-white rounded-xl p-4 font-bold text-base hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-md shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} /> Adicionando...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={20} /> Adicionar ao Carrinho
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-gray-400 mt-3 px-2 font-medium leading-relaxed">
                    Você poderá continuar comprando e concluir todos os pedidos de uma vez no carrinho.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
