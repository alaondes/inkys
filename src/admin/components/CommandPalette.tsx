import React, { useState, useEffect } from 'react';
import { Search, Command, ArrowRight, ShoppingCart, Calculator, FileText, Layers, TrendingUp, UserPlus, Package, DollarSign, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCalculator: () => void;
  onOpenExpense: () => void;
}

export function CommandPalette({ isOpen, onClose, onOpenCalculator, onOpenExpense }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open via parent or event
          window.dispatchEvent(new CustomEvent('open-command-palette'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Handle live search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const results: any[] = [];
        const term = searchTerm.toLowerCase();

        // Query orders
        const ordersSnap = await getDocs(query(collection(db, 'orders'), limit(15)));
        ordersSnap.docs.forEach(doc => {
          const data = doc.data();
          if (
            doc.id.toLowerCase().includes(term) || 
            (data.customer && data.customer.toLowerCase().includes(term))
          ) {
            results.push({
              id: doc.id,
              title: `Pedido ${doc.id} - ${data.customer || 'Cliente'}`,
              type: 'Pedido',
              category: 'Vendas',
              url: `/admin/orders`
            });
          }
        });

        // Query products
        const productsSnap = await getDocs(query(collection(db, 'products'), limit(15)));
        productsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.name && data.name.toLowerCase().includes(term)) {
            results.push({
              id: doc.id,
              title: `Produto: ${data.name}`,
              type: 'Produto',
              category: 'Produção',
              url: `/admin/products`
            });
          }
        });

        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchResults, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  if (!isOpen) return null;

  const quickActions = [
    {
      id: 'act-pos',
      title: 'Criar Novo Pedido / Lançar Venda (PDV)',
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-50',
      action: () => {
        navigate('/admin/pos');
        onClose();
      }
    },
    {
      id: 'act-quotes',
      title: 'Gestão de Orçamentos & Cotações',
      icon: FileText,
      color: 'text-amber-600 bg-amber-50',
      action: () => {
        navigate('/admin/quotes');
        onClose();
      }
    },
    {
      id: 'act-calc',
      title: 'Calcular Orçamento Interativo (m²)',
      icon: Calculator,
      color: 'text-emerald-600 bg-emerald-50',
      action: () => {
        onClose();
        onOpenCalculator();
      }
    },
    {
      id: 'act-nfe',
      title: 'Emitir Nota Fiscal / Documento (NFe)',
      icon: FileText,
      color: 'text-indigo-600 bg-indigo-50',
      action: () => {
        navigate('/admin/nfe');
        onClose();
      }
    },
    {
      id: 'act-kanban',
      title: 'Fila de Produção (Kanban de Impressão)',
      icon: Layers,
      color: 'text-amber-600 bg-amber-50',
      action: () => {
        navigate('/admin/production');
        onClose();
      }
    },
    {
      id: 'act-dre',
      title: 'Ver DRE & Balancete Financeiro',
      icon: TrendingUp,
      color: 'text-emerald-600 bg-emerald-50',
      action: () => {
        navigate('/admin/dre');
        onClose();
      }
    },
    {
      id: 'act-expense',
      title: 'Registrar Despesa do Caixa',
      icon: DollarSign,
      color: 'text-rose-600 bg-rose-50',
      action: () => {
        onClose();
        onOpenExpense();
      }
    },
    {
      id: 'act-customer',
      title: 'Cadastrar Novo Cliente',
      icon: UserPlus,
      color: 'text-purple-600 bg-purple-50',
      action: () => {
        navigate('/admin/customers');
        onClose();
      }
    },
    {
      id: 'act-product',
      title: 'Cadastrar Novo Produto / Mídia',
      icon: Package,
      color: 'text-sky-600 bg-sky-50',
      action: () => {
        navigate('/admin/products');
        onClose();
      }
    }
  ];

  const filteredActions = quickActions.filter(act => 
    act.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Digite o que deseja fazer ou buscar (ex: 'Criar Pedido', 'DRE', 'Cliente')..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-base font-semibold text-slate-900 bg-transparent outline-none placeholder:text-slate-400"
          />
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Real-time search database results */}
          {searchResults.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 block">
                Resultados de Busca Direta
              </span>
              <div className="space-y-1">
                {searchResults.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => {
                      navigate(res.url);
                      onClose();
                    }}
                    className="p-3 hover:bg-blue-50 rounded-2xl cursor-pointer flex items-center justify-between group transition-colors border border-transparent hover:border-blue-200"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-blue-700">{res.title}</h4>
                      <span className="text-[10px] text-slate-500">{res.category} • {res.type}</span>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions List */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 block">
              Atalhos de Ação Rápida
            </span>
            
            <div className="space-y-1.5">
              {filteredActions.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    onClick={action.action}
                    className="p-3 hover:bg-slate-100 rounded-2xl cursor-pointer flex items-center justify-between group transition-all border border-transparent hover:border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${action.color}`}>
                        <Icon size={18} />
                      </div>
                      <span className="font-bold text-xs text-slate-800 group-hover:text-slate-950">
                        {action.title}
                      </span>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-700 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 px-5 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            Dica: Pressione <kbd className="bg-white border border-slate-300 text-slate-700 font-mono text-[10px] px-1.5 py-0.5 rounded shadow-2xs font-bold">Ctrl + K</kbd> em qualquer tela
          </span>
          <span>Esc para fechar</span>
        </div>

      </div>
    </div>
  );
}
