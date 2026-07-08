import React, { Component, ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Storefront } from './storefront/Storefront';
import { AdminApp } from './admin/AdminApp';
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-xs transition-all duration-500">
        <div className="flex flex-col items-center space-y-5">
          {/* Pulsating logo/icon placeholder */}
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-100/50 animate-pulse transition-transform duration-500 hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${settings?.headerColor || '#8b3887'} 0%, ${settings?.topBarColor || '#d64c71'} 100%)` 
            }}
          >
            <span className="text-white font-black text-2xl tracking-tighter">i</span>
          </div>
          
          <div className="text-center space-y-1">
            <h2 className="text-xl font-black tracking-tight text-gray-800 uppercase">
              {settings?.storeName || 'inkys'}
            </h2>
            <p className="text-[10px] text-gray-400 font-extrabold tracking-widest uppercase animate-pulse">
              Carregando o seu jeito...
            </p>
          </div>
        </div>

        {/* Elegant modern step indicator dots */}
        <div className="mt-8 flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-bounce bg-purple-600" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce bg-pink-500" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 rounded-full animate-bounce bg-yellow-500" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/admin/*" element={<AdminApp />} />
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

