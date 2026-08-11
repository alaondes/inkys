import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { CreditCard, Smartphone, Banknote, Save, MessageCircle, Plus, Trash2, Upload, Layout, Palette, Store, Truck, Shield, ShoppingCart, Image, Settings as SettingsIcon, Link, Sparkles, Type, Calculator, Percent, DollarSign, HelpCircle, CheckCircle2, TrendingUp, Package, Receipt, Building2, Zap, Home, Users, PieChart, Megaphone, Laptop } from 'lucide-react';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { useSettings } from '../../context/SettingsContext';
import { useProducts } from '../../context/ProductContext';
import { BannersTab } from '../components/BannersTab';
import { calculateSuggestedPrice, defaultPricingRules, PricingRulesConfig } from '../../lib/pricingUtils';

import { storage } from '../../lib/firebase';


export function AdminSettings() {
  const { settings, updateSettings } = useSettings();
  const { products, setProducts } = useProducts();
  const [activeTab, setActiveTab] = useState('loja');
  
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [newPassword, setNewPassword] = useState('');

  const [pricingRules, setPricingRules] = useState<PricingRulesConfig>({
    taxRatePct: settings.pricingRules?.taxRatePct ?? 6,
    gatewayFeePct: settings.pricingRules?.gatewayFeePct ?? 4,
    fixedCostPct: settings.pricingRules?.fixedCostPct ?? 10,
    desiredProfitPct: settings.pricingRules?.desiredProfitPct ?? 20,
    commissionPct: settings.pricingRules?.commissionPct ?? 0,
    defaultPackagingCost: settings.pricingRules?.defaultPackagingCost ?? 2.00,
    defaultShippingInCost: settings.pricingRules?.defaultShippingInCost ?? 0.00,
    useCalculatedFixedCost: settings.pricingRules?.useCalculatedFixedCost ?? false,
    rentCostMonthly: settings.pricingRules?.rentCostMonthly ?? 1200,
    utilitiesCostMonthly: settings.pricingRules?.utilitiesCostMonthly ?? 400,
    salariesCostMonthly: settings.pricingRules?.salariesCostMonthly ?? 3000,
    marketingCostMonthly: settings.pricingRules?.marketingCostMonthly ?? 500,
    softwareAccountingCostMonthly: settings.pricingRules?.softwareAccountingCostMonthly ?? 300,
    otherFixedCostsMonthly: settings.pricingRules?.otherFixedCostsMonthly ?? 100,
    estimatedMonthlyRevenue: settings.pricingRules?.estimatedMonthlyRevenue ?? 50000,
  });
  const [simCost, setSimCost] = useState<number>(20);
  
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl);
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || '');
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber);
  const [adminEmail, setAdminEmail] = useState(settings.adminEmail || '');
  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods);
  
  const [footerSettings, setFooterSettings] = useState({
    footerBgColor: settings.footerBgColor || '#111827',
    footerTextColor: settings.footerTextColor || '#9ca3af',
    footerHeadingColor: settings.footerHeadingColor || '#ffffff',
    footerLogoUrl: settings.footerLogoUrl || '',
    footerDescription: settings.footerDescription || 'Especializados em produtos criativos e personalizados. Transforme suas ideias em presentes inesquecíveis.',
  });
  
  const [storefrontSettings, setStorefrontSettings] = useState({
    topBarColor: settings.topBarColor || '#d64c71',
    headerColor: settings.headerColor || '#8b3887',
    headerTextColor: settings.headerTextColor || '#ffffff',
    headerHoverTextColor: settings.headerHoverTextColor || '#ffffff',
    adminButtonBgColor: settings.adminButtonBgColor || 'rgba(255, 255, 255, 0.15)',
    adminButtonTextColor: settings.adminButtonTextColor || '#ffffff',
    adminButtonBgColorHover: settings.adminButtonBgColorHover || 'rgba(255, 255, 255, 0.25)',
    navBarColor: settings.navBarColor || 'transparent',
    navBarTextColor: settings.navBarTextColor || '#000000',
    siteBackgroundColor: settings.siteBackgroundColor || '#f9fafb',
    customButtonBgColor: settings.customButtonBgColor || '#facc15',
    customButtonTextColor: settings.customButtonTextColor || '#713f12',
    buyButtonColor: settings.buyButtonColor || '#5ba324',
    showClearCartButton: settings.showClearCartButton ?? true,
    
    productBanners: settings.productBanners || [],
    heroBanners: settings.heroBanners || [],
    
    promoBanner1TitleHtml: settings.promoBanner1TitleHtml ?? '',
    promoBanner1SubtitleHtml: settings.promoBanner1SubtitleHtml ?? '',
    promoBanner1ButtonText: settings.promoBanner1ButtonText ?? 'COMPRAR',
    promoBanner1ColorStart: settings.promoBanner1ColorStart ?? '#4a8bf5',
    promoBanner1ColorEnd: settings.promoBanner1ColorEnd ?? '#68abfa',
    promoBanner1Link: settings.promoBanner1Link ?? '?category=Música',
    
    promoBanner2TitleHtml: settings.promoBanner2TitleHtml ?? '',
    promoBanner2SubtitleHtml: settings.promoBanner2SubtitleHtml ?? '',
    promoBanner2ButtonText: settings.promoBanner2ButtonText ?? 'COMPRAR',
    promoBanner2ColorStart: settings.promoBanner2ColorStart ?? '#b861ff',
    promoBanner2ColorEnd: settings.promoBanner2ColorEnd ?? '#c37aff',
    promoBanner2Link: settings.promoBanner2Link ?? '?category=Canecas',
    
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
    setStorefrontSettings(prev => ({
      ...prev,
      topBarColor: settings.topBarColor || prev.topBarColor,
      headerColor: settings.headerColor || prev.headerColor,
      headerTextColor: settings.headerTextColor || prev.headerTextColor,
      headerHoverTextColor: settings.headerHoverTextColor || prev.headerHoverTextColor,
      adminButtonBgColor: settings.adminButtonBgColor || prev.adminButtonBgColor,
      adminButtonTextColor: settings.adminButtonTextColor || prev.adminButtonTextColor,
      adminButtonBgColorHover: settings.adminButtonBgColorHover || prev.adminButtonBgColorHover,
      navBarColor: settings.navBarColor || prev.navBarColor,
      navBarTextColor: settings.navBarTextColor || prev.navBarTextColor,
      siteBackgroundColor: settings.siteBackgroundColor || prev.siteBackgroundColor,
      customButtonBgColor: settings.customButtonBgColor || prev.customButtonBgColor,
      customButtonTextColor: settings.customButtonTextColor || prev.customButtonTextColor,
      buyButtonColor: settings.buyButtonColor || prev.buyButtonColor,
      showClearCartButton: settings.showClearCartButton ?? prev.showClearCartButton,
      productBanners: settings.productBanners || prev.productBanners,
      heroBanners: settings.heroBanners || prev.heroBanners,
      promoBanner1TitleHtml: settings.promoBanner1TitleHtml ?? prev.promoBanner1TitleHtml,
      promoBanner1SubtitleHtml: settings.promoBanner1SubtitleHtml ?? prev.promoBanner1SubtitleHtml,
      promoBanner1ButtonText: settings.promoBanner1ButtonText ?? prev.promoBanner1ButtonText,
      promoBanner1ColorStart: settings.promoBanner1ColorStart ?? prev.promoBanner1ColorStart,
      promoBanner1ColorEnd: settings.promoBanner1ColorEnd ?? prev.promoBanner1ColorEnd,
      promoBanner1Link: settings.promoBanner1Link ?? prev.promoBanner1Link,
      promoBanner2TitleHtml: settings.promoBanner2TitleHtml ?? prev.promoBanner2TitleHtml,
      promoBanner2SubtitleHtml: settings.promoBanner2SubtitleHtml ?? prev.promoBanner2SubtitleHtml,
      promoBanner2ButtonText: settings.promoBanner2ButtonText ?? prev.promoBanner2ButtonText,
      promoBanner2ColorStart: settings.promoBanner2ColorStart ?? prev.promoBanner2ColorStart,
      promoBanner2ColorEnd: settings.promoBanner2ColorEnd ?? prev.promoBanner2ColorEnd,
      promoBanner2Link: settings.promoBanner2Link ?? prev.promoBanner2Link,
      storeName: settings.storeName || prev.storeName,
      productRating: settings.productRating || prev.productRating,
      productReviews: settings.productReviews || prev.productReviews,
      pixDiscount: settings.pixDiscount !== undefined ? settings.pixDiscount : prev.pixDiscount,
      installments: settings.installments || prev.installments,
      customPageTitle: settings.customPageTitle ?? prev.customPageTitle,
      customPageDescription: settings.customPageDescription ?? prev.customPageDescription,
      customPageGuideText: settings.customPageGuideText ?? prev.customPageGuideText,
      customPageGuideImage: settings.customPageGuideImage ?? prev.customPageGuideImage,
      customProducts: settings.customProducts ?? prev.customProducts,
    }));
    if (settings.pricingRules) {
      setPricingRules({
        taxRatePct: settings.pricingRules.taxRatePct ?? 6,
        gatewayFeePct: settings.pricingRules.gatewayFeePct ?? 4,
        fixedCostPct: settings.pricingRules.fixedCostPct ?? 10,
        desiredProfitPct: settings.pricingRules.desiredProfitPct ?? 20,
        commissionPct: settings.pricingRules.commissionPct ?? 0,
        defaultPackagingCost: settings.pricingRules.defaultPackagingCost ?? 2.00,
        defaultShippingInCost: settings.pricingRules.defaultShippingInCost ?? 0.00,
        useCalculatedFixedCost: true,
        rentCostMonthly: settings.pricingRules.rentCostMonthly ?? 1200,
        utilitiesCostMonthly: settings.pricingRules.utilitiesCostMonthly ?? 400,
        salariesCostMonthly: settings.pricingRules.salariesCostMonthly ?? 3000,
        marketingCostMonthly: settings.pricingRules.marketingCostMonthly ?? 500,
        softwareAccountingCostMonthly: settings.pricingRules.softwareAccountingCostMonthly ?? 300,
        otherFixedCostsMonthly: settings.pricingRules.otherFixedCostsMonthly ?? 100,
        estimatedMonthlyRevenue: settings.pricingRules.estimatedMonthlyRevenue ?? 50000,
      });
    }
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
          resolve(canvas.toDataURL('image/webp', 0.7));
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
       whatsappNumber: sanitizedWhatsapp,
       adminEmail
    });
    showToast('Dados da loja salvos com sucesso!');
  };

  const handleSaveStorefront = () => {
    updateSettings({
      ...storefrontSettings,
      storeFeatures: storeFeatures
    });
    showToast('Aparência atualizada com sucesso!');
  };

  const handleSaveFooter = () => {
    updateSettings(footerSettings);
    showToast('Rodapé atualizado com sucesso!');
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

  const applyPricingRulesToAllProductsAutomatically = async (rules: PricingRulesConfig) => {
    if (!products || products.length === 0) return 0;
    let updatedCount = 0;
    const updatedProducts = products.map(p => {
      if (p.costPrice !== undefined && p.costPrice > 0) {
        const calc = calculateSuggestedPrice(p.costPrice, rules, p.packagingCost);
        if (calc.suggestedPrice > 0) {
          const newPrice = Math.round(calc.suggestedPrice * 100) / 100;
          if (newPrice !== p.price) {
            updatedCount++;
            return {
              ...p,
              price: newPrice
            };
          }
        }
      }
      return p;
    });

    if (updatedCount > 0) {
      await setProducts(updatedProducts);
    }
    return updatedCount;
  };

  const handlePricingRuleChange = async (field: keyof PricingRulesConfig, value: number) => {
    const updated = {
      ...pricingRules,
      [field]: value,
      useCalculatedFixedCost: true
    };
    setPricingRules(updated);
    updateSettings({ pricingRules: updated });
    applyPricingRulesToAllProductsAutomatically(updated).catch(console.error);
  };

  const handleSavePricingRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated = { ...pricingRules, useCalculatedFixedCost: true };
    const loadToast = toast.loading('Salvando regras e recalculando preços de todos os produtos...');
    try {
      await updateSettings({ pricingRules: updated });
      const count = await applyPricingRulesToAllProductsAutomatically(updated);
      toast.success(
        count > 0 
          ? `Regras salvas e preços de ${count} produtos atualizados automaticamente!` 
          : 'Regras de precificação salvas com sucesso!', 
        { id: loadToast }
      );
      showToast('Despesas fixas e regras salvas com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar no banco.', { id: loadToast });
    }
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
          onClick={() => setActiveTab('precificacao')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'precificacao' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Calculator size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Precificação Fixa</span>
        </button>

        <button 
          onClick={() => setActiveTab('vitrine')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'vitrine' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Layout size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Aparência</span>
        </button>

        <button 
          onClick={() => setActiveTab('banners')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'banners' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Image size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Banners (Carrossel)</span>
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

        <button 
          onClick={() => setActiveTab('footer')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'footer' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          <Layout size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Rodapé</span>
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
                        <img src={logoUrl || undefined} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                        <Image size={24} />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <label className="flex items-center justify-center gap-2 w-full bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-200 transition-colors">
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
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link size={14} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Ou cole a URL..."
                          value={logoUrl?.startsWith('data:') ? '' : logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">Recomendado: PNG transparente, 800x800px</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Favicon (Ícone da Aba)</label>
                  <div className="flex items-center gap-4">
                    {faviconUrl ? (
                      <div className="w-12 h-12 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2">
                        <img src={faviconUrl || undefined} alt="Favicon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                        <Image size={16} />
                      </div>
                    )}
                    <div className="flex-1 space-y-3">
                      <label className="flex items-center justify-center gap-2 w-full bg-gray-100 px-4 py-2 rounded-lg font-medium text-sm cursor-pointer hover:bg-gray-200 transition-colors">
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
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Link size={14} className="text-gray-400" />
                        </div>
                        <input
                          type="text"
                          placeholder="Ou cole a URL..."
                          value={faviconUrl?.startsWith('data:') ? '' : faviconUrl}
                          onChange={(e) => setFaviconUrl(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center">Recomendado: Ícone quadrado pequeno (PNG/ICO)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">E-mail para Receber Pedidos</label>
                  <input 
                    type="email" 
                    value={adminEmail} 
                    onChange={e => setAdminEmail(e.target.value)}
                    placeholder="Ex: seuemail@gmail.com"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                  />
                  <p className="text-xs text-gray-400 ml-1">E-mail que receberá a cópia dos pedidos efetuados.</p>
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

        {activeTab === 'banners' && (
          <BannersTab
            storefrontSettings={storefrontSettings}
            setStorefrontSettings={setStorefrontSettings}
            handleSaveStorefront={handleSaveStorefront}
            resizeImage={resizeImage}
            showToast={showToast}
          />
        )}

        {activeTab === 'vitrine' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência da Vitrine</h3>
              <p className="text-gray-500 text-sm">Configure as cores e estilos visuais do seu site.</p>
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
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Texto ao Passar o Mouse (Hover) no Cabeçalho</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.headerHoverTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerHoverTextColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.headerHoverTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, headerHoverTextColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor de Fundo do Botão do Admin</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.adminButtonBgColor?.startsWith('rgba') ? '#ffffff' : storefrontSettings.adminButtonBgColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonBgColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.adminButtonBgColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonBgColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Texto do Botão do Admin</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.adminButtonTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonTextColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.adminButtonTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonTextColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor de Fundo do Botão do Admin (Hover)</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.adminButtonBgColorHover?.startsWith('rgba') ? '#ffffff' : storefrontSettings.adminButtonBgColorHover} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonBgColorHover: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.adminButtonBgColorHover} onChange={(e) => setStorefrontSettings({...storefrontSettings, adminButtonBgColorHover: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
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

              <div className="space-y-1 col-span-full">
                <label className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={storefrontSettings.showClearCartButton} 
                    onChange={(e) => setStorefrontSettings({...storefrontSettings, showClearCartButton: e.target.checked})}
                    className="w-5 h-5 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">Exibir botão "Limpar Carrinho"</span>
                    <span className="text-xs text-gray-500">Permite que o cliente esvazie o carrinho de uma só vez.</span>
                  </div>
                </label>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor de Fundo do Botão Personalizados</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.customButtonBgColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, customButtonBgColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.customButtonBgColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, customButtonBgColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor do Texto do Botão Personalizados</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={storefrontSettings.customButtonTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, customButtonTextColor: e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0" />
                  <input type="text" value={storefrontSettings.customButtonTextColor} onChange={(e) => setStorefrontSettings({...storefrontSettings, customButtonTextColor: e.target.value})} className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono" />
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-1">Banners Promocionais</h4>
                <p className="text-xs text-gray-500">Configure as duas caixas de promoção na página inicial. Para ocultar um banner promocional, deixe o título correspondente em branco.</p>
              </div>

              {/* Promo Banner 1 */}
              <div className="space-y-4 p-4 border border-gray-200 bg-white rounded-lg">
                <h5 className="text-xs font-bold uppercase text-gray-600">Banner Promocional 1</h5>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (Aceita HTML, ex: CANECAS COM SUA&lt;br/&gt;MÚSICA FAVORITA!)</label>
                    <input type="text" value={storefrontSettings.promoBanner1TitleHtml} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1TitleHtml: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Deixe em branco para ocultar este banner" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo (Aceita HTML)</label>
                    <input type="text" value={storefrontSettings.promoBanner1SubtitleHtml} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1SubtitleHtml: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Texto do Botão</label>
                    <input type="text" value={storefrontSettings.promoBanner1ButtonText} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1ButtonText: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Link do Botão/Banner</label>
                    <input type="text" value={storefrontSettings.promoBanner1Link} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1Link: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: ?category=Música" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Inicial</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={storefrontSettings.promoBanner1ColorStart} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1ColorStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0" />
                        <input type="text" value={storefrontSettings.promoBanner1ColorStart} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1ColorStart: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs outline-none font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Final</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={storefrontSettings.promoBanner1ColorEnd} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1ColorEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0" />
                        <input type="text" value={storefrontSettings.promoBanner1ColorEnd} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner1ColorEnd: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs outline-none font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Banner 2 */}
              <div className="space-y-4 p-4 border border-gray-200 bg-white rounded-lg">
                <h5 className="text-xs font-bold uppercase text-gray-600">Banner Promocional 2</h5>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título (Aceita HTML, ex: CANECAS COM SUA&lt;br/&gt;FOTO PREFERIDA!)</label>
                    <input type="text" value={storefrontSettings.promoBanner2TitleHtml} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2TitleHtml: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Deixe em branco para ocultar este banner" />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Subtítulo (Aceita HTML)</label>
                    <input type="text" value={storefrontSettings.promoBanner2SubtitleHtml} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2SubtitleHtml: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Texto do Botão</label>
                    <input type="text" value={storefrontSettings.promoBanner2ButtonText} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2ButtonText: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Link do Botão/Banner</label>
                    <input type="text" value={storefrontSettings.promoBanner2Link} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2Link: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: ?category=Canecas" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:col-span-2">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Inicial</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={storefrontSettings.promoBanner2ColorStart} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2ColorStart: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0" />
                        <input type="text" value={storefrontSettings.promoBanner2ColorStart} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2ColorStart: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs outline-none font-mono" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor Final</label>
                      <div className="flex gap-1.5">
                        <input type="color" value={storefrontSettings.promoBanner2ColorEnd} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2ColorEnd: e.target.value})} className="w-8 h-8 rounded cursor-pointer border-0 p-0 shrink-0" />
                        <input type="text" value={storefrontSettings.promoBanner2ColorEnd} onChange={(e) => setStorefrontSettings({...storefrontSettings, promoBanner2ColorEnd: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-1.5 text-xs outline-none font-mono" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border border-gray-100 rounded-xl bg-gray-50/50 space-y-6">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-1">Destaques / Diferenciais da Loja</h4>
                <p className="text-xs text-gray-500">Configure as faixas informativas (até 4) que aparecem abaixo do carrossel principal. Desmarque uma faixa para ocultá-la do site.</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {storeFeatures.map((feature: any, idx: number) => (
                  <div key={feature.id || idx} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 uppercase">Faixa #{idx + 1}</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={(e) => {
                            const newFeatures = [...storeFeatures];
                            newFeatures[idx] = { ...newFeatures[idx], enabled: e.target.checked };
                            setStoreFeatures(newFeatures);
                          }}
                          className="w-4 h-4 text-[var(--color-primary)] border-gray-300 rounded focus:ring-[var(--color-primary)]"
                        />
                        <span className="text-xs font-semibold text-gray-700">Ativo</span>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Título</label>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => {
                            const newFeatures = [...storeFeatures];
                            newFeatures[idx] = { ...newFeatures[idx], title: e.target.value };
                            setStoreFeatures(newFeatures);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Subtítulo</label>
                        <input
                          type="text"
                          value={feature.subtitle}
                          onChange={(e) => {
                            const newFeatures = [...storeFeatures];
                            newFeatures[idx] = { ...newFeatures[idx], subtitle: e.target.value };
                            setStoreFeatures(newFeatures);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">Ícone</label>
                        <select
                          value={feature.icon}
                          onChange={(e) => {
                            const newFeatures = [...storeFeatures];
                            newFeatures[idx] = { ...newFeatures[idx], icon: e.target.value };
                            setStoreFeatures(newFeatures);
                          }}
                          className="w-full bg-gray-50 border border-gray-200 rounded p-2 text-xs focus:border-[var(--color-primary)] outline-none"
                        >
                          <option value="Truck">Caminhão (Entrega)</option>
                          <option value="CreditCard">Cartão de Crédito</option>
                          <option value="Zap">Raio (PIX/Rápido)</option>
                          <option value="ShieldCheck">Escudo (Segurança)</option>
                          <option value="User">Usuário</option>
                          <option value="MessageCircle">Mensagem (Suporte)</option>
                          <option value="ShoppingCart">Carrinho</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
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
                <input type="number" step="0.01" min="0" value={Math.round((storefrontSettings.pixDiscount || 0) * 100)} onChange={(e) => { const val = parseFloat(e.target.value); setStorefrontSettings({...storefrontSettings, pixDiscount: isNaN(val) ? 0 : val / 100}); }} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
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

        {activeTab === 'footer' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Aparência do Rodapé</h3>
              <p className="text-gray-500 text-sm">Configure o logotipo, textos e cores exibidos no rodapé do site.</p>
            </div>
            
            <div className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Logotipo do Rodapé</label>
                <p className="text-xs text-gray-400 mb-2">Se vazio, usará o logotipo principal da loja.</p>
                <div className="flex items-center gap-4">
                  {footerSettings.footerLogoUrl ? (
                    <div className="w-24 h-24 rounded-xl border border-gray-200 overflow-hidden bg-white flex items-center justify-center p-2 relative group">
                      <img src={footerSettings.footerLogoUrl} alt="Logo Rodapé" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setFooterSettings({ ...footerSettings, footerLogoUrl: '' })}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={24} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-xl border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                      <Image size={32} />
                    </div>
                  )}
                  <div className="flex-1 space-y-3">
                    <label className="flex items-center justify-center gap-2 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg font-bold text-sm uppercase tracking-wider cursor-pointer transition-colors">
                      <Upload size={18} /> {footerSettings.footerLogoUrl ? 'Trocar Logo' : 'Enviar Logo'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          if (file.size > 200 * 1024) {
                            alert('A imagem deve ter no máximo 200KB.');
                            return;
                          }
                          
                          const resized = await resizeImage(file, 200, 200);
setFooterSettings({ ...footerSettings, footerLogoUrl: resized });
                        }}
                      />
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link size={14} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Ou cole a URL da imagem..."
                        value={footerSettings.footerLogoUrl.startsWith('data:') ? '' : footerSettings.footerLogoUrl}
                        onChange={(e) => setFooterSettings({ ...footerSettings, footerLogoUrl: convertGoogleDriveUrl(e.target.value) })}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">Tamanho recomendado: 200x200px (Máx: 200KB para upload)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Descrição</label>
                <textarea 
                  value={footerSettings.footerDescription} 
                  onChange={e => setFooterSettings({...footerSettings, footerDescription: e.target.value})}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none resize-none"
                  placeholder="Especializados em produtos criativos..."
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-xl bg-gray-50/50">
                <h4 className="col-span-full text-sm font-bold uppercase tracking-widest text-gray-700">Cores do Rodapé</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor de Fundo</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={footerSettings.footerBgColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerBgColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={footerSettings.footerBgColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerBgColor: e.target.value})}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono uppercase"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor dos Textos Gerais</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={footerSettings.footerTextColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerTextColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={footerSettings.footerTextColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerTextColor: e.target.value})}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Cor dos Títulos (H3)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={footerSettings.footerHeadingColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerHeadingColor: e.target.value})}
                      className="w-12 h-12 rounded-lg cursor-pointer border-0 p-0"
                    />
                    <input 
                      type="text" 
                      value={footerSettings.footerHeadingColor} 
                      onChange={e => setFooterSettings({...footerSettings, footerHeadingColor: e.target.value})}
                      className="flex-1 bg-white border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-mono uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <button onClick={handleSaveFooter} className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all">
                  <Save size={18} /> Salvar Rodapé
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Precificação Fixa */}
        {activeTab === 'precificacao' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-sm space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Calculator size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">Precificação Fixa & Formação de Preços</h3>
                  <p className="text-xs text-gray-500">Configure detalhadamente todos os custos do seu negócio (fornecedores, embalagens, impostos, taxas de máquina, aluguel, salários e margem de lucro). O sistema calculará o preço exato para cada produto.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSavePricingRules} className="space-y-8">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <div>
                  <span className="font-extrabold text-sm text-purple-900 block">Precificação Automática em Todos os Produtos</span>
                  <p className="text-xs text-purple-700">Qualquer alteração nas regras de precificação é calculada e aplicada automaticamente em todos os produtos da loja.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button 
                    type="submit" 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                  >
                    <Save size={16} />
                    <span>Salvar Agora</span>
                  </button>
                </div>
              </div>

              {/* Bloco 1: Custos Diretos por Produto */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-200">
                  <Package className="text-blue-600" size={20} />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">1. Custos Diretos e Insumos por Produto</h4>
                    <p className="text-[11px] text-gray-500">Custos fixos por unidade fabricada ou comprada</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center justify-between">
                      <span>Matéria-prima / Fornecedor</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">Por Produto</span>
                    </label>
                    <p className="text-[10px] text-gray-400">Preço de aquisição no cadastro individual de cada produto (R$)</p>
                    <div className="mt-2 p-2.5 bg-gray-100 rounded-lg text-xs font-bold text-gray-500 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Definido no cadastro do item
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700">
                      Embalagens e Etiquetas (R$)
                    </label>
                    <p className="text-[10px] text-gray-400">Caixa, saquinho, fitas, etiquetas, brindes por unidade</p>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        value={pricingRules.defaultPackagingCost} 
                        onChange={e => handlePricingRuleChange('defaultPackagingCost', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700">
                      Frete de Entrada (R$)
                    </label>
                    <p className="text-[10px] text-gray-400">Frete pago ao fornecedor rateado por unidade do produto</p>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                      <input 
                        type="number" 
                        step="0.5" 
                        min="0" 
                        value={pricingRules.defaultShippingInCost} 
                        onChange={e => handlePricingRuleChange('defaultShippingInCost', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 2: Custos Variáveis sobre a Venda */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-200">
                  <Receipt className="text-amber-600" size={20} />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">2. Custos Variáveis sobre a Venda (%)</h4>
                    <p className="text-[11px] text-gray-500">Impostos, comissões e taxas incidentes no faturamento</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-1">
                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700">
                      Impostos sobre a Nota Fiscal (%)
                    </label>
                    <p className="text-[10px] text-gray-400">Ex: Simples Nacional, MEI, ICMS/ISS (ex: 6%)</p>
                    <div className="relative mt-1">
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="100"
                        value={pricingRules.taxRatePct} 
                        onChange={e => handlePricingRuleChange('taxRatePct', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700">
                      Taxas de Maquininha / Gateway (%)
                    </label>
                    <p className="text-[10px] text-gray-400">Taxa média de cartão de crédito/débito/PIX (ex: 4%)</p>
                    <div className="relative mt-1">
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="100"
                        value={pricingRules.gatewayFeePct} 
                        onChange={e => handlePricingRuleChange('gatewayFeePct', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-sm">%</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                    <label className="text-[11px] uppercase font-bold text-gray-700">
                      Comissões Vendedores / Marketplaces (%)
                    </label>
                    <p className="text-[10px] text-gray-400">Comissão de vendas ou taxas de marketplace (ex: 0% a 15%)</p>
                    <div className="relative mt-1">
                      <input 
                        type="number" 
                        step="0.1" 
                        min="0" 
                        max="100"
                        value={pricingRules.commissionPct} 
                        onChange={e => handlePricingRuleChange('commissionPct', parseFloat(e.target.value) || 0)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-3 pr-8 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                      />
                      <span className="absolute right-3 top-2.5 text-gray-400 font-bold text-sm">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 3: Despesas Fixas e Estruturais */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Building2 className="text-purple-600" size={20} />
                    <div>
                      <h4 className="font-extrabold text-sm uppercase tracking-wider">3. Despesas Fixas e Estruturais da Loja (R$/mês)</h4>
                      <p className="text-[11px] text-gray-500">Discrimine aluguel, luz, salários e contas mensais para calcular a taxa de rateio proporcional ao faturamento</p>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleSavePricingRules}
                    className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0"
                  >
                    <Save size={15} />
                    <span>SALVAR DESPESAS FIXAS</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Home size={14} className="text-purple-600" /> Aluguel do Espaço / Loja (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">Aluguel da loja, galpão ou estúdio</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="50" 
                          min="0" 
                          value={pricingRules.rentCostMonthly} 
                          onChange={e => handlePricingRuleChange('rentCostMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Zap size={14} className="text-amber-500" /> Luz, Água & Internet (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">Energia elétrica, água, internet e telefone</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="20" 
                          min="0" 
                          value={pricingRules.utilitiesCostMonthly} 
                          onChange={e => handlePricingRuleChange('utilitiesCostMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Users size={14} className="text-blue-600" /> Salários & Pró-labore (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">Salário de funcionários e retirada dos sócios</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="100" 
                          min="0" 
                          value={pricingRules.salariesCostMonthly} 
                          onChange={e => handlePricingRuleChange('salariesCostMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Megaphone size={14} className="text-rose-600" /> Marketing & Anúncios (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">Tráfego pago Meta/Google Ads, anúncios e influenciadores</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="50" 
                          min="0" 
                          value={pricingRules.marketingCostMonthly} 
                          onChange={e => handlePricingRuleChange('marketingCostMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Laptop size={14} className="text-indigo-600" /> Sistemas & Contabilidade (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">ERP (Bling/Tiny), plataforma, domínio e honorários do contador</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="20" 
                          min="0" 
                          value={pricingRules.softwareAccountingCostMonthly} 
                          onChange={e => handlePricingRuleChange('softwareAccountingCostMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                      <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                        <Building2 size={14} className="text-gray-600" /> Outras Despesas Fixas (R$/mês)
                      </label>
                      <p className="text-[10px] text-gray-400">Manutenção, taxas administrativas e despesas diversas</p>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number" 
                          step="50" 
                          min="0" 
                          value={pricingRules.otherFixedCostsMonthly} 
                          onChange={e => handlePricingRuleChange('otherFixedCostsMonthly', parseFloat(e.target.value) || 0)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[11px] text-purple-200 uppercase font-extrabold tracking-wider block">Faturamento Mensal Estimado da Loja (R$)</span>
                      <p className="text-[10px] text-purple-300">Estimativa do total vendido no mês para rateio proporcional dos custos fixos</p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="relative w-40">
                        <span className="absolute left-3 top-2 text-purple-300 font-bold text-xs">R$</span>
                        <input 
                          type="number" 
                          step="1000" 
                          min="1" 
                          value={pricingRules.estimatedMonthlyRevenue} 
                          onChange={e => handlePricingRuleChange('estimatedMonthlyRevenue', parseFloat(e.target.value) || 1)}
                          className="w-full bg-purple-950 border border-purple-700 text-white font-extrabold text-sm rounded-lg py-1.5 pl-9 pr-2 focus:border-purple-400 outline-none"
                        />
                      </div>

                      {(() => {
                        const totalFixed = (pricingRules.rentCostMonthly || 0) + 
                          (pricingRules.utilitiesCostMonthly || 0) + 
                          (pricingRules.salariesCostMonthly || 0) + 
                          (pricingRules.marketingCostMonthly || 0) + 
                          (pricingRules.softwareAccountingCostMonthly || 0) + 
                          (pricingRules.otherFixedCostsMonthly || 0);
                        const rev = pricingRules.estimatedMonthlyRevenue || 1;
                        const calculatedPct = (totalFixed / rev) * 100;
                        return (
                          <div className="bg-purple-950/80 px-4 py-2 rounded-lg border border-purple-700/60 text-right">
                            <span className="text-[10px] text-purple-300 block uppercase font-bold">Taxa de Rateio Gerada:</span>
                            <span className="text-lg font-black text-emerald-400">
                              {calculatedPct.toFixed(1)}% <span className="text-[10px] text-purple-300 font-normal">(R$ {totalFixed.toLocaleString('pt-BR')} /mês)</span>
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloco 4: Margem de Lucro */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-200">
                  <TrendingUp className="text-emerald-600" size={20} />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">4. Margem de Lucro Desejada (%)</h4>
                    <p className="text-[11px] text-gray-500">Lucro líquido limpo no bolso após pagar todos os custos e impostos</p>
                  </div>
                </div>

                <div className="max-w-md bg-white p-4 rounded-xl border border-gray-200/80 space-y-2">
                  <label className="text-[11px] uppercase font-bold text-gray-700">
                    Margem de Lucro Líquido Desejada (%)
                  </label>
                  <p className="text-[10px] text-gray-400">Recomendado entre 15% e 30% dependendo do segmento</p>
                  <div className="relative mt-1">
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      max="100"
                      value={pricingRules.desiredProfitPct} 
                      onChange={e => handlePricingRuleChange('desiredProfitPct', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:border-emerald-500 outline-none font-black text-emerald-700"
                    />
                    <span className="absolute right-3 top-3 text-emerald-600 font-bold text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Simulation Box / DRE Demonstrativo */}
              {(() => {
                const simResult = calculateSuggestedPrice(simCost, pricingRules);
                return (
                  <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <TrendingUp size={16} /> Simulação de Preço e DRE do Produto
                        </div>
                        <h4 className="text-base font-extrabold text-white mt-1">Demonstrativo de Formação de Preço de Venda</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 font-medium">Matéria-prima / Fornecedor Teste:</span>
                        <div className="relative w-36">
                          <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">R$</span>
                          <input 
                            type="number" 
                            value={simCost} 
                            onChange={e => setSimCost(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-lg py-1.5 pl-8 pr-2 focus:border-emerald-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Custo Direto do Produto:</span>
                        <span className="text-xl font-extrabold text-white block">
                          R$ {simResult.totalDirectCost.toFixed(2).replace('.', ',')}
                        </span>
                        <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                          <div>• Item/Matéria-prima: R$ {simResult.baseCost.toFixed(2)}</div>
                          <div>• Embalagem/Etiqueta: R$ {simResult.packagingCost.toFixed(2)}</div>
                          <div>• Frete de Entrada: R$ {simResult.shippingInCost.toFixed(2)}</div>
                        </div>
                      </div>

                      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Taxas e Rateios Impostos:</span>
                        <span className="text-xl font-extrabold text-amber-400 block">
                          {simResult.sumPct.toFixed(1)}% <span className="text-xs text-slate-400 font-normal">das vendas</span>
                        </span>
                        <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                          <div>• Imposto NF: {simResult.taxRatePct}% (R$ {simResult.taxAmount.toFixed(2)})</div>
                          <div>• Maquininha: {simResult.gatewayFeePct}% (R$ {simResult.gatewayFeeAmount.toFixed(2)})</div>
                          <div>• Comissão: {simResult.commissionPct}% (R$ {simResult.commissionAmount.toFixed(2)})</div>
                          <div>• Fixos (Aluguel/Luz/Salários): {simResult.effectiveFixedCostPct.toFixed(1)}% (R$ {simResult.fixedCostAmount.toFixed(2)})</div>
                        </div>
                      </div>

                      <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800/80 space-y-1.5">
                        <span className="text-emerald-400 font-extrabold uppercase text-[10px] block">Preço de Venda Sugerido:</span>
                        <span className="text-3xl font-black text-emerald-400 block">
                          R$ {simResult.suggestedPrice.toFixed(2).replace('.', ',')}
                        </span>
                        <p className="text-[10px] text-emerald-200 pt-1 border-t border-emerald-900">
                          Preço final no catálogo cobrindo 100% das despesas e gerando lucro desejado.
                        </p>
                      </div>

                      <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                        <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Lucro Líquido Limpo:</span>
                        <span className="text-xl font-extrabold text-green-400 block">
                          R$ {simResult.profitAmount.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-800">
                          Margem Real de {simResult.profitMarginRealPct.toFixed(1)}% limpa sobre o preço de venda.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button type="submit" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md">
                  <Save size={18} /> Salvar Regras de Precificação
                </button>
              </div>
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
