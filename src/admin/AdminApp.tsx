import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles } from 'lucide-react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { Overview } from './views/Overview';
import { Products } from './views/Products';
import { CustomProductsAdmin } from './views/CustomProducts';
import { Orders } from './views/Orders';
import { AdminSettings } from './views/Settings';
import { Documents } from './views/Documents';
import { Customers } from './views/Customers';
import { Coupons } from './views/Coupons';
import { Login } from './components/Login';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;

  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const q = query(collection(db, 'orders'), where('status', 'in', ['Pendente', 'Pago']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    }, (e) => { console.warn("Firestore snapshot warning:", e.message); });
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (isAuthenticated === null) {
    return <div className="h-screen w-full flex items-center justify-center">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Visão Geral' },
    { path: '/admin/products', icon: Package, label: 'Produtos' },
    { path: '/admin/custom-products', icon: Sparkles, label: 'Personalizados' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos' },
    { path: '/admin/customers', icon: Users, label: 'Clientes' },
    { path: '/admin/coupons', icon: Ticket, label: 'Cupons' },
    { path: '/admin/documents', icon: FileText, label: 'Documentos' },
    { path: '/admin/settings', icon: Settings, label: 'Configurações' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden" style={{ '--color-primary': 'var(--admin-primary-color, #0891b2)' } as React.CSSProperties}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 border-r border-gray-200 bg-white flex flex-col absolute lg:static top-0 bottom-0 left-0 z-50 transition-transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-3 w-full">
            {logoUrl ? (
              <img src={logoUrl || undefined} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-full" style={{ background: 'var(--color-primary)' }} />
            )}
            <h1 className="font-bold tracking-widest uppercase text-xl">Admin</h1>
          </div>
          <button className="lg:hidden text-gray-500" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} />
                  {item.label}
                </div>
                {item.label === 'Pedidos' && pendingCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                )}
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
        <header className="h-20 border-b border-gray-200 flex items-center justify-between px-4 sm:px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-700 hover:text-gray-900" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-700 hidden sm:block">Painel de Controle</h2>
            <h2 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-700 sm:hidden">Painel</h2>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 font-medium border border-gray-200 px-3 sm:px-4 py-2 rounded-lg hover:border-gray-300 transition-all">
              <ExternalLink size={16} /> <span className="hidden sm:inline">Voltar ao site</span>
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-8 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/products" element={<Products />} />
            <Route path="/custom-products" element={<CustomProductsAdmin />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
