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
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    const settingsRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSettings({ ...defaultSettings, ...docSnap.data() as AppSettings });
      } else {
        // Initialize settings if they don't exist
        setDoc(settingsRef, defaultSettings).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const settingsRef = doc(db, 'config', 'settings');
    setDoc(settingsRef, newSettings, { merge: true }).catch(console.error);
  };

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
