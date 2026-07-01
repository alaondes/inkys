import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink } from 'lucide-react';

import { Overview } from './views/Overview';
import { Products } from './views/Products';
import { Orders } from './views/Orders';
import { AdminSettings } from './views/Settings';
import { Login } from './components/Login';

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('inkys-admin-auth') === 'true';
  });
  
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    const savedLogo = localStorage.getItem('inkys-logo-url');
    if (savedLogo) {
      setLogoUrl(savedLogo);
    }
  }, []);

  const location = useLocation();

  const handleLogin = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('inkys-admin-auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('inkys-admin-auth');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos' },
    { path: '/admin/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden" style={{ '--color-primary': 'var(--admin-primary-color, #0891b2)' } as React.CSSProperties}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-gray-200">
          <div className="flex items-center gap-3 w-full">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-primary)' }} />
            )}
            <h1 className="font-bold tracking-widest uppercase text-xl">Admin</h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-2">
          <Link 
            to="/"
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ExternalLink size={20} />
            Voltar ao site
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <header className="h-20 border-b border-gray-200 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold uppercase tracking-wider text-gray-700">Painel de Controle</h2>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium border border-gray-200 px-4 py-2 rounded-lg hover:border-gray-300 transition-all">
              <ExternalLink size={16} /> Voltar ao site
            </Link>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/products" element={<Products />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
