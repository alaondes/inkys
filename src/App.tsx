import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Storefront } from './storefront/Storefront';
import { AdminApp } from './admin/AdminApp';
import { LoginRoute } from './admin/components/LoginRoute';
import { PublicDocumentViewer } from './components/PublicDocumentViewer';
import { ProductProvider } from './context/ProductContext';
import { SettingsProvider } from './context/SettingsContext';
import { Toaster } from 'react-hot-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {this.state.error && this.state.error.toString()}
          </pre>
        </div>
      );
    }

    return this.props.children; 
  }
}

import { FaviconManager } from './components/FaviconManager';
import { useSettings } from './context/SettingsContext';
import { useProducts } from './context/ProductContext';

function AppContent() {
  const { isLoading: settingsLoading, settings } = useSettings();
  const { isLoading: productsLoading } = useProducts();

  if (settingsLoading || productsLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-md transition-all duration-700">
        <div className="flex flex-col items-center space-y-6">
          {/* Pulsating logo/icon placeholder */}
          <div 
            className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.08)] animate-pulse transition-transform duration-500 hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${settings?.headerColor || '#facc15'} 0%, ${settings?.topBarColor || '#eab308'} 100%)` 
            }}
          >
            <span className="text-white font-black text-3xl tracking-tighter">i</span>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-gray-800 uppercase">
              {settings?.storeName || 'inkys'}
            </h2>
            <p className="text-[11px] text-gray-400 font-bold tracking-[0.2em] uppercase animate-pulse">
              Carregando o seu jeito...
            </p>
          </div>
        </div>

        {/* Elegant modern step indicator dots */}
        <div className="mt-10 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: settings?.headerColor || '#facc15', animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: settings?.headerColor || '#facc15', animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: settings?.headerColor || '#facc15', animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/document/:id" element={<PublicDocumentViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <FaviconManager />
        <ProductProvider>
          <AppContent />
        </ProductProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

