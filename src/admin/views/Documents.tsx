import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Printer, 
  Plus, 
  Trash2, 
  Search, 
  Save, 
  History, 
  Sparkles, 
  CheckCircle, 
  XCircle, 
  ArrowRightLeft, 
  Sliders, 
  Palette, 
  Info, 
  RefreshCw, 
  Clock, 
  AlertCircle,
  FileCheck2,
  Share2
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { formatPrice } from '../../data/products';
import { useProducts } from '../../context/ProductContext';
import { db, auth } from '../../lib/firebase';
import { withTimeout } from '../../lib/firestoreUtils';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  limit, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import toast from 'react-hot-toast';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  customer: string;
  email?: string;
  phone?: string;
  date: any;
  dateFormatted: string;
  total: number;
  items: OrderItem[];
  shippingInfo?: {
    cpf?: string;
    address?: string;
    couponDiscount?: number;
  };
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const THEMES = {
  charcoal: {
    name: 'Grafite Clássico',
    primary: 'text-gray-900',
    border: 'border-gray-900',
    accentBorder: 'border-gray-200',
    bg: 'bg-gray-50',
    badge: 'bg-gray-100 text-gray-800 border-gray-300',
    accentText: 'text-gray-600',
    fillBg: 'bg-gray-900',
    fillText: 'text-white',
    primaryHex: '#111827',
  },
  blue: {
    name: 'Azul Corporativo',
    primary: 'text-blue-700',
    border: 'border-blue-700',
    accentBorder: 'border-blue-100',
    bg: 'bg-blue-50/20',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    accentText: 'text-blue-600',
    fillBg: 'bg-blue-700',
    fillText: 'text-white',
    primaryHex: '#1d4ed8',
  },
  pink: {
    name: 'Rosa Chic',
    primary: 'text-pink-600',
    border: 'border-pink-600',
    accentBorder: 'border-pink-100',
    bg: 'bg-pink-50/20',
    badge: 'bg-pink-100 text-pink-700 border-pink-200',
    accentText: 'text-pink-500',
    fillBg: 'bg-pink-600',
    fillText: 'text-white',
    primaryHex: '#db2777',
  },
  emerald: {
    name: 'Verde Esmeralda',
    primary: 'text-emerald-700',
    border: 'border-emerald-700',
    accentBorder: 'border-emerald-100',
    bg: 'bg-emerald-50/20',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    accentText: 'text-emerald-600',
    fillBg: 'bg-emerald-700',
    fillText: 'text-white',
    primaryHex: '#047857',
  },
  amber: {
    name: 'Dourado Elegante',
    primary: 'text-amber-700',
    border: 'border-amber-700',
    accentBorder: 'border-amber-100',
    bg: 'bg-amber-50/20',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    accentText: 'text-amber-600',
    fillBg: 'bg-amber-700',
    fillText: 'text-white',
    primaryHex: '#b45309',
  }
};

const FONTS = {
  sans: { name: 'Inter (Sans)', class: 'font-sans' },
  serif: { name: 'Playfair (Serif)', class: 'font-serif' },
  mono: { name: 'JetBrains (Mono)', class: 'font-mono text-sm' }
};

export function Documents() {
  const { settings } = useSettings();
  const { products } = useProducts();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<'generator' | 'history'>('generator');

  // Document Fields
  const [docType, setDocType] = useState<'receipt' | 'quote'>('quote');
  const [customerName, setCustomerName] = useState('');
  const [customerDoc, setCustomerDoc] = useState(''); // CPF/CNPJ
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState(''); // For quote
  const [items, setItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [quoteStatus, setQuoteStatus] = useState<'Pendente' | 'Aprovado' | 'Rejeitado'>('Pendente');

  const getSafeStorage = (key: string, defaultVal: string) => {
    try { return localStorage.getItem(key) || defaultVal; } catch { return defaultVal; }
  };
  const setSafeStorage = (key: string, val: string) => {
    try { localStorage.setItem(key, val); } catch {}
  };

  // Emitter Details (customised & loaded from localStorage)
  const [emitterName, setEmitterName] = useState(() => {
    const cached = getSafeStorage('doc_emitter_name', '');
    if (cached === 'Amo Canecas') {
      return settings.storeName || 'inkys';
    }
    return cached || settings.storeName || 'inkys';
  });
  const [emitterDoc, setEmitterDoc] = useState(() => getSafeStorage('doc_emitter_doc', ''));
  const [emitterAddress, setEmitterAddress] = useState(() => getSafeStorage('doc_emitter_address', ''));
  
  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentConditions, setPaymentConditions] = useState('');

  // Design/Theme Choices
  const [documentTheme, setDocumentTheme] = useState<keyof typeof THEMES>(() => (getSafeStorage('doc_theme', 'charcoal') as any));
  const [documentFont, setDocumentFont] = useState<keyof typeof FONTS>('sans');
  const [watermarkText, setWatermarkText] = useState('');

  // Order loading state
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [showOrderDropdown, setShowOrderDropdown] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Client list autocomplete
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Saved documents history state
  const [savedDocuments, setSavedDocuments] = useState<any[]>([]);
  const [selectedSavedDocId, setSelectedSavedDocId] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'quote' | 'receipt'>('all');
  const [isSaving, setIsSaving] = useState(false);

  // Sync Emitter info to localStorage
  useEffect(() => {
    setSafeStorage('doc_emitter_name', emitterName);
    setSafeStorage('doc_emitter_doc', emitterDoc);
    setSafeStorage('doc_emitter_address', emitterAddress);
  }, [emitterName, emitterDoc, emitterAddress]);

  // Sync Theme to localStorage
  useEffect(() => {
    setSafeStorage('doc_theme', documentTheme);
  }, [documentTheme]);

  // Sync Store Logo or name changes
  useEffect(() => {
    if (!emitterName && settings.storeName) {
      setEmitterName(settings.storeName);
    }
  }, [settings.storeName]);

  // Load orders for importing
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'), limit(100));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        let formattedDate = 'Data Indisponível';
        if (data.date?.toDate) {
          const d = data.date.toDate();
          formattedDate = d.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric'
          });
        }
        return {
          id: doc.id,
          customer: data.customer || 'Cliente não identificado',
          date: data.date,
          dateFormatted: formattedDate,
          total: data.total || 0,
          items: data.items || [],
          shippingInfo: data.shippingInfo || null,
        } as Order;
      });
      setOrders(ordersData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, []);

  // Load saved documents history
  useEffect(() => {
    const q = query(collection(db, 'documents'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedDocuments(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
    });

    return () => unsubscribe();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOrderDropdown(false);
      }
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef, clientDropdownRef]);

  // Clients mapping from orders
  const uniqueClients = React.useMemo(() => {
    const clientsMap = new Map<string, { name: string; cpf: string; email?: string; phone?: string }>();
    orders.forEach(order => {
      const name = order.customer?.trim();
      const cpf = order.shippingInfo?.cpf?.trim() || '';
      const email = order.email?.trim() || '';
      const phone = order.phone?.trim() || '';
      if (name) {
        const key = name.toLowerCase();
        if (!clientsMap.has(key)) {
          clientsMap.set(key, { name, cpf, email, phone });
        } else {
          const existing = clientsMap.get(key)!;
          if (cpf && !existing.cpf) existing.cpf = cpf;
          if (email && !existing.email) existing.email = email;
          if (phone && !existing.phone) existing.phone = phone;
        }
      }
    });
    return Array.from(clientsMap.values());
  }, [orders]);

  const filteredClients = React.useMemo(() => {
    const term = customerName.toLowerCase().trim();
    if (!term) return uniqueClients;
    return uniqueClients.filter(c => 
      c.name.toLowerCase().includes(term) || 
      (c.cpf && c.cpf.toLowerCase().includes(term))
    );
  }, [customerName, uniqueClients]);

  // Load order data helper
  const handleLoadOrder = (order: Order) => {
    setSelectedOrderId(order.id);
    setCustomerName(order.customer);
    setCustomerDoc(order.shippingInfo?.cpf || '');
    setCustomerEmail(order.email || '');
    setCustomerPhone(order.phone || '');
    
    if (order.items && order.items.length > 0) {
      setItems(order.items.map(item => ({
        description: item.name,
        quantity: item.quantity || 1,
        unitPrice: item.price || 0
      })));
    } else {
      setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    }

    setDiscount(order.shippingInfo?.couponDiscount || 0);
    setNotes(`Referente ao pedido realizado em ${order.dateFormatted}.\nID do pedido: #${order.id}`);
    
    setShowOrderDropdown(false);
    setOrderSearch('');
    toast.success(`Pedido de ${order.customer} importado!`);
  };

  const clearLoadedOrder = () => {
    setSelectedOrderId(null);
    setSelectedSavedDocId(null);
    setCustomerName('');
    setCustomerDoc('');
    setCustomerEmail('');
    setCustomerPhone('');
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setDiscount(0);
    setNotes('');
    setPaymentMethod('');
    setPaymentConditions('');
    toast.success('Campos reiniciados');
  };

  const filteredOrders = orders.filter(o => {
    const term = orderSearch.toLowerCase();
    const matchesId = o.id.toLowerCase().includes(term);
    const matchesCustomer = o.customer.toLowerCase().includes(term);
    const matchesCpf = o.shippingInfo?.cpf ? o.shippingInfo.cpf.toLowerCase().includes(term) : false;
    return matchesId || matchesCustomer || matchesCpf;
  });

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleDescriptionChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], description: value };
    
    const product = products.find(p => p.name === value);
    if (product && newItems[index].unitPrice === 0) {
      newItems[index].unitPrice = product.price;
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const total = subtotal - discount;

  // Save or update document to database history
  const handleSaveDocument = async () => {
    if (!customerName) {
      toast.error('O nome do cliente é obrigatório.');
      return;
    }

    setIsSaving(true);
    const docPayload = {
      type: docType,
      date,
      customerName,
      customerDoc,
      customerEmail,
      customerPhone,
      items,
      discount,
      subtotal,
      total,
      notes,
      paymentMethod,
      paymentConditions,
      validUntil: docType === 'quote' ? validUntil : '',
      status: docType === 'quote' ? quoteStatus : 'Faturado',
      emitter: {
        name: emitterName,
        doc: emitterDoc,
        address: emitterAddress,
      },
      design: {
        theme: documentTheme,
        font: documentFont,
        watermark: watermarkText,
      },
      createdAt: new Date().toISOString()
    };

    try {
      if (selectedSavedDocId) {
        await withTimeout(updateDoc(doc(db, 'documents', selectedSavedDocId), docPayload));
        toast.success('Documento atualizado no histórico!');
      } else {
        const ref = await withTimeout(addDoc(collection(db, 'documents'), docPayload));
        setSelectedSavedDocId(ref.id);
        toast.success('Documento salvo no histórico de emissões!');
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'documents');
    } finally {
      setIsSaving(false);
    }
  };

  // Load saved document back into the editor
  const handleLoadSavedDoc = (savedDoc: any) => {
    setSelectedSavedDocId(savedDoc.id);
    setDocType(savedDoc.type);
    setDate(savedDoc.date);
    setCustomerName(savedDoc.customerName);
    setCustomerDoc(savedDoc.customerDoc || '');
    setCustomerEmail(savedDoc.customerEmail || '');
    setCustomerPhone(savedDoc.customerPhone || '');
    setItems(savedDoc.items || [{ description: '', quantity: 1, unitPrice: 0 }]);
    setDiscount(savedDoc.discount || 0);
    setNotes(savedDoc.notes || '');
    setPaymentMethod(savedDoc.paymentMethod || '');
    setPaymentConditions(savedDoc.paymentConditions || '');
    
    if (savedDoc.type === 'quote') {
      setValidUntil(savedDoc.validUntil || '');
      setQuoteStatus(savedDoc.status || 'Pendente');
    }

    if (savedDoc.emitter) {
      setEmitterName(savedDoc.emitter.name || '');
      setEmitterDoc(savedDoc.emitter.doc || '');
      setEmitterAddress(savedDoc.emitter.address || '');
    }

    if (savedDoc.design) {
      setDocumentTheme(savedDoc.design.theme || 'charcoal');
      setDocumentFont(savedDoc.design.font || 'sans');
      setWatermarkText(savedDoc.design.watermark || '');
    }

    setActiveTab('generator');
    toast.success('Documento carregado no editor para alteração / reemissão.');
  };

  // Convert Quote into a Payment Receipt directly
  const handleConvertQuoteToReceipt = async (savedDoc: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Deseja converter o Orçamento de ${savedDoc.customerName} em um Recibo faturado?`)) {
      return;
    }

    setIsSaving(true);
    const convertedPayload = {
      ...savedDoc,
      type: 'receipt',
      status: 'Faturado',
      notes: `Recibo faturado gerado a partir do Orçamento #${savedDoc.id.substring(0, 8)}.\n\n${savedDoc.notes || ''}`,
      createdAt: new Date().toISOString()
    };
    delete convertedPayload.id;

    try {
      await withTimeout(addDoc(collection(db, 'documents'), convertedPayload));
      toast.success('Convertido em Recibo de Pagamento com sucesso!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'documents');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete saved document from database
  const handleDeleteSavedDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja remover este documento do histórico?')) {
      return;
    }

    try {
      await withTimeout(deleteDoc(doc(db, 'documents', id)));
      if (selectedSavedDocId === id) {
        setSelectedSavedDocId(null);
      }
      toast.success('Documento excluído do histórico.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `documents/${id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter saved docs
  const filteredHistory = savedDocuments.filter(doc => {
    const searchMatch = 
      doc.customerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      doc.id.toLowerCase().includes(historySearch.toLowerCase()) ||
      (doc.customerDoc && doc.customerDoc.includes(historySearch)) ||
      (doc.notes && doc.notes.toLowerCase().includes(historySearch.toLowerCase()));

    const typeMatch = historyFilter === 'all' || doc.type === historyFilter;

    return searchMatch && typeMatch;
  });

  const selectedTheme = THEMES[documentTheme] || THEMES.charcoal;
  const fontClass = FONTS[documentFont]?.class || 'font-sans';

  return (
    <div className="space-y-6">
      {/* Header Info - Screen Only */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900 flex items-center gap-2">
            <FileText className="text-pink-600" size={24} /> Painel de Documentos
          </h1>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mt-1">
            Geração profissional de orçamentos e recibos corporativos
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'generator' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Sliders size={14} /> Emissor
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all relative ${
              activeTab === 'history' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <History size={14} /> Histórico
            {savedDocuments.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-black animate-pulse">
                {savedDocuments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'generator' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:block print:w-full text-gray-900">
          
          {/* EDITOR COLUMN (Hidden on printing) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 print:hidden">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-gray-500 uppercase">Ações do Emissor:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveDocument}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  <Save size={14} /> {selectedSavedDocId ? 'Atualizar Salvo' : 'Salvar Histórico'}
                </button>
                <button
                  onClick={clearLoadedOrder}
                  className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-colors"
                >
                  Limpar
                </button>
              </div>
            </div>

            {/* Quick Import Dropdown */}
            <div ref={dropdownRef} className="bg-pink-50/25 p-4 rounded-xl border border-pink-100/60 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-pink-700 flex items-center gap-1.5">
                  <Sparkles size={14} /> Importar dados de Pedido
                </span>
                {selectedOrderId && (
                  <span className="text-[10px] font-bold text-green-700 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    Ativo: #{selectedOrderId.substring(0, 8)}
                  </span>
                )}
              </div>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Pesquise por ID do pedido, cliente ou CPF para preencher..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setShowOrderDropdown(true);
                  }}
                  onFocus={() => setShowOrderDropdown(true)}
                  className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-xs outline-none focus:border-pink-500 transition-all shadow-2xs"
                />
                <Search size={14} className="absolute left-3 top-3.5 text-gray-400 pointer-events-none" />
                {orderSearch && (
                  <button 
                    type="button"
                    onClick={() => { setOrderSearch(''); setShowOrderDropdown(false); }}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    Limpar
                  </button>
                )}

                {showOrderDropdown && (
                  <div className="absolute z-30 left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-100">
                    {filteredOrders.length === 0 ? (
                      <div className="p-4 text-xs text-gray-400 text-center font-medium">Nenhum pedido encontrado</div>
                    ) : (
                      filteredOrders.map(order => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => handleLoadOrder(order)}
                          className="w-full text-left p-3 hover:bg-pink-50/30 transition-colors flex flex-col gap-1 focus:outline-none"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-black text-gray-900">#{order.id.substring(0, 8)}</span>
                            <span className="text-xs font-black text-pink-600">{formatPrice(order.total)}</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px] text-gray-500 font-medium">
                            <span className="truncate max-w-[180px]">{order.customer}</span>
                            <span>{order.dateFormatted}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Document Core Configuration */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">1. Tipo & Datas</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Tipo do Documento</label>
                  <select 
                    value={docType} 
                    onChange={(e) => setDocType(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  >
                    <option value="quote">Orçamento</option>
                    <option value="receipt">Recibo de Pagamento</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Data de Emissão</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {docType === 'quote' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Validade da Proposta</label>
                    <input 
                      type="date" 
                      value={validUntil} 
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Status do Orçamento</label>
                    <select 
                      value={quoteStatus} 
                      onChange={(e) => setQuoteStatus(e.target.value as any)}
                      className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Aprovado">Aprovado</option>
                      <option value="Rejeitado">Rejeitado</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Emitter Configuration (Your Info) */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center justify-between">
                <span>2. Dados do Emissor (Sua Loja)</span>
                <span className="text-[10px] lowercase text-gray-400 font-medium">Salva automático no navegador</span>
              </h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Nome Fantasia / Razão Social" 
                  value={emitterName}
                  onChange={(e) => setEmitterName(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    placeholder="CNPJ ou CPF do Emissor" 
                    value={emitterDoc}
                    onChange={(e) => setEmitterDoc(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  />
                  <input 
                    type="text" 
                    placeholder="Endereço / Telefone" 
                    value={emitterAddress}
                    onChange={(e) => setEmitterAddress(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            {/* Client Details */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">3. Dados do Destinatário (Cliente)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative" ref={clientDropdownRef}>
                  <input 
                    type="text" 
                    placeholder="Nome do Cliente" 
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowClientDropdown(true);
                    }}
                    onFocus={() => setShowClientDropdown(true)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  />
                  {showClientDropdown && (
                    <div className="absolute z-30 left-0 right-0 mt-1 max-h-44 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl divide-y divide-gray-100">
                      {filteredClients.length === 0 ? (
                        <div className="p-3 text-xs text-gray-400 text-center font-medium">Nenhum cliente cadastrado</div>
                      ) : (
                        filteredClients.map((client, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setCustomerName(client.name);
                              if (client.cpf) setCustomerDoc(client.cpf);
                              if (client.email) setCustomerEmail(client.email);
                              if (client.phone) setCustomerPhone(client.phone);
                              setShowClientDropdown(false);
                            }}
                            className="w-full text-left p-2.5 hover:bg-pink-50/20 transition-colors flex flex-col gap-0.5 focus:outline-none"
                          >
                            <span className="text-xs font-bold text-gray-900">{client.name}</span>
                            {client.cpf && <span className="text-[10px] text-gray-400">CPF: {client.cpf}</span>}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>

                <input 
                  type="text" 
                  placeholder="CPF ou CNPJ do Cliente" 
                  value={customerDoc}
                  onChange={(e) => setCustomerDoc(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                />

                <input 
                  type="email" 
                  placeholder="E-mail (Opcional)" 
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                />

                <input 
                  type="text" 
                  placeholder="Telefone (Opcional)" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Document Line Items */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">4. Itens do Documento</h3>
                <button 
                  onClick={addItem} 
                  className="text-pink-600 text-xs font-extrabold flex items-center gap-1 hover:underline"
                >
                  <Plus size={14} /> Adicionar Linha
                </button>
              </div>

              <datalist id="registered-products-list">
                {products.map(p => (
                  <option key={p.id} value={p.name} />
                ))}
              </datalist>

              <div className="space-y-2.5">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2 border-b border-gray-100 pb-3 sm:pb-0 sm:border-0 last:border-0 items-start">
                    <input 
                      type="text" 
                      list="registered-products-list"
                      placeholder="Descrição do Serviço ou Produto" 
                      value={item.description}
                      onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                      className="flex-1 w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                    />
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Qtd" 
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-16 bg-white border border-gray-200 rounded-xl p-2.5 text-xs text-center outline-none focus:border-pink-500"
                      />
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        placeholder="Valor Unit." 
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-24 bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                      />
                      <button 
                        onClick={() => removeItem(idx)}
                        className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl shrink-0 self-center transition-colors disabled:opacity-30"
                        disabled={items.length === 1}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400">5. Condições Financeiras</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Desconto (R$)</label>
                  <input 
                    type="number" 
                    min="0"
                    step="0.01"
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Meio de Pagamento</label>
                  <select 
                    value={paymentMethod} 
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                  >
                    <option value="">Selecione...</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                    <option value="Boleto Bancário">Boleto Bancário</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Transferência Bancária">Transferência Bancária (TED/DOC)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase mb-1.5">Condições de Pagamento</label>
                <input 
                  type="text" 
                  placeholder="Ex: 50% de sinal e 50% na entrega, ou em até 3x sem juros" 
                  value={paymentConditions}
                  onChange={(e) => setPaymentConditions(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Design customization & Visual details */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Palette size={14} className="text-gray-400" /> 6. Estilo Visual do Documento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Paleta / Tema</label>
                  <select 
                    value={documentTheme} 
                    onChange={(e) => setDocumentTheme(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-pink-500"
                  >
                    {Object.entries(THEMES).map(([k, t]) => (
                      <option key={k} value={k}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Tipografia</label>
                  <select 
                    value={documentFont} 
                    onChange={(e) => setDocumentFont(e.target.value as any)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-pink-500"
                  >
                    {Object.entries(FONTS).map(([k, f]) => (
                      <option key={k} value={k}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Texto Marca d'Água</label>
                  <select 
                    value={watermarkText} 
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs outline-none focus:border-pink-500"
                  >
                    <option value="">Nenhuma</option>
                    <option value="PROPOSTA">PROPOSTA</option>
                    <option value="PAGO">PAGO</option>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="CÓPIA">CÓPIA</option>
                    <option value="REVISADO">REVISADO</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-2 border-t border-gray-100 pt-4">
              <span className="block text-xs font-black text-gray-500 uppercase">Observações Complementares</span>
              <textarea 
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl p-2.5 text-xs outline-none focus:border-pink-500 resize-none"
                placeholder="Termos de devolução, garantia ou agradecimento..."
              />
            </div>

          </div>

          {/* PREVIEW COLUMN (Always visible, expands full-screen on print) */}
          <div className="space-y-4 print:space-y-0">
            {/* Top Preview Banner (Hidden on printing) */}
            <div className="flex justify-between items-center bg-gray-900 text-white p-4 rounded-2xl print:hidden shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-widest">Visualização em Tempo Real</span>
              </div>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white hover:bg-gray-100 text-gray-900 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                <Printer size={13} /> Imprimir / PDF
              </button>
            </div>

            {/* Document Printable Sheet */}
            <div className={`bg-white p-8 sm:p-12 rounded-2xl border border-gray-200 shadow-sm print:shadow-none print:border-none print:p-0 min-h-[750px] relative overflow-hidden flex flex-col justify-between ${fontClass}`}>
              
              {/* Optional Watermark */}
              {watermarkText && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.06] z-0">
                  <span className="text-[7.5rem] font-black tracking-widest uppercase rotate-[25deg] border-8 border-gray-900 px-8 py-2 rounded-3xl">
                    {watermarkText}
                  </span>
                </div>
              )}

              <div className="relative z-10 space-y-8">
                {/* Store Header */}
                <div className={`flex flex-col sm:flex-row justify-between items-start gap-4 border-b-2 pb-6 ${selectedTheme.border}`}>
                  <div>
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl || undefined} alt="Logo" className="h-16 object-contain mb-3" />
                    ) : (
                      <h2 className="text-2xl font-black tracking-tight uppercase mb-2 text-gray-900">
                        {settings.storeName || 'Minha Loja'}
                      </h2>
                    )}
                    {/* Emitter info block */}
                    <div className="text-[11px] text-gray-500 space-y-0.5 font-medium leading-relaxed">
                      {emitterName && <p className="font-extrabold text-gray-700">{emitterName}</p>}
                      {emitterDoc && <p>CNPJ/CPF: {emitterDoc}</p>}
                      {emitterAddress && <p>{emitterAddress}</p>}
                    </div>
                  </div>
                  
                  <div className="text-right sm:text-right w-full sm:w-auto">
                    <h1 className={`text-3xl font-black uppercase tracking-wider mb-2 ${selectedTheme.primary}`}>
                      {docType === 'quote' ? 'Orçamento' : 'Recibo'}
                    </h1>
                    <div className="text-xs text-gray-600 space-y-1 font-medium">
                      <p><strong>Data de Emissão:</strong> {date.split('-').reverse().join('/')}</p>
                      {docType === 'quote' && validUntil && (
                        <p className="text-red-600"><strong>Válido até:</strong> {validUntil.split('-').reverse().join('/')}</p>
                      )}
                      {selectedSavedDocId && (
                        <p className="text-[10px] text-gray-400">Doc ID: #{selectedSavedDocId.substring(0, 10)}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recipient / Client Block */}
                <div className={`bg-gray-50 p-5 rounded-xl border border-gray-100 ${selectedTheme.bg} print:bg-transparent print:p-0 print:border-b print:border-gray-200 print:rounded-none`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5">Destinatário / Cliente</p>
                  <p className="text-base font-extrabold text-gray-900">{customerName || 'Cliente Consumidor'}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5 text-xs text-gray-600 font-medium">
                    {customerDoc && (
                      <p><strong>CPF/CNPJ:</strong> {customerDoc}</p>
                    )}
                    {customerPhone && (
                      <p><strong>WhatsApp:</strong> {customerPhone}</p>
                    )}
                    {customerEmail && (
                      <p className="truncate"><strong>E-mail:</strong> {customerEmail}</p>
                    )}
                  </div>
                </div>

                {/* Product/Service Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b-2 text-xs font-black uppercase tracking-wider text-gray-400 ${selectedTheme.border}`}>
                        <th className="py-3 pl-2">Descrição dos Itens / Serviços</th>
                        <th className="py-3 text-center w-16">Qtd</th>
                        <th className="py-3 text-right w-24">V. Unit.</th>
                        <th className="py-3 text-right pr-2 w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.filter(item => item.description || item.unitPrice > 0).map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 text-xs">
                          <td className="py-3 pl-2 font-semibold text-gray-900 leading-relaxed">
                            {item.description || 'Item sem descrição'}
                          </td>
                          <td className="py-3 text-center text-gray-600 font-medium">{item.quantity}</td>
                          <td className="py-3 text-right text-gray-600 font-semibold">{formatPrice(item.unitPrice)}</td>
                          <td className="py-3 text-right pr-2 font-extrabold text-gray-900">{formatPrice(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Payment Options */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-4 border-t border-gray-50">
                  
                  {/* Left Column: Payment terms inside printable receipt */}
                  <div className="text-xs space-y-2 max-w-sm">
                    {paymentMethod && (
                      <p className="text-gray-700">
                        <strong>Meio de Pagamento:</strong> <span className="bg-gray-100 px-2 py-0.5 rounded-md font-bold">{paymentMethod}</span>
                      </p>
                    )}
                    {paymentConditions && (
                      <p className="text-gray-600 leading-relaxed">
                        <strong>Condições:</strong> {paymentConditions}
                      </p>
                    )}
                    {docType === 'quote' && (
                      <div className="flex items-center gap-1.5">
                        <strong>Status:</strong>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          quoteStatus === 'Aprovado' 
                            ? 'bg-green-100 text-green-800' 
                            : quoteStatus === 'Rejeitado' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {quoteStatus}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Calculations */}
                  <div className="w-full sm:w-64 space-y-2 text-xs font-medium">
                    <div className="flex justify-between text-gray-500">
                      <span>Subtotal:</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-red-600 font-bold">
                        <span>Desconto:</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className={`flex justify-between text-lg font-black border-t-2 pt-2 text-gray-900 ${selectedTheme.border}`}>
                      <span>Total Geral:</span>
                      <span className={`${selectedTheme.primary}`}>{formatPrice(total)}</span>
                    </div>
                  </div>

                </div>

                {/* Print notes block */}
                {notes && (
                  <div className="text-xs text-gray-600 border-t border-gray-100 pt-4 bg-gray-50/50 p-4 rounded-xl leading-relaxed">
                    <p className="font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">Observações:</p>
                    <p className="whitespace-pre-line font-medium">{notes}</p>
                  </div>
                )}
              </div>

              {/* Bottom Declaration (Always at page footer on print) */}
              <div className="mt-8 border-t border-gray-100 pt-6 text-center text-[10px] text-gray-400">
                <div>
                  {docType === 'receipt' ? (
                    <p className="font-medium">Recebemos de {customerName || 'Cliente'} a quantia líquida de {formatPrice(total)} descrita acima.</p>
                  ) : (
                    <p className="font-medium">Este documento trata-se de uma proposta comercial sujeita a aprovação das partes.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* DATABASE DOCUMENT ARCHIVE TAB */
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6 text-gray-900">
          
          {/* Filters & search */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                placeholder="Buscar por cliente, notas, ID do documento..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-pink-500"
              />
              <Search size={14} className="absolute left-3 top-3 text-gray-400" />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  historyFilter === 'all' 
                    ? 'bg-gray-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Todos ({savedDocuments.length})
              </button>
              <button
                onClick={() => setHistoryFilter('quote')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  historyFilter === 'quote' 
                    ? 'bg-pink-100 text-pink-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Orçamentos ({savedDocuments.filter(d => d.type === 'quote').length})
              </button>
              <button
                onClick={() => setHistoryFilter('receipt')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                  historyFilter === 'receipt' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Recibos ({savedDocuments.filter(d => d.type === 'receipt').length})
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                <FileText className="text-gray-300 mb-2" size={44} />
                <p className="text-xs font-extrabold text-gray-500 uppercase tracking-widest">Nenhum documento salvo encontrado</p>
                <p className="text-[11px] text-gray-400 mt-1 max-w-sm">
                  Crie orçamentos ou recibos na aba Emissor e clique em "Salvar Histórico" para armazená-los permanentemente na nuvem.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map((savedDoc) => {
                  const itemsCount = savedDoc.items?.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0) || 0;
                  const themeColors = THEMES[savedDoc.design?.theme as keyof typeof THEMES] || THEMES.charcoal;
                  
                  return (
                    <div 
                      key={savedDoc.id}
                      onClick={() => handleLoadSavedDoc(savedDoc)}
                      className="bg-white hover:bg-gray-50/40 border border-gray-100 hover:border-gray-300 p-5 rounded-2xl cursor-pointer transition-all flex flex-col justify-between h-56 shadow-2xs group relative"
                    >
                      {/* Top Row Info */}
                      <div>
                        <div className="flex justify-between items-start">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                            savedDoc.type === 'quote' 
                              ? 'bg-pink-50 text-pink-800 border-pink-100' 
                              : 'bg-green-50 text-green-800 border-green-100'
                          }`}>
                            {savedDoc.type === 'quote' ? 'Orçamento' : 'Recibo'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-bold">
                            #{savedDoc.id.substring(0, 8)}
                          </span>
                        </div>

                        <h3 className="font-extrabold text-sm text-gray-900 mt-3.5 group-hover:text-pink-600 transition-colors line-clamp-1">
                          {savedDoc.customerName}
                        </h3>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1.5">
                          <Clock size={11} />
                          <span>Emitido em: {savedDoc.date.split('-').reverse().join('/')}</span>
                        </div>

                        {savedDoc.notes && (
                          <p className="text-[10px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                            {savedDoc.notes}
                          </p>
                        )}
                      </div>

                      {/* Bottom row value & quick convert */}
                      <div className="flex justify-between items-center border-t border-gray-50 pt-3 mt-3">
                        <div>
                          <p className="text-[9px] uppercase font-bold text-gray-400">Total Geral</p>
                          <p className="text-sm font-black text-gray-900">{formatPrice(savedDoc.total)}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* Convert Quote to Receipt Quick Action */}
                          {savedDoc.type === 'quote' && savedDoc.status !== 'Aprovado' && (
                            <button
                              type="button"
                              onClick={(e) => handleConvertQuoteToReceipt(savedDoc, e)}
                              title="Faturar e converter em Recibo"
                              className="p-1.5 text-gray-500 hover:text-green-700 bg-gray-50 hover:bg-green-50 rounded-lg border border-gray-100 transition-all"
                            >
                              <ArrowRightLeft size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteSavedDoc(savedDoc.id, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg border border-gray-100 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
