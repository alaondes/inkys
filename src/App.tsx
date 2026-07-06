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

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <ProductProvider>
          <BrowserRouter>
            <Toaster position="top-center" />
            <Routes>
              <Route path="/" element={<Storefront />} />
              <Route path="/admin/*" element={<AdminApp />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProductProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}

