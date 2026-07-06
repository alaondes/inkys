import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Paintbrush, ArrowLeft, Upload, X, Loader2, Download, FileText, ChevronRight, ChevronLeft } from 'lucide-react';
import { maskCPF, maskPhone, maskCEP, validateCPF, validateEmail } from '../utils/validation';

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

  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    celular: '',
    email: '',
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const [cepLoading, setCepLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: boolean}>({});

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const maskedValue = maskCEP(e.target.value);
    
    setFormData(prev => ({...prev, cep: maskedValue}));
    if (formErrors.cep) setFormErrors(prev => ({...prev, cep: false}));

    if (rawValue.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${rawValue}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            rua: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
          setFormErrors(prev => ({
            ...prev,
            cep: false,
            rua: false,
            bairro: false,
            cidade: false,
            estado: false
          }));
        } else {
          setFormErrors(prev => ({...prev, cep: true}));
        }
      } catch (err) {
        setFormErrors(prev => ({...prev, cep: true}));
      } finally {
        setCepLoading(false);
      }
    }
  };

  const selectedProduct = customProducts.find(p => p.name === productType) || customProducts[0];
  const guideText = selectedProduct.guideText || settings.customPageGuideText;
  const guideImage = selectedProduct.guideImage || settings.customPageGuideImage;
  const unitPrice = selectedProduct.price || 0;
  const totalPrice = unitPrice * quantity;
  const pixDiscount = settings.pixDiscount || 0;
  const discountAmount = totalPrice * pixDiscount;
  const totalPixPrice = totalPrice - discountAmount;

  const [currentStep, setCurrentStep] = useState(1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSend = async () => {
    // Validate mandatory fields
    const errors: {[key: string]: boolean} = {};
    if (!formData.nome.trim()) errors.nome = true;
    if (formData.cpf.trim() && !validateCPF(formData.cpf)) errors.cpf = true;
    if (!formData.celular.trim() || formData.celular.replace(/\D/g, '').length < 10) errors.celular = true;
    if (!formData.email.trim() || !validateEmail(formData.email)) errors.email = true;
    
    if (!formData.cep.trim() || formData.cep.replace(/\D/g, '').length !== 8) errors.cep = true;
    if (!formData.rua.trim()) errors.rua = true;
    if (!formData.complemento.trim()) errors.complemento = true;
    if (!formData.numero.trim()) errors.numero = true;
    if (!formData.bairro.trim()) errors.bairro = true;
    if (!formData.cidade.trim()) errors.cidade = true;
    if (!formData.estado.trim()) errors.estado = true;
    if (!description.trim()) errors.description = true;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const toast = (await import('react-hot-toast')).default;
      toast.error('Por favor, preencha todos os campos obrigatórios corretamente.');
      
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

    let message = `Olá! Gostaria de fazer um pedido personalizado.\n\n`;
    
    message += `👤 *DADOS DO CLIENTE*\n`;
    message += `• *Nome:* ${formData.nome}\n`;
    if (formData.cpf.trim()) {
      message += `• *CPF:* ${formData.cpf}\n`;
    }
    message += `• *WhatsApp:* ${formData.celular}\n`;
    message += `• *E-mail:* ${formData.email}\n\n`;

    message += `📍 *ENDEREÇO DE ENTREGA*\n`;
    message += `• *CEP:* ${formData.cep}\n`;
    message += `• *Rua:* ${formData.rua}, ${formData.complemento}, Nº ${formData.numero}\n`;
    message += `• *Bairro:* ${formData.bairro}\n`;
    message += `• *Cidade/UF:* ${formData.cidade}/${formData.estado}\n\n`;

    message += `📦 *DETALHES DO PEDIDO*\n`;
    message += `• *Produto:* ${productType}\n`;
    message += `• *Quantidade:* ${quantity}\n`;
    if (unitPrice > 0) {
      message += `• *Valor Total:* R$ ${totalPrice.toFixed(2).replace('.', ',')}\n`;
      if (pixDiscount > 0) {
        message += `• *Valor no PIX (com desconto):* R$ ${totalPixPrice.toFixed(2).replace('.', ',')}\n`;
      }
    }
    message += `• *Como imagina o produto:* ${description}\n`;
    if (imageUrl) {
      message += `\n📎 *Arte em anexo:* ${imageUrl}\n`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    let number = settings.whatsappNumber ? settings.whatsappNumber.replace(/\D/g, '') : '';
    if (!number) number = '5511999999999';
    const whatsappUrl = `https://wa.me/${number}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12" style={{ '--color-primary': settings.primaryColor || '#0891b2' } as React.CSSProperties}>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Voltar para a loja
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Elegant Brand Banner */}
        <div 
          className="p-8 md:p-12 text-white text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${settings.headerColor || '#8b3887'} 0%, ${settings.topBarColor || '#d64c71'} 100%)` }}
        >
          {/* Subtle background abstract shapes for elegance */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent)] pointer-events-none"></div>
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <div className="mx-auto bg-white/10 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border border-white/10">
              <Paintbrush size={28} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black mb-1 tracking-tight leading-none">
              {settings.customPageTitle || 'Seu Produto, do Seu Jeito!'}
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-medium">
              {settings.customPageDescription || 'Faça um orçamento de canecas, azulejos, camisetas e muito mais com a sua cara, logo da sua empresa ou para presentear alguém especial.'}
            </p>
          </div>
        </div>

        {/* Dynamic Two-Column Layout */}
        <div className="p-4 sm:p-8 flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column: Interactive Guided Forms */}
          <div className="flex-1 space-y-6 w-full">
            
            {/* Stepper Navigation */}
            <div id="configurator-top" className="bg-white border border-gray-100 rounded-3xl p-5 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-6 w-full">
                {/* Step 1 Tab Button */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    currentStep === 1
                      ? 'bg-[var(--color-primary)] text-white shadow-xs scale-105 ring-4 ring-purple-100/60'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {currentStep > 1 ? '✓' : '1'}
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold block leading-none">Passo 1</span>
                    <span className={`text-xs font-extrabold tracking-tight ${currentStep === 1 ? 'text-gray-900' : 'text-green-700'}`}>
                      Produto & Arte
                    </span>
                  </div>
                </button>

                {/* Line Separator */}
                <div className="flex-1 h-0.5 max-w-[60px] bg-gray-100 rounded-full"></div>

                {/* Step 2 Tab Button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!description.trim()) {
                      setFormErrors(prev => ({ ...prev, description: true }));
                      const toast = (await import('react-hot-toast')).default;
                      toast.error('Por favor, descreva como imagina seu produto antes de avançar.');
                      return;
                    }
                    setCurrentStep(2);
                  }}
                  className="flex items-center gap-2 text-left cursor-pointer focus:outline-none"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                    currentStep === 2
                      ? 'bg-[var(--color-primary)] text-white shadow-xs scale-105 ring-4 ring-purple-100/60'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    2
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 uppercase tracking-widest font-extrabold block leading-none">Passo 2</span>
                    <span className={`text-xs font-extrabold tracking-tight ${currentStep === 2 ? 'text-gray-900' : 'text-gray-400'}`}>
                      Contato & Envio
                    </span>
                  </div>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 shrink-0 bg-gray-50 border border-gray-100/80 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"></span>
                {currentStep === 1 ? 'Personalizando' : 'Finalizando'}
              </div>
            </div>

            {currentStep === 1 ? (
              <div className="space-y-6">
                
                {/* Step 1: Visual Option Selector */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">1.1</span>
                      Selecione o Produto para Personalizar
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {customProducts.map(p => {
                      const isSelected = p.name === productType;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setProductType(p.name)}
                          className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all text-center gap-2 cursor-pointer bg-white group relative ${
                            isSelected 
                              ? 'border-[var(--color-primary)] bg-purple-50/5 shadow-md ring-1 ring-[var(--color-primary)] scale-[1.02]' 
                              : 'border-gray-200 hover:border-gray-300 hover:shadow-xs'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 bg-[var(--color-primary)] text-white p-0.5 rounded-full z-10 shadow-xs">
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            </div>
                          )}
                          
                          <div className="w-full aspect-square rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center relative">
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              getProductPlaceholderIcon(p.name)
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm font-bold text-gray-800 leading-tight">{p.name}</span>
                            {p.price && p.price > 0 ? (
                              <span className="text-[10px] sm:text-xs text-gray-500 mt-0.5 font-medium">A partir de R$ {p.price.toFixed(2).replace('.', ',')}</span>
                            ) : (
                              <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 font-medium">Preço sob consulta</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Customization Details */}
                <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                    <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">1.2</span>
                      Como Imagina o seu Produto?
                    </h3>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
                  </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Descreva a sua ideia *</label>
                <textarea 
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formErrors.description) setFormErrors(prev => ({...prev, description: false}));
                  }}
                  placeholder="Descreva detalhadamente a cor, tema, nome, frase ou logo que deseja estampar. Nossa equipe usará essa descrição para criar a arte perfeita."
                  className={`w-full bg-gray-50/50 border ${formErrors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-4 text-gray-900 outline-none min-h-[110px] resize-y transition-all text-sm focus:bg-white focus:ring-4`}
                ></textarea>
                {formErrors.description && <p className="text-xs text-red-500 font-medium">Por favor, forneça uma breve descrição da sua ideia.</p>}
              </div>

              {/* GABARITO / MOLDE DE DOWNLOAD DIRECTLY IN STEP 2 */}
              {(() => {
                // Read templates list from selectedProduct
                let templates: { name: string; file: string; program?: string; }[] = selectedProduct?.templates || [];
                
                // Backwards compatibility: if empty list but old single properties exist, use them
                if (templates.length === 0 && selectedProduct?.templateFile) {
                  templates = [{
                    name: selectedProduct.templateFileName || 'Gabarito Principal',
                    file: selectedProduct.templateFile
                  }];
                }
                
                // Filter out any template items that don't have a file
                templates = templates.filter(t => t.file);
                
                if (templates.length === 0) return null;
                
                return (
                  <div className="bg-gradient-to-br from-indigo-50/85 to-purple-50/60 border border-purple-100 rounded-2xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-[var(--color-primary)] shrink-0 shadow-xs">
                        <FileText size={18} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <h4 className="font-extrabold text-gray-800 text-xs uppercase tracking-wider leading-tight flex items-center gap-1.5">
                          <span>Moldes / Gabaritos de Arte</span>
                          <span className="text-[9px] bg-purple-100 text-[var(--color-primary)] font-bold px-1.5 py-0.5 rounded">
                            {templates.length === 1 ? '1 Molde Disponível' : `${templates.length} Moldes Disponíveis`}
                          </span>
                        </h4>
                        <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                          Se você prefere criar sua própria arte, baixe os nossos moldes oficiais com as dimensões ideais de impressão.
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mt-2">
                      {templates.map((tmpl, tIdx) => {
                        const isExternal = !tmpl.file.startsWith('data:');
                        
                        // Map program specific colors and styles for high visual polish
                        const getProgramInfo = (program?: string) => {
                          switch (program) {
                            case 'ps':
                              return {
                                label: 'Photoshop',
                                bg: 'bg-blue-50 border-blue-100/80 text-blue-600',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-xs" title="Criado no Photoshop">
                                    Ps
                                  </span>
                                )
                              };
                            case 'cdr':
                              return {
                                label: 'CorelDraw',
                                bg: 'bg-green-50 border-green-100/80 text-green-700',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center tracking-tight shadow-xs" title="Criado no CorelDraw">
                                    Cdr
                                  </span>
                                )
                              };
                            case 'ai':
                              return {
                                label: 'Illustrator',
                                bg: 'bg-amber-50 border-amber-100/80 text-amber-600',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center tracking-tighter shadow-xs" title="Criado no Illustrator">
                                    Ai
                                  </span>
                                )
                              };
                            case 'canva':
                              return {
                                label: 'Canva',
                                bg: 'bg-cyan-50 border-cyan-100/80 text-cyan-600',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-500 text-white font-black text-[8px] flex items-center justify-center shadow-xs" title="Criado no Canva">
                                    Canva
                                  </span>
                                )
                              };
                            case 'pdf':
                              return {
                                label: 'PDF',
                                bg: 'bg-red-50 border-red-100/80 text-red-600',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-red-600 text-white font-extrabold text-[10px] flex items-center justify-center shadow-xs" title="Formato PDF">
                                    PDF
                                  </span>
                                )
                              };
                            default:
                              return {
                                label: 'Gabarito',
                                bg: 'bg-slate-50 border-slate-150 text-slate-600',
                                badge: (
                                  <span className="w-8 h-8 shrink-0 rounded-lg bg-slate-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs" title="Gabarito">
                                    MOLDE
                                  </span>
                                )
                              };
                          }
                        };
                        
                        const progInfo = getProgramInfo(tmpl.program);
                        
                        return (
                          <div key={tIdx} className="bg-white border border-purple-100/40 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-xs">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {progInfo.badge}
                              <div className="flex flex-col overflow-hidden text-left min-w-0 flex-1">
                                <span className="text-xs font-bold text-gray-700 truncate" title={tmpl.name}>
                                  {tmpl.name || `Molde #${tIdx + 1}`}
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border uppercase tracking-wider ${progInfo.bg}`}>
                                    {progInfo.label}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-mono">
                                    {isExternal ? 'Servidor Externo' : 'Arquivo Integrado'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <a
                              href={tmpl.file}
                              download={tmpl.name || 'gabarito.pdf'}
                              target={isExternal ? '_blank' : undefined}
                              rel={isExternal ? 'noopener noreferrer' : undefined}
                              className="bg-[var(--color-primary)] text-white hover:brightness-105 px-3.5 py-2 rounded-lg text-[11px] font-extrabold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer hover:shadow-sm"
                              title={`Baixar ${tmpl.name}`}
                            >
                              <Download size={14} />
                              <span className="tracking-wide uppercase">BAIXAR</span>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Guia de Arte & Upload */}
              <div className="space-y-4 pt-1">
                {(guideText || guideImage) && (
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border border-blue-100/60 rounded-2xl p-4 space-y-3 flex gap-3.5 items-start">
                    <div className="bg-blue-100/80 p-2 rounded-xl text-blue-600 shrink-0 mt-0.5 shadow-xs">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">Dica de Envio de Arquivos</h4>
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
                )}

                <input 
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                
                <div className="space-y-1.5">
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

            {/* Advanced to Step 2 Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!description.trim()) {
                    setFormErrors(prev => ({ ...prev, description: true }));
                    const toast = (await import('react-hot-toast')).default;
                    toast.error('Por favor, descreva como imagina seu produto antes de avançar.');
                    return;
                  }
                  setCurrentStep(2);
                  // Scroll beautifully to configurator top
                  const topEl = document.getElementById('configurator-top');
                  if (topEl) {
                    topEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="w-full bg-[var(--color-primary)] text-white rounded-2xl p-4 font-extrabold text-base hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-purple-200 cursor-pointer"
              >
                Prosseguir para Contato & Envio
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">

            {/* Step 3: Contact Details */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">2.1</span>
                  Seus Dados de Contato
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, nome: e.target.value}));
                      if (formErrors.nome) setFormErrors(prev => ({...prev, nome: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.nome ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.nome && <p className="text-xs text-red-500 font-medium ml-1">Nome completo é obrigatório</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">CPF (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formData.cpf}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, cpf: maskCPF(e.target.value)}));
                      if (formErrors.cpf) setFormErrors(prev => ({...prev, cpf: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.cpf ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.cpf && <p className="text-xs text-red-500 font-medium ml-1">Insira um CPF válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Celular / WhatsApp *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    value={formData.celular}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, celular: maskPhone(e.target.value)}));
                      if (formErrors.celular) setFormErrors(prev => ({...prev, celular: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.celular ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.celular && <p className="text-xs text-red-500 font-medium ml-1">Insira um telefone válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">E-mail *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="seu.email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, email: e.target.value}));
                      if (formErrors.email) setFormErrors(prev => ({...prev, email: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.email && <p className="text-xs text-red-500 font-medium ml-1">Insira um e-mail válido</p>}
                </div>
              </div>
            </div>

            {/* Step 4: Shipping Address */}
            <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-50 pb-3">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wider flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[10px] flex items-center justify-center font-black">2.2</span>
                  Endereço de Entrega
                </h3>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Obrigatório</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">CEP *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="00000-000"
                      maxLength={9}
                      value={formData.cep}
                      onChange={handleCepChange}
                      className={`w-full bg-gray-50/50 border ${formErrors.cep ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                    />
                    {cepLoading && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-gray-400" size={16} />
                      </div>
                    )}
                  </div>
                  {formErrors.cep && <p className="text-xs text-red-500 font-medium ml-1">Insira um CEP válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Endereço (Rua/Av) *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Rua, Avenida, etc."
                    value={formData.rua}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, rua: e.target.value}));
                      if (formErrors.rua) setFormErrors(prev => ({...prev, rua: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.rua ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.rua && <p className="text-xs text-red-500 font-medium ml-1">Endereço é obrigatório</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Complemento / Casa / Apto *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Casa, apartamento, etc."
                      value={formData.complemento}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, complemento: e.target.value}));
                        if (formErrors.complemento) setFormErrors(prev => ({...prev, complemento: false}));
                      }}
                      className={`w-full bg-gray-50/50 border ${formErrors.complemento ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                    />
                    {formErrors.complemento && <p className="text-xs text-red-500 font-medium ml-1">Obrigatório</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Número *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nº"
                      value={formData.numero}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, numero: e.target.value}));
                        if (formErrors.numero) setFormErrors(prev => ({...prev, numero: false}));
                      }}
                      className={`w-full bg-gray-50/50 border ${formErrors.numero ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                    />
                    {formErrors.numero && <p className="text-xs text-red-500 font-medium ml-1">Obrigatório</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Bairro *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, bairro: e.target.value}));
                      if (formErrors.bairro) setFormErrors(prev => ({...prev, bairro: false}));
                    }}
                    className={`w-full bg-gray-50/50 border ${formErrors.bairro ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                  />
                  {formErrors.bairro && <p className="text-xs text-red-500 font-medium ml-1">Bairro é obrigatório</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Cidade *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, cidade: e.target.value}));
                        if (formErrors.cidade) setFormErrors(prev => ({...prev, cidade: false}));
                      }}
                      className={`w-full bg-gray-50/50 border ${formErrors.cidade ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all focus:bg-white focus:ring-4`}
                    />
                    {formErrors.cidade && <p className="text-xs text-red-500 font-medium ml-1">Cidade é obrigatória</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">UF *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="UF"
                      maxLength={2}
                      value={formData.estado}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, estado: e.target.value.toUpperCase()}));
                        if (formErrors.estado) setFormErrors(prev => ({...prev, estado: false}));
                      }}
                      className={`w-full bg-gray-50/50 border ${formErrors.estado ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-gray-200 focus:border-[var(--color-primary)] focus:ring-purple-100'} rounded-2xl p-3 text-sm outline-none transition-all text-center focus:bg-white focus:ring-4`}
                    />
                    {formErrors.estado && <p className="text-xs text-red-500 font-medium ml-1">UF</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quantity Controller */}
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-50/40 border border-gray-100 p-5 rounded-3xl">
              <div className="space-y-1.5 w-full sm:w-[150px] shrink-0">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Quantidade</label>
                <div className="flex border border-gray-200 rounded-2xl overflow-hidden bg-white h-[48px] shadow-sm">
                  <button 
                    type="button"
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
                    className="w-full bg-transparent text-center font-extrabold text-gray-800 outline-none appearance-none border-x border-gray-100"
                  />
                  <button 
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors text-xl font-light"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500 leading-relaxed font-medium">
                Altere a quantidade para receber o valor simulado correto. Grandes quantidades podem dar direito a descontos extras ao negociar no WhatsApp.
              </div>
            </div>

            {/* Send CTA Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  const topEl = document.getElementById('configurator-top');
                  if (topEl) {
                    topEl.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl px-5 py-4 font-bold text-base transition-all flex items-center justify-center gap-2 cursor-pointer sm:w-auto w-full"
              >
                <ChevronLeft size={18} />
                Voltar
              </button>
              
              <button 
                onClick={handleSend}
                disabled={isUploading}
                className="flex-1 bg-[#25D366] text-white rounded-2xl p-4 font-bold text-lg hover:brightness-105 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-[#25D366]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} /> Enviando Arte...
                  </>
                ) : (
                  <>
                    <Send size={22} /> Solicitar Orçamento no WhatsApp
                  </>
                )}
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-2">
              Você será redirecionado para o nosso WhatsApp para enviar os detalhes e concluir o orçamento com nossa equipe.
            </p>
          </div>
        )}
      </div>

          {/* Right Column: Sticky Resumo / Preview Receipt (Didactic, Elegant) */}
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
                    <h3 className="font-extrabold text-gray-800 text-sm uppercase tracking-wider">Resumo do Orçamento</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-mono">Simulação em Tempo Real</p>
                  </div>

                  {/* Detalhes listados no recibo */}
                  <div className="space-y-3 font-mono text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Produto:</span>
                      <span className="font-bold text-gray-900">{productType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Quantidade:</span>
                      <span className="font-bold text-gray-900">{quantity}x</span>
                    </div>
                    {unitPrice > 0 ? (
                      <>
                        <div className="flex justify-between">
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

                {/* Bottom decorative check progress */}
                <div className="bg-gray-50/50 p-5 border-t border-gray-100 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2 font-sans">
                    Progresso de Preenchimento
                  </span>
                  
                  {/* Checklist */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-4.5 h-4.5 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className="text-gray-700 font-medium">Produto selecionado</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        description.trim().length > 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className={`${description.trim().length > 3 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        Descrição da Personalização
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        formData.nome.trim() && formData.celular.replace(/\D/g, '').length >= 10 && formData.email.trim() ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className={`${formData.nome.trim() && formData.celular.replace(/\D/g, '').length >= 10 && formData.email.trim() ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        Dados de Contato
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        formData.cep.replace(/\D/g, '').length === 8 && formData.rua.trim() ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className={`${formData.cep.replace(/\D/g, '').length === 8 && formData.rua.trim() ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                        Endereço de Entrega
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 ${
                        imageFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                      <span className={`${imageFile ? 'text-gray-700 font-medium' : 'text-gray-400'} flex items-center gap-1`}>
                        Imagem da Arte <span className="text-[9px] text-gray-400 font-normal uppercase">(Opcional)</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
