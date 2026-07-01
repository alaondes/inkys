import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface AppSettings {
  logoUrl: string;
  primaryColor: string;
  whatsappNumber: string;
  paymentMethods: {
    pix: boolean;
    credit: boolean;
    debit: boolean;
    boleto: boolean;
  };
  topBarColor: string;
  headerColor: string;
  heroBannerImage: string;
  heroBannerTitleHtml: string;
  heroBannerSubtitle: string;
  heroBannerButtonText: string;
  heroBannerButtonColor: string;
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
}

const defaultSettings: AppSettings = {
  logoUrl: '',
  primaryColor: '#0891b2',
  whatsappNumber: '5561981365428',
  paymentMethods: {
    pix: true,
    credit: true,
    debit: true,
    boleto: true
  },
  topBarColor: '#d64c71',
  headerColor: '#8b3887',
  heroBannerImage: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
  heroBannerTitleHtml: 'Caneca com<br/><span class="text-5xl italic font-serif mt-2 block">Foto e Música</span>',
  heroBannerSubtitle: 'O presente perfeito para transformar lembranças em emoção.',
  heroBannerButtonText: 'Peça a sua agora ♥',
  heroBannerButtonColor: '#b44e68',
  promoBanner1TitleHtml: 'CANECAS COM SUA<br/>MÚSICA FAVORITA!',
  promoBanner1SubtitleHtml: 'Modelos prontos com código<br/>de música para adicionar.',
  promoBanner1ButtonText: 'COMPRAR',
  promoBanner1ColorStart: '#4a8bf5',
  promoBanner1ColorEnd: '#68abfa',
  promoBanner2TitleHtml: 'CANECAS COM SUA<br/>FOTO PREFERIDA!',
  promoBanner2SubtitleHtml: 'Modelos prontos com espaço<br/>para adicionar as fotos.',
  promoBanner2ButtonText: 'COMPRAR',
  promoBanner2ColorStart: '#b861ff',
  promoBanner2ColorEnd: '#c37aff',
  buyButtonColor: '#5ba324',
  storeName: 'Amo Canecas',
  productRating: 5,
  productReviews: 5,
  pixDiscount: 0.10,
  installments: 2,
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
  const cached = localStorage.getItem('inkys-settings');
  if (cached) {
    try {
      return { ...defaultSettings, ...JSON.parse(cached) };
    } catch (e) {
      console.error('Failed to parse cached settings', e);
    }
  }
  return defaultSettings;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [isLoading, setIsLoading] = useState(!localStorage.getItem('inkys-settings'));

  useEffect(() => {
    const settingsRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const newSettings = { ...defaultSettings, ...docSnap.data() as AppSettings };
        setSettings(newSettings);
        localStorage.setItem('inkys-settings', JSON.stringify(newSettings));
        setIsLoading(false);
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsRef, defaultSettings).catch(console.error);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const settingsRef = doc(db, 'config', 'settings');
    setDoc(settingsRef, newSettings, { merge: true }).catch(console.error);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-500 font-medium">Carregando...</p>
      </div>
    );
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
