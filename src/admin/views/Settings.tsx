import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Banknote, Save, MessageCircle } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export function AdminSettings() {
  const { settings, updateSettings } = useSettings();

  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [newPassword, setNewPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [logoMessage, setLogoMessage] = useState('');
  
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [whatsappMessage, setWhatsappMessage] = useState('');

  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods);

  const [storefrontSettings, setStorefrontSettings] = useState({
    topBarColor: settings.topBarColor || '#d64c71',
    headerColor: settings.headerColor || '#8b3887',
    heroBannerImage: settings.heroBannerImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
    heroBannerTitleHtml: settings.heroBannerTitleHtml || 'Caneca com<br/><span class="text-5xl italic font-serif mt-2 block">Foto e Música</span>',
    heroBannerSubtitle: settings.heroBannerSubtitle || 'O presente perfeito para transformar lembranças em emoção.',
    heroBannerButtonText: settings.heroBannerButtonText || 'Peça a sua agora ♥',
    heroBannerButtonColor: settings.heroBannerButtonColor || '#b44e68',
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
    buyButtonColor: settings.buyButtonColor || '#5ba324',
    storeName: settings.storeName || 'Amo Canecas',
    productRating: settings.productRating || 5,
    productReviews: settings.productReviews || 5,
    pixDiscount: settings.pixDiscount !== undefined ? settings.pixDiscount : 0.10,
    installments: settings.installments || 2,
  });
  
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setPrimaryColor(settings.primaryColor);
    setLogoUrl(settings.logoUrl);
    setWhatsappNumber(settings.whatsappNumber);
    setPaymentMethods(settings.paymentMethods);
    setStorefrontSettings({
      topBarColor: settings.topBarColor || '#d64c71',
      headerColor: settings.headerColor || '#8b3887',
      heroBannerImage: settings.heroBannerImage || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
      heroBannerTitleHtml: settings.heroBannerTitleHtml || 'Caneca com<br/><span class="text-5xl italic font-serif mt-2 block">Foto e Música</span>',
      heroBannerSubtitle: settings.heroBannerSubtitle || 'O presente perfeito para transformar lembranças em emoção.',
      heroBannerButtonText: settings.heroBannerButtonText || 'Peça a sua agora ♥',
      heroBannerButtonColor: settings.heroBannerButtonColor || '#b44e68',
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
      buyButtonColor: settings.buyButtonColor || '#5ba324',
      storeName: settings.storeName || 'Amo Canecas',
      productRating: settings.productRating || 5,
      productReviews: settings.productReviews || 5,
      pixDiscount: settings.pixDiscount !== undefined ? settings.pixDiscount : 0.10,
      installments: settings.installments || 2,
    });
  }, [settings]);

  const handleSaveStorefront = () => {
    updateSettings(storefrontSettings);
    showToast('Aparência atualizada com sucesso!');
  };

  const handleSaveColor = () => {
    document.documentElement.style.setProperty('--admin-primary-color', primaryColor);
    updateSettings({ primaryColor });
    showToast('Tema atualizado com sucesso!');
  };

  const handleSaveLogo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ logoUrl });
    showToast('Logo atualizado com sucesso!');
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoUrl(result);
        updateSettings({ logoUrl: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleHeroBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setStorefrontSettings({ ...storefrontSettings, heroBannerImage: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error');
      return;
    }
    localStorage.setItem('inkys-admin-password', newPassword);
    setNewPassword('');
    showToast('Senha atualizada com sucesso!');
  };
  
  const handleSaveWhatsapp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatsappNumber) {
      showToast('Por favor, informe um número válido.', 'error');
      return;
    }
    const sanitized = whatsappNumber.replace(/\D/g, '');
    updateSettings({ whatsappNumber: sanitized });
    showToast('Número atualizado com sucesso!');
  };

  const handleSavePaymentMethods = () => {
    updateSettings({ paymentMethods });
    showToast('Métodos de pagamento atualizados com sucesso!');
  };

  useEffect(() => {
    const savedColor = localStorage.getItem('inkys-admin-primary-color');
    if (savedColor) {
      setPrimaryColor(savedColor);
    }
    const savedLogo = localStorage.getItem('inkys-logo-url');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
    const savedWhatsapp = localStorage.getItem('inkys-whatsapp-number');
    if (savedWhatsapp) {
      setWhatsappNumber(savedWhatsapp);
    } else {
      setWhatsappNumber('5561991365428');
    }
  }, []);

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-2xl font-bold uppercase tracking-widest">Configurações</h2>

      {/* Theme Customization */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Logotipo da Loja</h3>
          <p className="text-gray-500 text-sm">Personalize a logo que aparecerá na loja e no painel.</p>
        </div>

        <form onSubmit={handleSaveLogo} className="space-y-4">
          
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">URL da Imagem</label>
                <input
                  type="text"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
                  placeholder="https://..."
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Ou faça upload da galeria</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                />
              </div>
            </div>
            
            <div className="w-32 h-32 flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
              ) : (
                <div className="w-10 h-10 ink-gradient rounded-full"></div>
              )}
            </div>
          </div>
          
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Save size={18} /> Salvar Logo
          </button>
        </form>
      </div>

      {/* Theme Customization */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência do Painel</h3>
          <p className="text-gray-500 text-sm">Personalize a cor principal de destaque do sistema.</p>
        </div>

        <div className="flex items-center gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div>
            <input 
              type="color" 
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-16 h-16 rounded cursor-pointer bg-transparent border-none appearance-none p-0"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cor Hexadecimal</label>
            <div className="flex items-center gap-3">
              <input 
                type="text" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-32 bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none font-mono text-gray-900"
              />
              <button 
                onClick={handleSaveColor}
                className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all"
              >
                <Save size={16} /> Aplicar Cor
              </button>
            </div>
          </div>
          <div className="w-32 h-20 rounded-xl bg-white shadow-sm" style={{ border: `1px solid ${primaryColor}80` }}>
            <div className="p-3">
              <div className="w-1/2 h-2 rounded-full mb-2" style={{ backgroundColor: primaryColor }} />
              <div className="w-3/4 h-2 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Métodos de Pagamento</h3>
          <p className="text-gray-500 text-sm">Ative ou desative as formas de pagamento disponíveis na loja.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <PaymentToggle
            icon={Smartphone}
            title="Pix"
            active={paymentMethods.pix}
            onToggle={() => setPaymentMethods(p => ({...p, pix: !p.pix}))}
          />
          <PaymentToggle
            icon={CreditCard}
            title="Cartão de Crédito"
            active={paymentMethods.credit}
            onToggle={() => setPaymentMethods(p => ({...p, credit: !p.credit}))}
          />
          <PaymentToggle
            icon={CreditCard}
            title="Cartão de Débito"
            active={paymentMethods.debit}
            onToggle={() => setPaymentMethods(p => ({...p, debit: !p.debit}))}
          />
          <PaymentToggle
            icon={Banknote}
            title="Boleto Bancário"
            active={paymentMethods.boleto}
            onToggle={() => setPaymentMethods(p => ({...p, boleto: !p.boleto}))}
          />
        </div>

        <div className="mt-8 p-4 rounded-xl border border-green-200 bg-green-50 flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-medium text-green-900">Gateway de Pagamento Online</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-green-700 bg-green-100 px-2 py-1 rounded">Ativo</span>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={handleSavePaymentMethods}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-6 py-2 rounded-lg font-bold text-sm hover:brightness-110 transition-all"
          >
            <Save size={16} /> Salvar Métodos
          </button>
        </div>
      </div>

      {/* Storefront Customization */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência da Loja</h3>
          <p className="text-gray-500 text-sm">Personalize cores e banners da página inicial da loja.</p>
        </div>

        <div className="space-y-6">
          
          <div className="grid sm:grid-cols-2 gap-6 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <h4 className="col-span-full text-sm font-bold uppercase tracking-widest text-gray-700">Cores Globais</h4>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Topo / Acentos</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={storefrontSettings.topBarColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, topBarColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={storefrontSettings.topBarColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, topBarColor: e.target.value})}
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Cabeçalho</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={storefrontSettings.headerColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, headerColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={storefrontSettings.headerColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, headerColor: e.target.value})}
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
            <div className="space-y-1 col-span-full">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Botão Comprar</label>
              <div className="flex items-center gap-3 w-1/2">
                <input
                  type="color"
                  value={storefrontSettings.buyButtonColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, buyButtonColor: e.target.value})}
                  className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                />
                <input
                  type="text"
                  value={storefrontSettings.buyButtonColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, buyButtonColor: e.target.value})}
                  className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700">Banner Principal</h4>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Imagem de Fundo (URL)</label>
              <input
                type="text"
                value={storefrontSettings.heroBannerImage}
                onChange={(e) => setStorefrontSettings({...storefrontSettings, heroBannerImage: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Ou faça upload da galeria</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroBannerUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (suporta HTML)</label>
              <input
                type="text"
                value={storefrontSettings.heroBannerTitleHtml}
                onChange={(e) => setStorefrontSettings({...storefrontSettings, heroBannerTitleHtml: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo</label>
              <input
                type="text"
                value={storefrontSettings.heroBannerSubtitle}
                onChange={(e) => setStorefrontSettings({...storefrontSettings, heroBannerSubtitle: e.target.value})}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Texto do Botão</label>
                <input
                  type="text"
                  value={storefrontSettings.heroBannerButtonText}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, heroBannerButtonText: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Botão</label>
                <input
                  type="color"
                  value={storefrontSettings.heroBannerButtonColor}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, heroBannerButtonColor: e.target.value})}
                  className="w-full h-12 rounded-lg cursor-pointer border-0 p-0"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700">Banners Promocionais</h4>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Promo Banner 1 */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">Banner Esquerdo</h5>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (HTML)</label>
                  <input type="text" value={storefrontSettings.promoBanner1TitleHtml} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner1TitleHtml: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo (HTML)</label>
                  <input type="text" value={storefrontSettings.promoBanner1SubtitleHtml} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner1SubtitleHtml: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Botão</label>
                  <input type="text" value={storefrontSettings.promoBanner1ButtonText} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner1ButtonText: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Início</label>
                    <input type="color" value={storefrontSettings.promoBanner1ColorStart} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner1ColorStart: e.target.value})} className="w-full h-8 cursor-pointer border-0 p-0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Fim</label>
                    <input type="color" value={storefrontSettings.promoBanner1ColorEnd} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner1ColorEnd: e.target.value})} className="w-full h-8 cursor-pointer border-0 p-0" />
                  </div>
                </div>
              </div>

              {/* Promo Banner 2 */}
              <div className="space-y-4">
                <h5 className="text-xs font-bold uppercase text-gray-600 border-b border-gray-200 pb-2">Banner Direito</h5>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (HTML)</label>
                  <input type="text" value={storefrontSettings.promoBanner2TitleHtml} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner2TitleHtml: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo (HTML)</label>
                  <input type="text" value={storefrontSettings.promoBanner2SubtitleHtml} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner2SubtitleHtml: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Botão</label>
                  <input type="text" value={storefrontSettings.promoBanner2ButtonText} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner2ButtonText: e.target.value})} className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Início</label>
                    <input type="color" value={storefrontSettings.promoBanner2ColorStart} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner2ColorStart: e.target.value})} className="w-full h-8 cursor-pointer border-0 p-0" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Fim</label>
                    <input type="color" value={storefrontSettings.promoBanner2ColorEnd} onChange={e => setStorefrontSettings({...storefrontSettings, promoBanner2ColorEnd: e.target.value})} className="w-full h-8 cursor-pointer border-0 p-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 border border-gray-100 rounded-xl bg-gray-50">
            <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700">Dados da Loja e Produtos</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nome da Loja</label>
                <input
                  type="text"
                  value={storefrontSettings.storeName || ""}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, storeName: e.target.value})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Desconto no PIX (Decimal, ex: 0.10 para 10%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={storefrontSettings.pixDiscount}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, pixDiscount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Número de Parcelas (Sem Juros)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={storefrontSettings.installments}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, installments: parseInt(e.target.value) || 1})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Estrelas (Avaliação Mock)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="5"
                  value={storefrontSettings.productRating}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, productRating: parseInt(e.target.value) || 5})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Número de Avaliações (Mock)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={storefrontSettings.productReviews}
                  onChange={(e) => setStorefrontSettings({...storefrontSettings, productReviews: parseInt(e.target.value) || 0})}
                  className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleSaveStorefront}
            className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Save size={18} /> Salvar Aparência
          </button>
        </div>
      </div>

      {/* WhatsApp Configuration */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Integração WhatsApp</h3>
          <p className="text-gray-500 text-sm">Configure o número que receberá os pedidos do catálogo.</p>
        </div>

        <form onSubmit={handleSaveWhatsapp} className="space-y-4 max-w-sm">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Número do WhatsApp (com DDD)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-green-500">
                <MessageCircle size={18} />
              </div>
              <input
                type="text"
                required
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
                placeholder="Ex: 5561991365428"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-green-500 text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-green-600 transition-all"
          >
            <Save size={18} /> Salvar Número
          </button>
        </form>
      </div>

      {/* Password Management */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Segurança da Conta</h3>
          <p className="text-gray-500 text-sm">Altere a senha de acesso ao painel administrativo.</p>
        </div>

        <form onSubmit={handleSavePassword} className="space-y-4 max-w-sm">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nova Senha</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
              placeholder="Digite a nova senha"
            />
          </div>
          <button 
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-[var(--color-primary)] text-white px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all"
          >
            <Save size={18} /> Salvar Nova Senha
          </button>
        </form>
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
