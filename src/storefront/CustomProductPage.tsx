import React, { useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Send, Image as ImageIcon, Paintbrush, ArrowLeft, Upload, X, Loader2 } from 'lucide-react';
import { maskCPF, maskPhone, maskCEP, validateCPF, validateEmail } from '../utils/validation';

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

            {/* Dados do Cliente */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                Dados do Cliente
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome Completo *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Seu nome completo"
                    value={formData.nome}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, nome: e.target.value}));
                      if (formErrors.nome) setFormErrors(prev => ({...prev, nome: false}));
                    }}
                    className={`w-full bg-white border ${formErrors.nome ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.nome && <p className="text-xs text-red-500 font-medium">Nome completo é obrigatório</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CPF (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={formData.cpf}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, cpf: maskCPF(e.target.value)}));
                      if (formErrors.cpf) setFormErrors(prev => ({...prev, cpf: false}));
                    }}
                    className={`w-full bg-white border ${formErrors.cpf ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.cpf && <p className="text-xs text-red-500 font-medium">Insira um CPF válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Celular / WhatsApp *</label>
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
                    className={`w-full bg-white border ${formErrors.celular ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.celular && <p className="text-xs text-red-500 font-medium">Insira um telefone válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">E-mail *</label>
                  <input 
                    type="email" 
                    required
                    placeholder="seu.email@exemplo.com"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, email: e.target.value}));
                      if (formErrors.email) setFormErrors(prev => ({...prev, email: false}));
                    }}
                    className={`w-full bg-white border ${formErrors.email ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.email && <p className="text-xs text-red-500 font-medium">Insira um e-mail válido</p>}
                </div>
              </div>
            </div>

            {/* Endereço de Entrega */}
            <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                Endereço de Entrega
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CEP *</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="00000-000"
                      maxLength={9}
                      value={formData.cep}
                      onChange={handleCepChange}
                      className={`w-full bg-white border ${formErrors.cep ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                    />
                    {cepLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-gray-400" size={16} />
                      </div>
                    )}
                  </div>
                  {formErrors.cep && <p className="text-xs text-red-500 font-medium">Insira um CEP válido</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Endereço *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Rua, Avenida, etc."
                    value={formData.rua}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, rua: e.target.value}));
                      if (formErrors.rua) setFormErrors(prev => ({...prev, rua: false}));
                    }}
                    className={`w-full bg-white border ${formErrors.rua ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.rua && <p className="text-xs text-red-500 font-medium">Endereço é obrigatório</p>}
                </div>

                <div className="grid grid-cols-2 gap-4 col-span-1 sm:col-span-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Casa / Apto *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Casa, apartamento, etc."
                      value={formData.complemento}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, complemento: e.target.value}));
                        if (formErrors.complemento) setFormErrors(prev => ({...prev, complemento: false}));
                      }}
                      className={`w-full bg-white border ${formErrors.complemento ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                    />
                    {formErrors.complemento && <p className="text-xs text-red-500 font-medium">Obrigatório</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Número *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nº"
                      value={formData.numero}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, numero: e.target.value}));
                        if (formErrors.numero) setFormErrors(prev => ({...prev, numero: false}));
                      }}
                      className={`w-full bg-white border ${formErrors.numero ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                    />
                    {formErrors.numero && <p className="text-xs text-red-500 font-medium">Obrigatório</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bairro *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Bairro"
                    value={formData.bairro}
                    onChange={(e) => {
                      setFormData(prev => ({...prev, bairro: e.target.value}));
                      if (formErrors.bairro) setFormErrors(prev => ({...prev, bairro: false}));
                    }}
                    className={`w-full bg-white border ${formErrors.bairro ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                  />
                  {formErrors.bairro && <p className="text-xs text-red-500 font-medium">Bairro é obrigatório</p>}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1 col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cidade *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Cidade"
                      value={formData.cidade}
                      onChange={(e) => {
                        setFormData(prev => ({...prev, cidade: e.target.value}));
                        if (formErrors.cidade) setFormErrors(prev => ({...prev, cidade: false}));
                      }}
                      className={`w-full bg-white border ${formErrors.cidade ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all`}
                    />
                    {formErrors.cidade && <p className="text-xs text-red-500 font-medium">Cidade é obrigatória</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UF *</label>
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
                      className={`w-full bg-white border ${formErrors.estado ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-3 text-sm outline-none transition-all text-center`}
                    />
                    {formErrors.estado && <p className="text-xs text-red-500 font-medium">UF</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 uppercase tracking-wider">Como você imagina o produto? *</label>
              <textarea 
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description) setFormErrors(prev => ({...prev, description: false}));
                }}
                placeholder="Descreva a cor, se tem foto, frase, nome..."
                className={`w-full bg-gray-50 border ${formErrors.description ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-pink-500'} rounded-xl p-4 text-gray-900 outline-none min-h-[120px] resize-y`}
              ></textarea>
              {formErrors.description && <p className="text-xs text-red-500 font-medium">Por favor, descreva como imagina o produto</p>}
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
              disabled={isUploading}
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
