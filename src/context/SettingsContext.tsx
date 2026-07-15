import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import toast from 'react-hot-toast';

export interface HeroBanner {
  id: string;
  image: string;
  titleHtml: string;
  subtitle: string;
  buttonText: string;
  buttonColor: string;
  titleColor?: string;
  titleSize?: string;
  titleFont?: string;
  subtitleColor?: string;
  subtitleSize?: string;
  subtitleFont?: string;
  subtitleSameSize?: boolean;
  buttonLink?: string;
  description?: string;
  descriptionColor?: string;
  descriptionSize?: string;
  descriptionFont?: string;
  textAlign?: string;
}

export interface AppSettings {
  logoUrl: string;
  faviconUrl?: string;
  primaryColor: string;
  whatsappNumber: string;

  adminEmail?: string;
  paymentMethods: {
    pix: boolean;
    credit: boolean;
    debit: boolean;
    boleto: boolean;
  };
  topBarColor: string;
  headerColor: string;
  headerTextColor: string;
  headerHoverTextColor?: string;
  navBarColor?: string;
  navBarTextColor?: string;
  siteBackgroundColor?: string;
  customButtonBgColor: string;
  customButtonTextColor: string;
  heroBannerImage: string;
  heroBannerTitleHtml: string;
  heroBannerSubtitle: string;
  heroBannerButtonText: string;
  heroBannerButtonColor: string;
  heroBanners?: HeroBanner[];
  productBanners?: any[];
  promoBanner1TitleHtml: string;
  promoBanner1SubtitleHtml: string;
  promoBanner1ButtonText: string;
  promoBanner1ColorStart: string;
  promoBanner1ColorEnd: string;
  promoBanner2TitleHtml: string;
  promoBanner2SubtitleHtml: string;
  promoBanner2ButtonText: string;
  promoBanner2ColorStart: string;
  promoBanner2ColorEnd: string;
  buyButtonColor: string;
  storeName: string;
  productRating: number;
  productReviews: number;
  pixDiscount: number;
  installments: number;
  categories: string[];
  freeShippingThreshold?: number;
  fixedShippingRates?: Record<string, number>;
  customPageTitle?: string;
  customPageDescription?: string;
  customPageGuideText?: string;
  customPageGuideImage?: string;
  globalTemplateFile?: string;
  globalTemplateFileName?: string;
  customProducts?: { 
    name: string; 
    image: string; 
    guideText?: string; 
    guideImage?: string; 
    price?: number;
    templateFile?: string;
    templateFileName?: string;
    templates?: { name: string; file: string; program?: string; }[];
  }[];
  storeFeatures?: { id: string; icon: string; title: string; subtitle: string; enabled: boolean }[];
  adminButtonBgColor?: string;
  adminButtonTextColor?: string;
  adminButtonBgColorHover?: string;
  showClearCartButton?: boolean;
}

const defaultSettings: AppSettings = {
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#facc15',
  whatsappNumber: '5561981365428',
  adminEmail: 'alaondez@gmail.com',

  paymentMethods: {
    pix: true,
    credit: true,
    debit: true,
    boleto: true
  },
  topBarColor: '#f3f4f6',
  headerColor: '#ffffff',
  headerTextColor: '#111827',
  headerHoverTextColor: '#facc15',
  adminButtonBgColor: '#facc15',
  adminButtonTextColor: '#111827',
  adminButtonBgColorHover: '#eab308',
  showClearCartButton: true,
  customButtonBgColor: '#facc15',
  customButtonTextColor: '#111827',
  heroBannerImage: '',
  heroBannerTitleHtml: '',
  heroBannerSubtitle: '',
  heroBannerButtonText: 'Comprar',
  heroBannerButtonColor: '#000000',
  productBanners: [],
  heroBanners: [],
  promoBanner1TitleHtml: '',
  promoBanner1SubtitleHtml: '',
  promoBanner1ButtonText: 'COMPRAR',
  promoBanner1ColorStart: '#4a8bf5',
  promoBanner1ColorEnd: '#68abfa',
  promoBanner2TitleHtml: '',
  promoBanner2SubtitleHtml: '',
  promoBanner2ButtonText: 'COMPRAR',
  promoBanner2ColorStart: '#b861ff',
  promoBanner2ColorEnd: '#c37aff',
  buyButtonColor: '#5ba324',
  storeName: 'inkys',
  productRating: 5,
  productReviews: 5,
  pixDiscount: 0.10,
  installments: 2,
  categories: ['Canecas', 'Dia das Mães', 'Dia dos Pais', 'Música', 'Divertidas', 'Copa', 'Outros', 'Anos 80/90'],
  fixedShippingRates: { 'SP': 15.90, 'RJ': 20.00 },
  customPageTitle: 'Seu Produto, do Seu Jeito!',
  customPageDescription: 'Faça um orçamento de canecas, azulejos, camisetas e muito mais com a sua cara, logo da sua empresa ou para presentear alguém especial.',
  customPageGuideText: 'Para garantir a melhor qualidade na impressão:\n- Envie imagens em alta resolução (preferencialmente PNG com fundo transparente)\n- Evite prints de tela ou fotos borradas\n- Formatos aceitos: JPG, PNG ou SVG',
  customPageGuideImage: '',
  customProducts: [
    { name: 'Caneca', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400', price: 39.90 },
    { name: 'Azulejo', image: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?auto=format&fit=crop&q=80&w=400', price: 29.90 },
    { name: 'Camiseta', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400', price: 49.90 },
    { name: 'Garrafa/Squeeze', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400', price: 59.90 },
    { name: 'Mousepad', image: 'https://images.unsplash.com/photo-1628102283857-41864f434778?auto=format&fit=crop&q=80&w=400', price: 19.90 },
    { name: 'Almofada', image: 'https://images.unsplash.com/photo-1584100936595-c0654b35a111?auto=format&fit=crop&q=80&w=400', price: 45.90 }
  ],
  storeFeatures: [
    { id: 'f1', icon: 'Truck', title: 'Do Oiapoque ao Chuí', subtitle: 'Entregas em Todo Brasil', enabled: true },
    { id: 'f2', icon: 'CreditCard', title: 'Parcelamento', subtitle: 'Em até 2x sem juros', enabled: true },
    { id: 'f3', icon: 'Zap', title: 'Ganhe Desconto', subtitle: 'Pagando com PIX', enabled: true },
    { id: 'f4', icon: 'ShieldCheck', title: 'Segurança', subtitle: 'Loja com SSL de proteção', enabled: true },
  ]
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
  try {
    const cached = localStorage.getItem('inkys-settings');
    if (cached) {
      try {
        return { ...defaultSettings, ...JSON.parse(cached) };
      } catch (e) {
        console.error('Failed to parse cached settings', e);
      }
    }
  } catch (err) {
    console.warn('localStorage access denied', err);
  }
  return defaultSettings;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const settingsRef = doc(db, 'config', 'settings');
    
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
    }, 10000);

    let hasAttemptedInit = false;

    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppSettings;
        let needsCleanup = false;
        const cleaned: Partial<AppSettings> = {};

        if (data.promoBanner1TitleHtml === 'CANECAS COM SUA<br/>MÚSICA FAVORITA!') {
          cleaned.promoBanner1TitleHtml = '';
          cleaned.promoBanner1SubtitleHtml = '';
          needsCleanup = true;
        }
        if (data.promoBanner2TitleHtml === 'CANECAS COM SUA<br/>FOTO PREFERIDA!') {
          cleaned.promoBanner2TitleHtml = '';
          cleaned.promoBanner2SubtitleHtml = '';
          needsCleanup = true;
        }
        if (data.heroBannerTitleHtml === 'Canecas<br/><span class="text-5xl italic font-serif mt-2 block">Personalizadas</span>') {
          cleaned.heroBannerTitleHtml = '';
          cleaned.heroBannerSubtitle = '';
          cleaned.heroBannerImage = '';
          needsCleanup = true;
        }
        if (data.heroBanners && data.heroBanners.length === 1 && data.heroBanners[0].id === 'default-1') {
          cleaned.heroBanners = [];
          needsCleanup = true;
        }

        const isGuestSession = !auth.currentUser && !window.location.pathname.includes('/admin');

        if (needsCleanup && !isGuestSession) {
          setDoc(settingsRef, cleaned, { merge: true }).catch(console.error);
        }

        const newSettings = { ...defaultSettings, ...data, ...cleaned };
        setSettings(newSettings);
        try {
          localStorage.setItem('inkys-settings', JSON.stringify(newSettings));
        } catch (e) {
          // ignore
        }
        clearTimeout(timeoutId);
        setIsLoading(false);
      } else {
        // Initialize settings if they don't exist
        const isGuestSession = !auth.currentUser && !window.location.pathname.includes('/admin');
        if (!isGuestSession && !hasAttemptedInit && (() => { try { return localStorage.getItem('inkys_settings_seeded') !== 'true'; } catch(e) { return true; } })()) {
          hasAttemptedInit = true;
          setDoc(settingsRef, defaultSettings).then(() => {
            try { localStorage.setItem('inkys_settings_seeded', 'true'); } catch(e) {};
          }).catch(console.error);
        } else {
          try { localStorage.setItem('inkys_settings_seeded', 'true'); } catch(e) {};
        }
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    }, (error) => {
      // Failed to load settings from firestore due to permissions or quota.
      // Already fell back to local storage defaults.
      setIsLoading(false);
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    // Optimistic local update
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('inkys-settings', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });

    const settingsRef = doc(db, 'config', 'settings');
    try {
      await Promise.race([
        setDoc(settingsRef, newSettings, { merge: true }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ao salvar: A imagem pode ser muito grande (limite de 1MB).')), 12000))
      ]);
    } catch (error) {
      console.warn('Failed to update settings in Firestore, but updated locally:', error);
      throw error;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
