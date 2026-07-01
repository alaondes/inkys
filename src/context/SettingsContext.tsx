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
  }
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
