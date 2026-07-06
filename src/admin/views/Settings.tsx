import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, Banknote, Save, MessageCircle, Plus, Trash2, Upload, Layout, Palette, Store, Truck, Shield, ShoppingCart, Image, Settings as SettingsIcon } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

import { storage } from '../../lib/firebase';


export function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('loja');
  
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [newPassword, setNewPassword] = useState('');
  
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods);
  
  const [storefrontSettings, setStorefrontSettings] = useState({
    topBarColor: settings.topBarColor || '#d64c71',
    headerColor: settings.headerColor || '#8b3887',
    headerTextColor: settings.headerTextColor || '#ffffff',
    navBarColor: settings.navBarColor || 'transparent',
    navBarTextColor: settings.navBarTextColor || '#000000',
    siteBackgroundColor: settings.siteBackgroundColor || '#f9fafb',
    customButtonBgColor: settings.customButtonBgColor || '#facc15',
    customButtonTextColor: settings.customButtonTextColor || '#713f12',
    buyButtonColor: settings.buyButtonColor || '#5ba324',
    
    heroBanners: (settings.heroBanners && settings.heroBanners.length > 0) ? settings.heroBanners : [{
      id: 'legacy',
      image: settings.heroBannerImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
      titleHtml: settings.heroBannerTitleHtml || 'Caneca com<br/><span class="text-5xl italic font-serif mt-2 block">Foto e Música</span>',
      subtitle: settings.heroBannerSubtitle || 'O presente perfeito para transformar lembranças em emoção.',
      buttonText: settings.heroBannerButtonText || 'Peça a sua agora ♥',
      buttonColor: settings.heroBannerButtonColor || '#b44e68'
    }],
    
    promoBanner1TitleHtml: settings.promoBanner1TitleHtml || 'CANECAS COM SUA<br/>MÚSICA FAVORITA!',
    promoBanner1SubtitleHtml: settings.promoBanner1SubtitleHtml || 'Modelos prontos com código<br/>de música para adicionar.',
    promoBanner1ButtonText: settings.promoBanner1ButtonText || 'COMPRAR',
    promoBanner1ColorStart: settings.promoBanner1ColorStart || '#4a8bf5',
    promoBanner1ColorEnd: settings.promoBanner1ColorEnd || '#68abfa',
    
    promoBanner2TitleHtml: settings.promoBanner2TitleHtml || 'CANECAS COM SUA<br/>FOTO PREFERIDA!',
    promoBanner2SubtitleHtml: settings.promoBanner2SubtitleHtml || 'Modelos prontos com espaço<br/>para adicionar as fotos.',
    promoBanner2ButtonText: settings.promoBanner2ButtonText || 'COMPRAR',
    promoBanner2ColorStart: settings.promoBanner2ColorStart || '#b861ff',
    promoBanner2ColorEnd: settings.promoBanner2ColorEnd || '#c37aff',
    
    storeName: settings.storeName || 'inkys',
    productRating: settings.productRating || 5,
    productReviews: settings.productReviews || 5,
    pixDiscount: settings.pixDiscount !== undefined ? settings.pixDiscount : 0.10,
    installments: settings.installments || 2,
    
    customPageTitle: settings.customPageTitle,
    customPageDescription: settings.customPageDescription,
    customPageGuideText: settings.customPageGuideText,
    customPageGuideImage: settings.customPageGuideImage,
    customProducts: settings.customProducts,
  });

  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: settings.freeShippingThreshold,
    fixedShippingRates: settings.fixedShippingRates || { 'SP': 15.90, 'RJ': 20.00 }
  });

  const [storeFeatures, setStoreFeatures] = useState(settings.storeFeatures || []);
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    setPrimaryColor(settings.primaryColor);
    setLogoUrl(settings.logoUrl);
    setFaviconUrl(settings.faviconUrl || '');
    setWhatsappNumber(settings.whatsappNumber);
    setPaymentMethods(settings.paymentMethods);
    setStoreFeatures(settings.storeFeatures || []);
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height;
              height = maxHeight;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          let outputType = file.type;
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(outputType)) {
            outputType = 'image/png';
          }
          resolve(canvas.toDataURL(outputType, 0.85));
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSaveStoreDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const sanitizedWhatsapp = whatsappNumber?.replace(/\D/g, '') || '';
    updateSettings({ 
       logoUrl, 
       faviconUrl,
       storeName: storefrontSettings.storeName,
       whatsappNumber: sanitizedWhatsapp
    });
    showToast('Dados da loja salvos com sucesso!');
  };

  const handleSaveStorefront = () => {
    updateSettings(storefrontSettings);
    showToast('Aparência atualizada com sucesso!');
  };

  const handleSavePaymentMethods = () => {
    updateSettings({ paymentMethods, pixDiscount: storefrontSettings.pixDiscount, installments: storefrontSettings.installments });
    showToast('Métodos de pagamento atualizados com sucesso!');
  };

  const handleSaveShipping = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      freeShippingThreshold: shippingSettings.freeShippingThreshold,
      fixedShippingRates: shippingSettings.fixedShippingRates
    });
    showToast('Configurações de frete salvas!');
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    try { localStorage.setItem("inkys-admin-password", newPassword); } catch (e) {}
    setNewPassword('');
    showToast('Senha atualizada com sucesso!');
  };

  const handleSaveTheme = () => {
    document.documentElement.style.setProperty('--admin-primary-color', primaryColor);
    updateSettings({ primaryColor });
    showToast('Tema atualizado com sucesso!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full mx-auto animate-in fade-in duration-500">
      
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-2">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 px-2 text-gray-800">Configurações</h2>
        
        <button 
          onClick={() => setActiveTab('loja')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'loja' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Store size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Loja & Marca</span>
        </button>

        <button 
          onClick={() => setActiveTab('vitrine')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vitrine' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Layout size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Aparência</span>
        </button>

        <button 
          onClick={() => setActiveTab('pagamento')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'pagamento' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <CreditCard size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Pagamentos</span>
        </button>

        <button 
          onClick={() => setActiveTab('frete')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'frete' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Truck size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Frete</span>
        </button>

        <button 
          onClick={() => setActiveTab('seguranca')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'seguranca' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Shield size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Segurança</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-8 bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm min-h-[600px]">
        
        {activeTab === 'loja' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Loja & Marca</h3>
              <p className="text-gray-500 text-sm">Informações gerais, logotipo e contatos da sua loja.</p>
            </div>
            
            <form onSubmit={handleSaveStoreDetails} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nome da Loja</label>
                  <input 
                    type="text" 
                    value={storefrontSettings.storeName} 
                    onChange={e => setStorefrontSettings({...storefrontSettings, storeName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Logotipo</label>
                  <div className="flex items-center gap-4">
                    {logoUrl ? (
                      <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2">
                        <img src={logoUrl || undefined} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                        <Image size={24} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                        <Upload size={16} />
                        Escolher Imagem
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const res = await resizeImage(file, 800, 800);
                              setLogoUrl(res);
                            } catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }
                          }
                        }} />
                      </label>
                      <p className="text-xs text-gray-500">Recomendado: PNG transparente, 800x800px</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Favicon (Ícone da Aba)</label>
                  <div className="flex items-center gap-4">
                    {faviconUrl ? (
                      <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2">
                        <img src={faviconUrl || undefined} alt="Favicon" className="w-full h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                        <Image size={16} />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-200 transition-colors">
                        <Upload size={16} />
                        Escolher Favicon
                        <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const res = await resizeImage(file, 128, 128);
                              setFaviconUrl(res);
                            } catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }
                          }
                        }} />
                      </label>
                      <p className="text-xs text-gray-500">Recomendado: Ícone quadrado pequeno (PNG/ICO)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Número do WhatsApp</label>
                  <input 
                    type="text" 
                    value={whatsappNumber} 
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="Ex: 11999999999"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                </div>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
                <Save size={18} /> Salvar Dados da Loja
              </button>
            </form>

            <hr className="border-gray-100" />
            
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-900">Cor Principal do Admin</h4>
                <p className="text-xs text-gray-500">Altere a cor principal utilizada neste painel administrativo.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono"
                />
                <button onClick={handleSaveTheme} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-black transition-colors">
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitrine' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência da Vitrine</h3>
              <p className="text-gray-500 text-sm">Configure as cores e banners do seu site.</p>
            </div>
            

            <div className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700">Banners (Carrossel)</h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const newBanners = [...(storefrontSettings.heroBanners || [])];
                      newBanners.push({
                        id: Date.now().toString(),
                        image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
                        titleHtml: 'Novo Banner',
                        subtitle: 'Subtítulo',
                        buttonText: 'Comprar',
                        buttonColor: '#000000'
                      });
                      setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                    }}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center"
                  >
                    <Plus size={14} className="inline mr-1" /> Adicionar
                  </button>
                  <button 
                    onClick={handleSaveStorefront}
                    className="bg-[var(--color-primary)] hover:brightness-110 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase flex items-center transition-all"
                  >
                    <Save size={14} className="inline mr-1" /> Salvar Banners
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                {(storefrontSettings.heroBanners || []).map((banner, index) => (
                  <div key={banner.id || index} className="p-4 border border-gray-200 rounded-lg bg-white relative group">
                    <button 
                      onClick={() => {
                        const newBanners = [...storefrontSettings.heroBanners];
                        newBanners.splice(index, 1);
                        setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                      }}
                      className="absolute top-2 right-2 text-red-500 bg-red-50 hover:bg-red-100 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover Banner"
                    >
                      <Trash2 size={16} />
                    </button>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Imagem do Banner (Upload ou URL)</label>
                          <div className="relative aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={banner.image || undefined} alt="Banner Preview" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/40 md:opacity-0 md:hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                              <Upload size={24} className="opacity-70 md:opacity-100" />
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    
const res = await resizeImage(file, 2000, 1125);

                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index] = { ...newBanners[index], image: res };
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }
                                }
                              }} />
                            </label>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors">
                              <Image size={16} />
                              Buscar na Galeria
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const res = await resizeImage(file, 2000, 1125);

                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index] = { ...newBanners[index], image: res };
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }
                                }
                              }} />
                            </label>
                          </div>
                          
                          <input type="text" 
                            placeholder="Ou cole a URL da imagem aqui"
                            value={banner.image}
                            onChange={(e) => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index] = { ...newBanners[index], image: e.target.value };
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none mt-2"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (HTML)</label>
                          <input type="text" value={banner.titleHtml} onChange={e => {
                            const newBanners = [...storefrontSettings.heroBanners];
                            newBanners[index] = { ...newBanners[index], titleHtml: e.target.value };
                            setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                          }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                        <div className="grid grid-cols-3 gap-2 mt-2">                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor</label>                            <input type="color" value={banner.titleColor || '#e84e70'} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], titleColor: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full h-8 cursor-pointer border-0 p-0" />                          </div>                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Tamanho</label>                            <select value={banner.titleSize || 'text-3xl'} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], titleSize: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none">                              <option value="text-2xl">2xl</option>                              <option value="text-3xl">3xl</option>                              <option value="text-4xl">4xl</option>                              <option value="text-5xl">5xl</option>                              <option value="text-6xl">6xl</option>                            </select>                          </div>                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Fonte</label>                            <select value={banner.titleFont || 'font-sans'} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], titleFont: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none">                              <option value="font-sans">Inter (Padrão)</option>                              <option value="font-montserrat">Montserrat (Geométrica)</option>                              <option value="font-outfit">Outfit (Minimalista)</option>                              <option value="font-space">Space Grotesk (Tech)</option>                              <option value="font-playfair">Playfair Display (Serif Elegante)</option>                              <option value="font-cinzel">Cinzel (Luxuosa Real)</option>                              <option value="font-lora">Lora (Editorial)</option>                              <option value="font-serif">Serif Clássica</option>                              <option value="font-mono">Monospace Tech</option>                              <option value="font-script">Dancing Cursiva</option>                              <option value="font-pacifico">Pacifico Retrô</option>                            </select>                          </div>                        </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo</label>
                          <input type="text" value={banner.subtitle} onChange={e => {
                            const newBanners = [...storefrontSettings.heroBanners];
                            newBanners[index] = { ...newBanners[index], subtitle: e.target.value };
                            setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                          }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                        <div className="grid grid-cols-3 gap-2 mt-2">                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor</label>                            <input type="color" value={banner.subtitleColor || '#592c60'} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], subtitleColor: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full h-8 cursor-pointer border-0 p-0" />                          </div>                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Tamanho</label>                            <select value={banner.subtitleSize || 'text-xl'} disabled={banner.subtitleSameSize} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], subtitleSize: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none disabled:opacity-50">                              <option value="text-sm">Pequeno</option>                              <option value="text-base">Médio</option>                              <option value="text-lg">Grande (lg)</option>                              <option value="text-xl">Extra (xl)</option>                              <option value="text-2xl">2xl</option>                              <option value="text-3xl">3xl</option>                              <option value="text-4xl">4xl</option>                              <option value="text-5xl">5xl</option>                              <option value="text-6xl">6xl</option>                            </select>                          </div>                          <div className="space-y-1">                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Fonte</label>                            <select value={banner.subtitleFont || 'font-sans'} onChange={e => {                              const newBanners = [...storefrontSettings.heroBanners];                              newBanners[index] = { ...newBanners[index], subtitleFont: e.target.value };                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});                            }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none">                              <option value="font-sans">Inter (Padrão)</option>                              <option value="font-montserrat">Montserrat (Geométrica)</option>                              <option value="font-outfit">Outfit (Minimalista)</option>                              <option value="font-space">Space Grotesk (Tech)</option>                              <option value="font-playfair">Playfair Display (Serif Elegante)</option>                              <option value="font-cinzel">Cinzel (Luxuosa Real)</option>                              <option value="font-lora">Lora (Editorial)</option>                              <option value="font-serif">Serif Clássica</option>                              <option value="font-mono">Monospace Tech</option>                              <option value="font-script">Dancing Cursiva</option>                              <option value="font-pacifico">Pacifico Retrô</option>                            </select>                          </div>                        </div>
                          <div className="flex items-center gap-2 mt-2 ml-1">
                            <input 
                              type="checkbox" 
                              id={`subtitle-same-size-${banner.id || index}`}
                              checked={banner.subtitleSameSize || false} 
                              onChange={e => {
                                const newBanners = [...storefrontSettings.heroBanners];
                                newBanners[index] = { ...newBanners[index], subtitleSameSize: e.target.checked };
                                setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                              }}
                              className="rounded text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                            />
                            <label htmlFor={`subtitle-same-size-${banner.id || index}`} className="text-xs text-gray-600 font-medium cursor-pointer">
                              Subtítulo no mesmo tamanho do título
                            </label>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <div className="space-y-1 flex-1">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Texto Botão</label>
                            <input type="text" value={banner.buttonText} onChange={e => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index] = { ...newBanners[index], buttonText: e.target.value };
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                          </div>
                          <div className="space-y-1 w-1/3">
                            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Botão</label>
                            <input type="color" value={banner.buttonColor} onChange={e => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index] = { ...newBanners[index], buttonColor: e.target.value };
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }} className="w-full h-9 cursor-pointer border-0 p-0" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Link do Botão (Ex: #category-all ou link externo)</label>
                          <input 
                            type="text" 
                            placeholder="Ex: #category-all ou https://..."
                            value={banner.buttonLink || ''} 
                            onChange={e => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index] = { ...newBanners[index], buttonLink: e.target.value };
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }} 
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-xl bg-gray-50/50">
              <h4 className="col-span-full text-sm font-bold uppercase tracking-widest text-gray-700">Cores Globais do Site</h4>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor da Barra de Topo</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.topBarColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, topBarColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.topBarColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, topBarColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Cabeçalho</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.headerColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.headerColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Texto do Cabeçalho</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.headerTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerTextColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.headerTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerTextColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor de Fundo do Site</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.siteBackgroundColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, siteBackgroundColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.siteBackgroundColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, siteBackgroundColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Fundo do Menu (Categorias)</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.navBarColor !== 'transparent' ? storefrontSettings.navBarColor : '#ffffff'} onChange={(e) => setStorefrontSettings({...storefrontSettings, navBarColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.navBarColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, navBarColor: e.target.value})} placeholder="Ex: #facc15 ou transparent" className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Texto do Menu (Categorias)</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.navBarTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, navBarTextColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.navBarTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, navBarTextColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Botão Comprar</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.buyButtonColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, buyButtonColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.buyButtonColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, buyButtonColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 space-y-4">
              <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700">Avaliações Simuladas (Mock)</h4>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Estrelas (1 a 5)</label>
                  <input type="number" step="0.1" min="1" max="5" value={storefrontSettings.productRating} onChange={(e) => setStorefrontSettings({...storefrontSettings, productRating: parseFloat(e.target.value) || 5})} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Quantidade de Avaliações</label>
                  <input type="number" step="1" min="0" value={storefrontSettings.productReviews} onChange={(e) => setStorefrontSettings({...storefrontSettings, productReviews: parseInt(e.target.value) || 0})} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
              </div>
            </div>

            <button onClick={handleSaveStorefront} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
              <Save size={18} /> Salvar Aparência
            </button>
          </div>
        )}

        {activeTab === 'pagamento' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Pagamentos</h3>
              <p className="text-gray-500 text-sm">Gerencie as formas de pagamento disponíveis.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <PaymentToggle icon={Banknote} title="Pix" active={paymentMethods.pix} onToggle={() => setPaymentMethods(p => ({...p, pix: !p.pix}))} />
              <PaymentToggle icon={CreditCard} title="Cartão de Crédito" active={paymentMethods.credit} onToggle={() => setPaymentMethods(p => ({...p, credit: !p.credit}))} />
              <PaymentToggle icon={CreditCard} title="Cartão de Débito" active={paymentMethods.debit} onToggle={() => setPaymentMethods(p => ({...p, debit: !p.debit}))} />
              <PaymentToggle icon={Banknote} title="Boleto Bancário" active={paymentMethods.boleto} onToggle={() => setPaymentMethods(p => ({...p, boleto: !p.boleto}))} />
            </div>

            <div className="grid sm:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-xl bg-gray-50/50">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Desconto no Pix (%)</label>
                <input type="number" step="0.01" min="0" value={storefrontSettings.pixDiscount} onChange={(e) => setStorefrontSettings({...storefrontSettings, pixDiscount: parseFloat(e.target.value) || 0})} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Parcelas s/ Juros (Max)</label>
                <input type="number" step="1" min="1" value={storefrontSettings.installments} onChange={(e) => setStorefrontSettings({...storefrontSettings, installments: parseInt(e.target.value) || 1})} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
              </div>
            </div>

            <button onClick={handleSavePaymentMethods} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
              <Save size={18} /> Salvar Pagamentos
            </button>
          </div>
        )}

        {activeTab === 'frete' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Frete & Entrega</h3>
              <p className="text-gray-500 text-sm">Configure os limites e preços de entrega.</p>
            </div>
            
            <form onSubmit={handleSaveShipping} className="space-y-6">
              <div className="space-y-4 max-w-sm">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Valor para Frete Grátis (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={shippingSettings.freeShippingThreshold || ''} 
                    onChange={e => setShippingSettings({...shippingSettings, freeShippingThreshold: parseFloat(e.target.value) || 0})}
                    placeholder="Ex: 199.90"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                  <p className="text-[10px] text-gray-400 ml-1">Deixe 0 para desativar o frete grátis.</p>
                </div>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
                <Save size={18} /> Salvar Regras de Frete
              </button>
            </form>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Segurança</h3>
              <p className="text-gray-500 text-sm">Altere a senha de acesso ao painel de administração.</p>
            </div>
            
            <form onSubmit={handleSavePassword} className="space-y-4 max-w-sm">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nova Senha</label>
                <input 
                  type="password" 
                  required
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-[var(--color-primary)] text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
                <Shield size={18} /> Atualizar Senha
              </button>
            </form>
          </div>
        )}

      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${
            toastMessage.type === 'success' 
              ? 'bg-white border-green-100 text-green-800' 
              : 'bg-white border-red-100 text-red-800'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              toastMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {toastMessage.type === 'success' ? (
                <Save size={16} className="text-green-600" />
              ) : (
                <div className="text-red-600 font-bold">!</div>
              )}
            </div>
            <span className="font-medium">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentToggle({ icon: Icon, title, active, onToggle }: { icon: any, title: string, active: boolean, onToggle: () => void }) {
  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
      active ? 'bg-gray-50 border-[var(--color-primary)]' : 'bg-transparent border-gray-200 hover:border-gray-300'
    }`} onClick={onToggle}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-gray-50 text-gray-400'}`}>
          <Icon size={20} />
        </div>
        <span className={`font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
      </div>
      
      {/* Custom Switch */}
      <div className={`w-10 h-5 rounded-full relative transition-colors ${active ? 'bg-[var(--color-primary)]' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-[22px]' : 'left-[2px]'}`} />
      </div>
    </div>
  );
}
