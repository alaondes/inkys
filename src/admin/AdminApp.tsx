import { convertGoogleDriveUrl } from '../lib/urlUtils';
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, 
  Users, Ticket, FileText, X, Sparkles, Calculator, Layers, Shield, DollarSign, 
  UserCheck, BookOpen, Search, Command, Plus, ChevronDown, ChevronRight, TrendingUp,
  Store, Truck, ArrowUpRight
, LayoutTemplate, Image as ImageIcon, Type, LayoutPanelTop } from 'lucide-react';
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
import { Quotes } from './views/Quotes';
import { Avulsos } from './views/Avulsos';
import { UsersView } from './views/Users';
import { Financial } from './views/Financial';
import { HRView } from './views/HR';
import { AccountingView } from './views/Accounting';
import { Login } from './components/Login';
import { useSettings } from '../context/SettingsContext';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import { CommandPalette } from './components/CommandPalette';
import { CalculationWizardModal } from './components/CalculationWizardModal';
import { QuickExpenseModal } from './components/QuickExpenseModal';
import { FloatingActionButton } from './components/FloatingActionButton';

export function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendedor' | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean> | null>(null);
  const [loadingPermissions, setLoadingPermissions] = useState(true);

  // Modals state
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Accordion active state for desktop sidebar
  const [activePillar, setActivePillar] = useState<string>('vendas');

  const { settings } = useSettings();
  const logoUrl = settings.logoUrl;
  const location = useLocation();
  const navigate = useNavigate();

  // Listen to custom command palette shortcut event
  useEffect(() => {
    const handleOpenPalette = () => setIsCommandPaletteOpen(true);
    window.addEventListener('open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('open-command-palette', handleOpenPalette);
  }, []);

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
              hr: true,
              accounting: true,
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
                  hr: true,
                  accounting: true,
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
                hr: true,
                accounting: true,
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
            hr: true,
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
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4" />
        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Carregando Sistema...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  const getLabel = (key: string, defaultName: string) => {
    return settings?.customMenuLabels?.[key] || defaultName;
  };

  // Define the 4 Main Pillars Structure
  const PILLARS = [
    {
      id: 'vendas',
      title: getLabel('vendas', 'Vendas & Balcão'),
      icon: ShoppingBag,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      activeBorder: 'border-blue-600',
      items: [
        { path: '/admin/pos', icon: Calculator, label: getLabel('/admin/pos', 'Novo Pedido / PDV'), permission: 'pos', badge: 'Rápido' },
        { path: '/admin/quotes', icon: FileText, label: getLabel('/admin/quotes', 'Orçamentos & Cotações'), permission: 'orders' },
        { path: '/admin/orders', icon: ShoppingBag, label: getLabel('/admin/orders', 'Pedidos Ativos'), permission: 'orders', badgeCount: pendingCount },
        { path: '/admin/coupons', icon: Ticket, label: getLabel('/admin/coupons', 'Cupons de Desconto'), permission: 'coupons' },
      ]
    },
    {
      id: 'producao',
      title: getLabel('producao', 'Produção & Mídias'),
      icon: Package,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      activeBorder: 'border-amber-600',
      items: [
        { path: '/admin/production', icon: Layers, label: getLabel('/admin/production', 'Fila de Impressão (Kanban)'), permission: 'orders' },
        { path: '/admin/products', icon: Package, label: getLabel('/admin/products', 'Produtos & Catálogo'), permission: 'products' },
                { path: '/admin/avulsos', icon: Layers, label: getLabel('/admin/avulsos', `Atendimento & ${settings?.posCustomItemLabel || 'Personalizáveis'}`), permission: 'avulsos' },
        { path: '/admin/custom-products', icon: Sparkles, label: getLabel('/admin/custom-products', 'Personalizados & Brindes'), permission: 'customProducts' },
      ]
    },
    {
      id: 'gestao',
      title: getLabel('gestao', 'Gestão & Pessoal'),
      icon: Users,
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      activeBorder: 'border-purple-600',
      items: [
        { path: '/admin/customers', icon: Users, label: getLabel('/admin/customers', 'Cadastro de Clientes'), permission: 'customers' },
        { path: '/admin/hr', icon: UserCheck, label: getLabel('/admin/hr', 'RH, Equipe & Comissões'), permission: 'hr' },
        { path: '/admin/users', icon: Shield, label: getLabel('/admin/users', 'Vendedores & Usuários'), permission: 'users' },
      ]
    },
    {
      id: 'financeiro',
      title: getLabel('financeiro', 'Cérebro Financeiro'),
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      activeBorder: 'border-emerald-600',
      items: [
        { path: '/admin', icon: LayoutDashboard, label: getLabel('/admin', 'Painel & Resumo'), permission: 'overview' },
        { path: '/admin/financial', icon: DollarSign, label: getLabel('/admin/financial', 'Fluxo de Caixa'), permission: 'financial' },
        { path: '/admin/accounting', icon: BookOpen, label: getLabel('/admin/accounting', 'Contabilidade & DRE'), permission: 'accounting' },
        { path: '/admin/documents', icon: FileText, label: getLabel('/admin/documents', 'Notas & Documentos (NFe)'), permission: 'documents' },
      ]
    },
    {
      id: 'configuracoes',
      title: getLabel('configuracoes', 'Configurações'),
      icon: Settings,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      activeBorder: 'border-slate-600',
      items: [
        { path: '/admin/settings?tab=loja', icon: Store, label: getLabel('/admin/settings?tab=loja', 'Loja & Marca'), permission: 'settings' },
        { path: '/admin/settings?tab=vitrine', icon: LayoutTemplate, label: getLabel('/admin/settings?tab=vitrine', 'Aparência'), permission: 'settings' },
        { path: '/admin/settings?tab=banners', icon: ImageIcon, label: getLabel('/admin/settings?tab=banners', 'Banners (Carrossel)'), permission: 'settings' },
        { path: '/admin/settings?tab=menu', icon: Type, label: getLabel('/admin/settings?tab=menu', 'Personalizar Menus'), permission: 'settings' },
        { path: '/admin/settings?tab=seguranca', icon: Shield, label: getLabel('/admin/settings?tab=seguranca', 'Segurança'), permission: 'settings' },
        { path: '/admin/settings?tab=footer', icon: LayoutPanelTop, label: getLabel('/admin/settings?tab=footer', 'Rodapé'), permission: 'settings' },
      ]
    }
  ];

  // Helper to determine the fallback route
  const getFirstAvailablePath = () => {
    if (!userPermissions) return '/admin';
    if (userPermissions.pos) return '/admin/pos';
    if (userPermissions.orders) return '/admin/orders';
    if (userPermissions.overview) return '/admin';
    return '/admin/pos';
  };

  function AccessDenied() {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm max-w-lg mx-auto mt-12 animate-in fade-in duration-300">
        <X className="mx-auto text-rose-500 mb-4 bg-rose-50 p-3 rounded-full" size={56} />
        <h3 className="text-lg font-black text-slate-900 uppercase tracking-wider">Acesso Restrito</h3>
        <p className="text-slate-500 text-xs mt-2 font-medium">Você não possui autorização para esta área do sistema.</p>
        <Link to={getFirstAvailablePath()} className="inline-block mt-6 px-6 py-3 bg-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-blue-500 transition-all shadow-md">
          Ir para minha tela principal
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F9] text-slate-900 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 bg-[#3b3373] text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 w-56 lg:w-[260px] h-16 shrink-0">
            {logoUrl ? (
              <img src={convertGoogleDriveUrl(logoUrl)} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain brightness-0 invert" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded border border-white/20 bg-white/10 flex items-center justify-center text-white font-black text-sm">
                M
              </div>
            )}
            <span className="font-bold text-lg hidden lg:block">Moss</span>
          </div>
          
          <button 
            className="text-white/80 hover:text-white p-1 rounded-lg" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={22} />
          </button>

          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={16} /> New
          </button>
          <button className="hidden md:flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            Quick Link
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="hidden sm:flex text-white/80 hover:text-white transition-colors"
          >
            <Calculator size={20} />
          </button>
          <Link to="/" target="_blank" className="text-white/80 hover:text-white transition-colors">
            <ExternalLink size={20} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
      
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

      {/* Desktop Intelligent Sidebar */}
      <aside className={`w-64 border-r border-slate-200 bg-white flex flex-col fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* 4 Pillar Accordion Navigation */}
        <nav className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
          
          {PILLARS.map((pillar) => {
            const PillarIcon = pillar.icon;
            let filteredItems = pillar.items.filter(item => userPermissions?.[item.permission]);
            if (settings?.menuOrder && settings.menuOrder[pillar.id]) {
              const order = settings.menuOrder[pillar.id];
              filteredItems.sort((a, b) => {
                const indexA = order.indexOf(a.path);
                const indexB = order.indexOf(b.path);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
              });
            }
            if (filteredItems.length === 0) return null;

            const isPillarActive = filteredItems.some(i => location.pathname === i.path.split('?')[0] || (i.path === '/admin' && location.pathname === '/admin/'));

            return (
              <div 
                key={pillar.id}
                className="mb-2"
              >
                {/* Pillar Header Switcher */}
                <button
                  onClick={() => setActivePillar(activePillar === pillar.id ? '' : pillar.id)}
                  className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[11px] uppercase tracking-wider text-slate-400">
                      {pillar.title}
                    </span>
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`text-slate-400 transition-transform duration-200 ${
                      activePillar === pillar.id || isPillarActive ? 'rotate-180 text-indigo-600' : ''
                    }`} 
                  />
                </button>

                {/* Sub items */}
                {(activePillar === pillar.id || isPillarActive) && (
                  <div className="px-2 pb-2 space-y-1 border-t border-slate-100 pt-1">
                    {filteredItems.map((item) => {
                      const isActive = location.pathname === item.path.split('?')[0] && (
    (location.search === '' && item.path.includes('tab=loja')) || 
    (location.search === '?' + item.path.split('?')[1]) ||
    (!item.path.includes('?') && location.search === '')
  ) || (item.path === '/admin' && location.pathname === '/admin/');
                      const ItemIcon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-r-full text-sm font-medium transition-all mr-2 ${
                            isActive
                              ? 'bg-[#EFEFF9] text-[#3b3373]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <ItemIcon size={15} />
                            <span>{item.label}</span>
                          </div>

                          {item.badgeCount && item.badgeCount > 0 ? (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isActive ? 'bg-white text-blue-600' : 'bg-rose-500 text-white'
                            }`}>
                              {item.badgeCount}
                            </span>
                          ) : null}

                          {item.badge ? (
                            <span className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                              isActive ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {item.badge}
                            </span>
                          ) : null}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        
          
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/80 space-y-2 shrink-0 bg-slate-50/50">
          <Link 
            to="/"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all"
          >
            <ExternalLink size={16} />
            Ver Loja Virtual
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3.5 py-2.5 w-full rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut size={16} />
            Encerrar Sessão
          </button>
        </div>

      </aside>

      {/* Main App Content Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F5F9] relative">

        {/* Scrollable Main Viewport Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-12 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/" element={userPermissions?.overview ? <Overview /> : <Navigate to={getFirstAvailablePath()} replace />} />
            <Route path="/products" element={userPermissions?.products ? <Products /> : <AccessDenied />} />
            <Route path="/custom-products" element={userPermissions?.customProducts ? <CustomProductsAdmin /> : <AccessDenied />} />
            <Route path="/orders" element={userPermissions?.orders ? <Orders initialMode="table" /> : <AccessDenied />} />
            <Route path="/production" element={userPermissions?.orders ? <Orders initialMode="kanban" /> : <AccessDenied />} />
            <Route path="/quotes" element={userPermissions?.orders ? <Quotes /> : <AccessDenied />} />
            <Route path="/pos" element={userPermissions?.pos ? <Pos /> : <AccessDenied />} />
            <Route path="/avulsos" element={userPermissions?.avulsos ? <Avulsos /> : <AccessDenied />} />
            <Route path="/customers" element={userPermissions?.customers ? <Customers /> : <AccessDenied />} />
            <Route path="/coupons" element={userPermissions?.coupons ? <Coupons /> : <AccessDenied />} />
            <Route path="/financial" element={userPermissions?.financial ? <Financial /> : <AccessDenied />} />
            <Route path="/hr" element={userPermissions?.hr ? <HRView /> : <AccessDenied />} />
            <Route path="/accounting" element={userPermissions?.accounting ? <AccountingView /> : <AccessDenied />} />
            <Route path="/documents" element={userPermissions?.documents ? <Documents /> : <AccessDenied />} />
            <Route path="/users" element={userPermissions?.users ? <UsersView /> : <AccessDenied />} />
            <Route path="/settings" element={userPermissions?.settings ? <AdminSettings /> : <AccessDenied />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>

        {/* Floating Action Button (FAB) */}
        <FloatingActionButton 
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenExpense={() => setIsExpenseModalOpen(true)}
        />

        {/* Mobile Bottom Dock Bar (Native App Dock) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 px-4 z-40 flex items-center justify-around shadow-2xl">
          
          {/* Pillar 1: PDV & Vendas */}
          <button
            onClick={() => navigate('/admin/pos')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              location.pathname === '/admin/pos' ? 'text-blue-600 font-black scale-105' : 'text-slate-400 font-medium'
            }`}
          >
            <ShoppingBag size={20} />
            <span className="text-[10px] uppercase tracking-tighter">Vendas</span>
          </button>

          {/* Pillar 2: Produção */}
          <button
            onClick={() => navigate('/admin/production')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              location.pathname === '/admin/production' ? 'text-amber-600 font-black scale-105' : 'text-slate-400 font-medium'
            }`}
          >
            <Package size={20} />
            <span className="text-[10px] uppercase tracking-tighter">Produção</span>
          </button>

          {/* Central Search Trigger */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-2xl bg-slate-900 text-white shadow-lg -mt-5 border-2 border-white"
          >
            <Command size={20} />
          </button>

          {/* Pillar 3: Gestão */}
          <button
            onClick={() => navigate('/admin/customers')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              location.pathname === '/admin/customers' ? 'text-purple-600 font-black scale-105' : 'text-slate-400 font-medium'
            }`}
          >
            <Users size={20} />
            <span className="text-[10px] uppercase tracking-tighter">Gestão</span>
          </button>

          {/* Pillar 4: Financeiro */}
          <button
            onClick={() => navigate('/admin')}
            className={`flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all ${
              location.pathname === '/admin' ? 'text-emerald-600 font-black scale-105' : 'text-slate-400 font-medium'
            }`}
          >
            <TrendingUp size={20} />
            <span className="text-[10px] uppercase tracking-tighter">Financeiro</span>
          </button>

        </div>

        {/* Global Modals */}
        <CommandPalette 
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenExpense={() => setIsExpenseModalOpen(true)}
        />

        <CalculationWizardModal 
          isOpen={isCalculatorOpen}
          onClose={() => setIsCalculatorOpen(false)}
        />

        <QuickExpenseModal 
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
        />

            </main>
      </div>
    </div>
  );
}
