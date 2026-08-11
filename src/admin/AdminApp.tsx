import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles, Calculator, Layers, Shield, DollarSign } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { Overview } from './views/Overview';
import { Products } from './views/Products';
import { CustomProductsAdmin } from './views/CustomProducts';
import { Orders } from './views/Orders';
import { AdminSettings } from './views/Settings';
import { Documents } from './views/Documents';
import { Customers } from './views/Customers';
import { Coupons } from './views/Coupons';
import { Pos } from './views/Pos';
import { Avulsos } from './views/Avulsos';
import { UsersView } from './views/Users';
import { Financial } from './views/Financial';
import { Login } from './components/Login';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendedor' | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;

  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsAuthenticated(!!user);
      if (user && user.email) {
        const lowerEmail = user.email.toLowerCase().trim();
        const docRef = doc(db, 'admin_users', lowerEmail);
        
        const unsubscribeDoc = onSnapshot(docRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const role = data.role || 'vendedor';
            setUserRole(role);

            const allAdminPermissions = {
              overview: true,
              products: true,
              customProducts: true,
              orders: true,
              pos: true,
              avulsos: true,
              customers: true,
              coupons: true,
              financial: true,
              documents: true,
              settings: true,
              users: true
            };

            if (role === 'admin') {
              setUserPermissions(allAdminPermissions);
            } else {
              setUserPermissions({
                overview: false,
                products: false,
                customProducts: false,
                orders: true,
                pos: true,
                avulsos: false,
                customers: false,
                coupons: false,
                financial: false,
                documents: false,
                settings: false,
                users: false,
                ...(data.permissions || {})
              });
            }
            setLoadingPermissions(false);
          } else {
            // Document doesn't exist yet (first admin login or manual creation required)
            // To ensure they don't get locked out, we auto-provision the first login as a full Admin
            try {
              const adminData = {
                name: user.displayName || 'Administrador Principal',
                email: lowerEmail,
                role: 'admin' as const,
                permissions: {
                  overview: true,
                  products: true,
                  customProducts: true,
                  orders: true,
                  pos: true,
                  avulsos: true,
                  customers: true,
                  coupons: true,
                  financial: true,
                  documents: true,
                  settings: true,
                  users: true
                }
              };
              await setDoc(docRef, adminData);
              setUserRole('admin');
              setUserPermissions(adminData.permissions);
              setLoadingPermissions(false);
            } catch (err) {
              console.error("Error auto-provisioning admin:", err);
              // Fallback to allowing access
              setUserRole('admin');
              setUserPermissions({
                overview: true,
                products: true,
                customProducts: true,
                orders: true,
                pos: true,
                avulsos: true,
                customers: true,
                coupons: true,
                financial: true,
                documents: true,
                settings: true,
                users: true
              });
              setLoadingPermissions(false);
            }
          }
        }, (err) => {
          console.warn("Firestore user doc snapshot error, falling back:", err);
          setUserRole('admin');
          setUserPermissions({
            overview: true,
            products: true,
            customProducts: true,
            orders: true,
            pos: true,
            avulsos: true,
            customers: true,
            coupons: true,
            financial: true,
            documents: true,
            settings: true,
            users: true
          });
          setLoadingPermissions(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUserRole(null);
        setUserPermissions(null);
        setLoadingPermissions(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !userPermissions?.orders) return;
    const q = query(collection(db, 'orders'), where('status', 'in', ['Pendente', 'Pago']));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPendingCount(snapshot.docs.length);
    }, (e) => { console.warn("Firestore snapshot warning:", e.message); });
    return () => unsubscribe();
  }, [isAuthenticated, userPermissions]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (isAuthenticated === null || (isAuthenticated && loadingPermissions)) {
    return <div className="h-screen w-full flex items-center justify-center font-bold text-gray-500">Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const allNavItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Visão Geral', permission: 'overview' },
    { path: '/admin/products', icon: Package, label: 'Produtos', permission: 'products' },
    { path: '/admin/custom-products', icon: Sparkles, label: 'Personalizados', permission: 'customProducts' },
    { path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos', permission: 'orders' },
    { path: '/admin/pos', icon: Calculator, label: 'Orçamentos / PDV', permission: 'pos' },
    { path: '/admin/avulsos', icon: Layers, label: 'Avulsos', permission: 'avulsos' },
    { path: '/admin/customers', icon: Users, label: 'Clientes', permission: 'customers' },
    { path: '/admin/coupons', icon: Ticket, label: 'Cupons', permission: 'coupons' },
    { path: '/admin/financial', icon: DollarSign, label: 'Financeiro', permission: 'financial' },
    { path: '/admin/documents', icon: FileText, label: 'Documentos', permission: 'documents' },
    { path: '/admin/users', icon: Shield, label: 'Usuários/Vendedores', permission: 'users' },
    { path: '/admin/settings', icon: Settings, label: 'Configurações', permission: 'settings' },
  ];

  const navItems = allNavItems.filter(item => {
    if (!userPermissions) return false;
    return userPermissions[item.permission];
  });

  // Helper to determine the fallback route they should land on
  const getFirstAvailablePath = () => {
    if (!userPermissions) return '/admin';
    for (const item of allNavItems) {
      if (userPermissions[item.permission]) return item.path;
    }
    return '/admin';
  };

  function AccessDenied() {
    return (
      <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <X className="mx-auto text-red-500 mb-4 bg-red-50 p-2.5 rounded-full" size={56} />
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Acesso Negado</h3>
        <p className="text-gray-500 text-sm mt-2">Você não possui permissão para acessar esta seção do painel administrativo.</p>
        <p className="text-gray-400 text-xs mt-1">Entre em contato com o administrador principal para liberar seu acesso.</p>
        <Link to={getFirstAvailablePath()} className="inline-block mt-6 px-5 py-2.5 bg-[var(--color-primary)] text-white font-bold text-sm uppercase tracking-wider rounded-xl hover:brightness-105 transition-all">
          Ir para minha área
        </Link>
      </div>
    );
  }

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
              <img src={logoUrl || undefined} alt="Logo" className="h-12 w-auto max-w-[120px] object-contain" referrerPolicy="no-referrer" />
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
            const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold' 
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
            <Route path="/" element={userPermissions?.overview ? <Overview /> : <Navigate to={getFirstAvailablePath()} replace />} />
            <Route path="/products" element={userPermissions?.products ? <Products /> : <AccessDenied />} />
            <Route path="/custom-products" element={userPermissions?.customProducts ? <CustomProductsAdmin /> : <AccessDenied />} />
            <Route path="/orders" element={userPermissions?.orders ? <Orders /> : <AccessDenied />} />
            <Route path="/pos" element={userPermissions?.pos ? <Pos /> : <AccessDenied />} />
            <Route path="/avulsos" element={userPermissions?.avulsos ? <Avulsos /> : <AccessDenied />} />
            <Route path="/customers" element={userPermissions?.customers ? <Customers /> : <AccessDenied />} />
            <Route path="/coupons" element={userPermissions?.coupons ? <Coupons /> : <AccessDenied />} />
            <Route path="/financial" element={userPermissions?.financial ? <Financial /> : <AccessDenied />} />
            <Route path="/documents" element={userPermissions?.documents ? <Documents /> : <AccessDenied />} />
            <Route path="/users" element={userPermissions?.users ? <UsersView /> : <AccessDenied />} />
            <Route path="/settings" element={userPermissions?.settings ? <AdminSettings /> : <AccessDenied />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
