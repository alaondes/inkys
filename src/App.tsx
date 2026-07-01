import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Storefront } from './storefront/Storefront';
import { AdminApp } from './admin/AdminApp';
import { ProductProvider } from './context/ProductContext';
import { SettingsProvider } from './context/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <ProductProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Storefront />} />
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ProductProvider>
    </SettingsProvider>
  );
}

