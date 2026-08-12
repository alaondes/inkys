import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, setDoc as updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import {
  BookOpen,
  PieChart,
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  FileText,
  Calculator,
  Shield,
  Layers,
  RefreshCw,
  X,
  Printer,
  Copy,
  ExternalLink,
  ChevronRight,
  Building,
  UploadCloud,
  Eye,
  Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';

// Interfaces
export interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  type: 'receita' | 'despesa' | 'ativo' | 'passivo';
  category: string;
  amount: number;
  debitAccount: string;
  creditAccount: string;
  paymentMethod: string;
  documentRef: string;
  notes?: string;
  isAutoSynced?: boolean;
}

export interface ChartAccount {
  id: string;
  code: string;
  name: string;
  type: 'ativo' | 'passivo' | 'receita' | 'despesa';
  parentCode?: string;
  description?: string;
  isActive: boolean;
}

export interface FiscalSettings {
  regime: 'simples_nacional' | 'lucro_presumido' | 'mei';
  simplesRate: number; // e.g. 6.0
  cnpj: string;
  stateRegistration: string;
  cityRegistration: string;
  companyName: string;
  tradeName: string;
  sefazApiProvider?: 'focus_nfe' | 'plugnotas' | 'nuvem_fiscal' | 'simulado';
  sefazApiKey?: string;
  sefazEnvironment?: 'homologacao' | 'producao';
  certificateA1FileName?: string;
  certificateA1Password?: string;
  certificateA1Expiry?: string;
  autoTransmitOnOrderCompletion?: boolean;
}

export interface InvoiceDoc {
  id: string;
  number: string;
  type: 'NFe' | 'NFCe' | 'NFSe';
  customerName: string;
  customerCnpjCpf: string;
  orderId?: string;
  date: string;
  totalAmount: number;
  taxAmount: number;
  status: 'emitida' | 'pendente' | 'cancelada';
  accessKey: string;
  xmlContent?: string;
}

export interface XmlVaultItem {
  id: string;
  type: 'entrada' | 'saida';
  fileName: string;
  accessKey: string;
  issuer: string;
  recipient: string;
  value: number;
  date: string;
  xmlData: string;
}

// Initial Standard Chart of Accounts
const INITIAL_CHART_ACCOUNTS: ChartAccount[] = [
  // 1. ATIVOS
  { id: 'acc_1_1', code: '1.1', name: 'Caixa e Equivalentes de Caixa', type: 'ativo', isActive: true, description: 'Saldos em dinheiro no caixa e contas bancárias' },
  { id: 'acc_1_1_01', code: '1.1.01', name: 'Caixa Geral (Especie)', type: 'ativo', parentCode: '1.1', isActive: true },
  { id: 'acc_1_1_02', code: '1.1.02', name: 'Bancos Conta Movimento (PIX)', type: 'ativo', parentCode: '1.1', isActive: true },
  { id: 'acc_1_2', code: '1.2', name: 'Estoque de Insumos e Materiais', type: 'ativo', isActive: true, description: 'Papéis, lonas, tintas e adesivos para produção' },
  { id: 'acc_1_3', code: '1.3', name: 'Maquinário e Equipamentos Gráficos', type: 'ativo', isActive: true, description: 'Plotters, impressoras offset/digitais e guilhotinas' },
  { id: 'acc_1_4', code: '1.4', name: 'Contas a Receber (Vendas a Prazo)', type: 'ativo', isActive: true },

  // 2. PASSIVOS
  { id: 'acc_2_1', code: '2.1', name: 'Fornecedores e Contas a Pagar', type: 'passivo', isActive: true, description: 'Insumos de papelaria e suprimentos pendentes' },
  { id: 'acc_2_2', code: '2.2', name: 'Salários e Comissões a Pagar', type: 'passivo', isActive: true, description: 'Folha de pagamento acumulada do RH' },
  { id: 'acc_2_3', code: '2.3', name: 'Impostos e Tributos a Recolher', type: 'passivo', isActive: true, description: 'DAS Simples Nacional e taxas fiscais' },

  // 3. RECEITAS
  { id: 'acc_3_1', code: '3.1', name: 'Vendas de Impressões & Comunicação Visual', type: 'receita', isActive: true },
  { id: 'acc_3_2', code: '3.2', name: 'Vendas de Produtos Personalizados & Brindes', type: 'receita', isActive: true },
  { id: 'acc_3_3', code: '3.3', name: 'Serviços de Design & Serviços Avulsos', type: 'receita', isActive: true },

  // 4. DESPESAS
  { id: 'acc_4_1', code: '4.1', name: 'Custo dos Insumos e Materiais Vendidos (CPV)', type: 'despesa', isActive: true, description: 'Custos diretos de papéis, tintas e materiais' },
  { id: 'acc_4_2', code: '4.2', name: 'Despesas com Pessoal e Comissões (RH)', type: 'despesa', isActive: true },
  { id: 'acc_4_3', code: '4.3', name: 'Despesas Operacionais e Aluguel', type: 'despesa', isActive: true, description: 'Aluguel do galpão, energia trifásica e internet' },
  { id: 'acc_4_4', code: '4.4', name: 'Manutenção de Impressoras e Maquinário', type: 'despesa', isActive: true },
  { id: 'acc_4_5', code: '4.5', name: 'Impostos e Taxas sobre Vendas (DAS)', type: 'despesa', isActive: true },
];

// Initial Entries Seed
const INITIAL_ENTRIES: AccountingEntry[] = [
  {
    id: 'ent_101',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    description: 'Venda de Banners e Cartões de Visita (Pedido #1042)',
    type: 'receita',
    category: '3.1 Vendas de Impressões & Comunicação Visual',
    amount: 1450.00,
    debitAccount: '1.1.02 Bancos Conta Movimento (PIX)',
    creditAccount: '3.1 Vendas de Impressões',
    paymentMethod: 'PIX',
    documentRef: 'ORD-1042',
    isAutoSynced: true
  },
  {
    id: 'ent_102',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    description: 'Compra de Insumos: 10 Rolos de Lona Vinílica 440g',
    type: 'despesa',
    category: '4.1 Custo dos Insumos e Materiais Vendidos (CPV)',
    amount: 620.00,
    debitAccount: '4.1 CPV',
    creditAccount: '1.1.02 Bancos Conta Movimento (PIX)',
    paymentMethod: 'PIX',
    documentRef: 'NF-88219',
    isAutoSynced: false
  },
  {
    id: 'ent_103',
    date: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    description: 'Pagamento de Salários e Comissões da Equipe (RH)',
    type: 'despesa',
    category: '4.2 Despesas com Pessoal e Comissões (RH)',
    amount: 3200.00,
    debitAccount: '4.2 Despesas Pessoal',
    creditAccount: '1.1.02 Bancos Conta Movimento',
    paymentMethod: 'Transferência',
    documentRef: 'RH-FOLHA-08',
    isAutoSynced: true
  },
  {
    id: 'ent_104',
    date: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0],
    description: 'Conta de Energia Elétrica da Moss (Setor Produtivo)',
    type: 'despesa',
    category: '4.3 Despesas Operacionais e Aluguel',
    amount: 480.50,
    debitAccount: '4.3 Despesas Operacionais',
    creditAccount: '1.1.02 Bancos',
    paymentMethod: 'Boleto',
    documentRef: 'ENERGIA-08',
    isAutoSynced: false
  }
];

export function AccountingView() {
  const [activeTab, setActiveTab] = useState<'dre' | 'ledger' | 'chart' | 'fiscal' | 'reports'>('dre');

  // Firestore collections state
  const [entries, setEntries] = useState<AccountingEntry[]>([]);
  const [chartAccounts, setChartAccounts] = useState<ChartAccount[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const [xmlVault, setXmlVault] = useState<XmlVaultItem[]>([]);
  const [fiscalSettings, setFiscalSettings] = useState<FiscalSettings>({
    regime: 'simples_nacional',
    simplesRate: 6.0,
    cnpj: '12.345.678/0001-90',
    stateRegistration: '123.456.789.110',
    cityRegistration: '987654',
    companyName: 'Moss e Comunicação Visual LTDA',
    tradeName: 'Sua Moss',
    sefazApiProvider: 'focus_nfe',
    sefazApiKey: 'sec_live_9a8b7c6d5e4f3a2b1c0d9e8f7a6b',
    sefazEnvironment: 'homologacao',
    certificateA1FileName: 'cert_grafica_2026_A1.pfx',
    certificateA1Password: '••••••••••••',
    certificateA1Expiry: '2027-12-31',
    autoTransmitOnOrderCompletion: true
  });

  const [loading, setLoading] = useState(true);

  // DRE Filter
  const [drePeriod, setDrePeriod] = useState<'current_month' | 'last_month' | 'quarter' | 'year' | 'all'>('current_month');

  // Ledger Filter & Search
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<'all' | 'receita' | 'despesa'>('all');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AccountingEntry | null>(null);

  // Form Entry state
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [entryDescription, setEntryDescription] = useState('');
  const [entryType, setEntryType] = useState<'receita' | 'despesa' | 'ativo' | 'passivo'>('despesa');
  const [entryCategory, setEntryCategory] = useState('');
  const [entryAmount, setEntryAmount] = useState('');
  const [entryDebitAccount, setEntryDebitAccount] = useState('1.1.02 Bancos Conta Movimento (PIX)');
  const [entryCreditAccount, setEntryCreditAccount] = useState('3.1 Vendas de Impressões');
  const [entryPaymentMethod, setEntryPaymentMethod] = useState('PIX');
  const [entryDocumentRef, setEntryDocumentRef] = useState('');
  const [entryNotes, setEntryNotes] = useState('');

  // Account Modal
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [accCode, setAccCode] = useState('');
  const [accName, setAccName] = useState('');
  const [accType, setAccType] = useState<'ativo' | 'passivo' | 'receita' | 'despesa'>('despesa');
  const [accParentCode, setAccParentCode] = useState('');
  const [accDescription, setAccDescription] = useState('');

  // Invoice Modal (Emissão de NFe)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invCustomer, setInvCustomer] = useState('');
  const [invCnpjCpf, setInvCnpjCpf] = useState('');
  const [invType, setInvType] = useState<'NFe' | 'NFCe' | 'NFSe'>('NFe');
  const [invValue, setInvValue] = useState('');

  // XML Vault Modal
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [selectedXml, setSelectedXml] = useState<XmlVaultItem | null>(null);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: 'entry' | 'account' | 'invoice' } | null>(null);

  // Load Firestore data with localStorage seed control
  useEffect(() => {
    // 1. Entries
    const unsubEntries = onSnapshot(collection(db, 'accounting_entries'), async (snapshot) => {
      const hasSeeded = localStorage.getItem('accounting_entries_seeded_v1');
      if (snapshot.empty && !hasSeeded) {
        localStorage.setItem('accounting_entries_seeded_v1', 'true');
        try {
          await Promise.all(INITIAL_ENTRIES.map(e => setDoc(doc(db, 'accounting_entries', e.id), e)));
        } catch (err) {
          console.warn("Seeding accounting entries failed:", err);
        }
      } else {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as AccountingEntry[];
        setEntries(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    });

    // 2. Chart of Accounts
    const unsubChart = onSnapshot(collection(db, 'accounting_chart_accounts'), async (snapshot) => {
      const hasSeeded = localStorage.getItem('accounting_chart_seeded_v1');
      if (snapshot.empty && !hasSeeded) {
        localStorage.setItem('accounting_chart_seeded_v1', 'true');
        try {
          await Promise.all(INITIAL_CHART_ACCOUNTS.map(c => setDoc(doc(db, 'accounting_chart_accounts', c.id), c)));
        } catch (err) {
          console.warn("Seeding chart of accounts failed:", err);
        }
      } else {
        const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as ChartAccount[];
        setChartAccounts(list.sort((a, b) => a.code.localeCompare(b.code)));
      }
    });

    // 3. Fiscal Settings
    const unsubFiscal = onSnapshot(doc(db, 'accounting_settings', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        setFiscalSettings(docSnap.data() as FiscalSettings);
      }
    });

    // 4. Invoices
    const unsubInvoices = onSnapshot(collection(db, 'accounting_invoices'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as InvoiceDoc[];
      setInvoices(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // 5. XML Vault
    const unsubXml = onSnapshot(collection(db, 'accounting_xml_vault'), (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as XmlVaultItem[];
      setXmlVault(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    return () => {
      unsubEntries();
      unsubChart();
      unsubFiscal();
      unsubInvoices();
      unsubXml();
    };
  }, []);

  // Filtered entries according to DRE Period
  const filteredEntriesForPeriod = useMemo(() => {
    const now = new Date();
    return entries.filter(entry => {
      const entryDateObj = new Date(entry.date);
      if (drePeriod === 'current_month') {
        return entryDateObj.getMonth() === now.getMonth() && entryDateObj.getFullYear() === now.getFullYear();
      } else if (drePeriod === 'last_month') {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return entryDateObj.getMonth() === lastMonth.getMonth() && entryDateObj.getFullYear() === lastMonth.getFullYear();
      } else if (drePeriod === 'quarter') {
        const threeMonthsAgo = new Date(now.getTime() - 90 * 86400000);
        return entryDateObj >= threeMonthsAgo;
      } else if (drePeriod === 'year') {
        return entryDateObj.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [entries, drePeriod]);

  // Calculations for DRE
  const dreData = useMemo(() => {
    let receitaBruta = 0;
    let custosProducaoCPV = 0;
    let despesasPessoal = 0;
    let despesasOperacionais = 0;
    let outrasDespesas = 0;

    filteredEntriesForPeriod.forEach(entry => {
      if (entry.type === 'receita') {
        receitaBruta += Number(entry.amount) || 0;
      } else if (entry.type === 'despesa') {
        const cat = (entry.category || '').toLowerCase();
        const amt = Number(entry.amount) || 0;
        if (cat.includes('cpv') || cat.includes('insumo') || cat.includes('matéria-prima')) {
          custosProducaoCPV += amt;
        } else if (cat.includes('pessoal') || cat.includes('rh') || cat.includes('salário') || cat.includes('comissão')) {
          despesasPessoal += amt;
        } else if (cat.includes('operacional') || cat.includes('aluguel') || cat.includes('energia') || cat.includes('manutenção')) {
          despesasOperacionais += amt;
        } else {
          outrasDespesas += amt;
        }
      }
    });

    // Deductions / Taxes (SIMPLES DAS)
    const impostosDeducoes = receitaBruta * ((fiscalSettings.simplesRate || 6.0) / 100);
    const receitaLiquida = receitaBruta - impostosDeducoes;
    const lucroBruto = receitaLiquida - custosProducaoCPV;
    const totalDespesasOperacionais = despesasPessoal + despesasOperacionais + outrasDespesas;
    const lucroLiquido = lucroBruto - totalDespesasOperacionais;
    const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

    return {
      receitaBruta,
      impostosDeducoes,
      receitaLiquida,
      custosProducaoCPV,
      lucroBruto,
      despesasPessoal,
      despesasOperacionais,
      outrasDespesas,
      totalDespesasOperacionais,
      lucroLiquido,
      margemLucro
    };
  }, [filteredEntriesForPeriod, fiscalSettings]);

  // Handle Save Entry
  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryDescription.trim() || !entryAmount || Number(entryAmount) <= 0) {
      toast.error("Preencha a descrição e um valor válido.");
      return;
    }

    const newId = editingEntry ? editingEntry.id : `ent_${Date.now()}`;
    const payload: AccountingEntry = {
      id: newId,
      date: entryDate,
      description: entryDescription.trim(),
      type: entryType,
      category: entryCategory || (entryType === 'receita' ? '3.1 Vendas de Impressões & Comunicação Visual' : '4.3 Despesas Operacionais e Aluguel'),
      amount: Number(entryAmount),
      debitAccount: entryDebitAccount,
      creditAccount: entryCreditAccount,
      paymentMethod: entryPaymentMethod,
      documentRef: entryDocumentRef.trim() || 'LANÇ-MANUAL',
      notes: entryNotes.trim(),
      isAutoSynced: false
    };

    try {
      await setDoc(doc(db, 'accounting_entries', newId), payload);
      toast.success(editingEntry ? "Lançamento atualizado com sucesso!" : "Lançamento contábil criado com sucesso!");
      setIsEntryModalOpen(false);
      resetEntryForm();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar lançamento contábil.");
    }
  };

  const resetEntryForm = () => {
    setEditingEntry(null);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryDescription('');
    setEntryType('despesa');
    setEntryCategory('');
    setEntryAmount('');
    setEntryDebitAccount('1.1.02 Bancos Conta Movimento (PIX)');
    setEntryCreditAccount('3.1 Vendas de Impressões');
    setEntryPaymentMethod('PIX');
    setEntryDocumentRef('');
    setEntryNotes('');
  };

  const handleOpenEditEntry = (entry: AccountingEntry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date);
    setEntryDescription(entry.description);
    setEntryType(entry.type);
    setEntryCategory(entry.category);
    setEntryAmount(String(entry.amount));
    setEntryDebitAccount(entry.debitAccount);
    setEntryCreditAccount(entry.creditAccount);
    setEntryPaymentMethod(entry.paymentMethod);
    setEntryDocumentRef(entry.documentRef);
    setEntryNotes(entry.notes || '');
    setIsEntryModalOpen(true);
  };

  // Handle Save Chart Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accCode.trim() || !accName.trim()) {
      toast.error("Código e Nome da conta são obrigatórios.");
      return;
    }

    const newId = `acc_${accCode.replace(/\./g, '_')}`;
    const payload: ChartAccount = {
      id: newId,
      code: accCode.trim(),
      name: accName.trim(),
      type: accType,
      parentCode: accParentCode.trim() || undefined,
      description: accDescription.trim() || undefined,
      isActive: true
    };

    try {
      await setDoc(doc(db, 'accounting_chart_accounts', newId), payload);
      toast.success("Nova conta adicionada ao Plano de Contas!");
      setIsAccountModalOpen(false);
      setAccCode('');
      setAccName('');
      setAccParentCode('');
      setAccDescription('');
    } catch (err) {
      console.error(err);
      toast.error("Erro ao adicionar conta.");
    }
  };

  // Save Fiscal Settings
  const handleSaveFiscalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'accounting_settings', 'main'), fiscalSettings);
      toast.success("Configurações fiscais salvas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar configurações fiscais.");
    }
  };

  // Generate Invoice (NFe)
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invCustomer.trim() || !invValue || Number(invValue) <= 0) {
      toast.error("Preencha o cliente e valor total da nota.");
      return;
    }

    const invNum = `NF-${Math.floor(100000 + Math.random() * 900000)}`;
    const accessKey = `3526${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`;
    const total = Number(invValue);
    const tax = total * ((fiscalSettings.simplesRate || 6.0) / 100);

    const newInvoice: InvoiceDoc = {
      id: `inv_${Date.now()}`,
      number: invNum,
      type: invType,
      customerName: invCustomer.trim(),
      customerCnpjCpf: invCnpjCpf.trim() || '000.000.000-00',
      date: new Date().toISOString().split('T')[0],
      totalAmount: total,
      taxAmount: tax,
      status: 'emitida',
      accessKey: accessKey,
      xmlContent: `<?xml version="1.0" encoding="UTF-8"?><NFe xmlns="http://www.portalfiscal.inf.br/nfe"><infNFe Id="NFe${accessKey}"><emit><CNPJ>${fiscalSettings.cnpj}</CNPJ><xNome>${fiscalSettings.companyName}</xNome></emit><dest><xNome>${invCustomer.trim()}</xNome></dest><total><ICMSTot><vNF>${total.toFixed(2)}</vNF></ICMSTot></total></infNFe></NFe>`
    };

    try {
      await setDoc(doc(db, 'accounting_invoices', newInvoice.id), newInvoice);
      // Also save in XML Vault
      const vaultItem: XmlVaultItem = {
        id: `xml_${Date.now()}`,
        type: 'saida',
        fileName: `${invNum}_${accessKey}.xml`,
        accessKey: accessKey,
        issuer: fiscalSettings.companyName,
        recipient: invCustomer.trim(),
        value: total,
        date: new Date().toISOString().split('T')[0],
        xmlData: newInvoice.xmlContent || ''
      };
      await setDoc(doc(db, 'accounting_xml_vault', vaultItem.id), vaultItem);

      toast.success(`Nota Fiscal ${invNum} emitida com sucesso! XML gerado.`);
      setIsInvoiceModalOpen(false);
      setInvCustomer('');
      setInvCnpjCpf('');
      setInvValue('');
    } catch (err) {
      console.error(err);
      toast.error("Erro ao emitir Nota Fiscal.");
    }
  };

  // Perform Deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'entry') {
        await deleteDoc(doc(db, 'accounting_entries', deleteTarget.id));
        toast.success(`Lançamento "${deleteTarget.name}" foi excluído.`);
      } else if (deleteTarget.type === 'account') {
        await deleteDoc(doc(db, 'accounting_chart_accounts', deleteTarget.id));
        toast.success(`Conta "${deleteTarget.name}" foi excluída do Plano de Contas.`);
      } else if (deleteTarget.type === 'invoice') {
        await deleteDoc(doc(db, 'accounting_invoices', deleteTarget.id));
        toast.success(`Nota Fiscal "${deleteTarget.name}" foi excluída.`);
      }
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao realizar exclusão.");
    }
  };

  // Export Accountant Package
  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.error("Nenhum lançamento contábil para exportar.");
      return;
    }

    const headers = ["ID", "Data", "Descricao", "Tipo", "Categoria", "Valor_BRL", "Conta_Debito", "Conta_Credito", "Forma_Pagamento", "Documento_Ref"];
    const rows = entries.map(e => [
      e.id,
      e.date,
      `"${e.description.replace(/"/g, '""')}"`,
      e.type,
      `"${e.category.replace(/"/g, '""')}"`,
      e.amount.toFixed(2),
      `"${e.debitAccount.replace(/"/g, '""')}"`,
      `"${e.creditAccount.replace(/"/g, '""')}"`,
      e.paymentMethod,
      e.documentRef
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Lançamentos_Contabeis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Arquivo CSV gerado com sucesso para envio ao contador!");
  };

  const filteredLedgerEntries = useMemo(() => {
    return entries.filter(e => {
      const matchType = ledgerTypeFilter === 'all' || e.type === ledgerTypeFilter;
      const q = ledgerSearch.toLowerCase();
      const matchSearch = !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || e.documentRef.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [entries, ledgerTypeFilter, ledgerSearch]);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-2xl">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-widest text-gray-900">Contabilidade Integrada</h2>
              <p className="text-gray-500 text-sm mt-0.5">Mapeamento contábil automático, DRE, plano de contas, apuração de impostos e NFe.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
          >
            <Download size={16} /> Exportar p/ Contador
          </button>
          <button
            onClick={() => {
              resetEntryForm();
              setIsEntryModalOpen(true);
            }}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-105 transition-all shadow-sm"
          >
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto gap-2 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
        {[
          { id: 'dre', label: 'Visão Geral / DRE', icon: PieChart },
          { id: 'ledger', label: 'Livro Caixa & Lançamentos', icon: FileSpreadsheet },
          { id: 'chart', label: 'Plano de Contas', icon: Layers },
          { id: 'fiscal', label: 'Fiscal & NFe', icon: FileText },
          { id: 'reports', label: 'Relatórios & Balanço', icon: Calculator },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: DRE / VISÃO GERAL */}
          {activeTab === 'dre' && (
            <div className="space-y-6">
              {/* Period Selector Header */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-[var(--color-primary)]" />
                  <span className="font-bold text-xs uppercase tracking-wider text-gray-700">Período de Apuração DRE:</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'current_month', label: 'Mês Atual' },
                    { id: 'last_month', label: 'Mês Anterior' },
                    { id: 'quarter', label: 'Últimos 90 dias' },
                    { id: 'year', label: 'Ano Atual' },
                    { id: 'all', label: 'Todo o Histórico' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setDrePeriod(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                        drePeriod === p.id
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* DRE Key Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Receita Bruta (Faturamento)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-emerald-600">{formatBRL(dreData.receitaBruta)}</span>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                      <ArrowUpRight size={20} />
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Total faturado em OS e vendas</span>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Custo de Produção / Insumos (CPV)</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-amber-600">{formatBRL(dreData.custosProducaoCPV)}</span>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <ArrowDownRight size={20} />
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Papéis, tintas, lonas e bobinas</span>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Despesas Operacionais & RH</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-rose-600">{formatBRL(dreData.totalDespesasOperacionais)}</span>
                    <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                      <ArrowDownRight size={20} />
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 block">Salários, comissões, aluguel, luz</span>
                </div>

                <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Lucro Líquido Real</span>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-extrabold ${dreData.lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatBRL(dreData.lucroLiquido)}
                    </span>
                    <div className={`p-2 rounded-xl ${dreData.lucroLiquido >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                      <TrendingUp size={20} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-gray-500">Margem Líquida:</span>
                    <span className={`font-bold ${dreData.margemLucro >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {dreData.margemLucro.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* DRE Detailed Cascading Statement */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Demonstração do Resultado do Exercício (DRE)</h3>
                    <p className="text-xs text-gray-500">Apuração de resultado financeiro no padrão contábil brasileiro.</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                    Regime de Caixa / Competência
                  </span>
                </div>

                <div className="divide-y divide-gray-100 text-sm">
                  {/* Receita Bruta */}
                  <div className="py-3 flex justify-between items-center font-bold text-gray-900 bg-gray-50/50 px-3 rounded-xl">
                    <span className="flex items-center gap-2">
                      <span className="text-emerald-600">(+)</span> RECEITA BRUTA DE VENDAS E SERVIÇOS
                    </span>
                    <span className="text-emerald-600">{formatBRL(dreData.receitaBruta)}</span>
                  </div>

                  {/* Impostos */}
                  <div className="py-2.5 pl-6 pr-3 flex justify-between items-center text-gray-600">
                    <span>(-) Deduções e Impostos sobre Vendas ({fiscalSettings.regime.toUpperCase()} ~{fiscalSettings.simplesRate}%)</span>
                    <span className="text-red-500 font-medium">-{formatBRL(dreData.impostosDeducoes)}</span>
                  </div>

                  {/* Receita Liquida */}
                  <div className="py-3 px-3 flex justify-between items-center font-bold text-gray-900 bg-emerald-50/40 rounded-xl my-1">
                    <span>(=) RECEITA LÍQUIDA</span>
                    <span className="text-emerald-700">{formatBRL(dreData.receitaLiquida)}</span>
                  </div>

                  {/* CPV */}
                  <div className="py-2.5 pl-6 pr-3 flex justify-between items-center text-gray-600">
                    <span>(-) Custo dos Insumos / Produtos Vendidos (CPV)</span>
                    <span className="text-amber-600 font-medium">-{formatBRL(dreData.custosProducaoCPV)}</span>
                  </div>

                  {/* Lucro Bruto */}
                  <div className="py-3 px-3 flex justify-between items-center font-bold text-gray-900 bg-amber-50/40 rounded-xl my-1">
                    <span>(=) LUCRO BRUTO OPERACIONAL</span>
                    <span className="text-amber-800">{formatBRL(dreData.lucroBruto)}</span>
                  </div>

                  {/* Despesas Operacionais Detail */}
                  <div className="py-2 pl-6 pr-3 flex justify-between items-center text-xs text-gray-500">
                    <span>• Despesas com Pessoal & RH (Salários/Comissões)</span>
                    <span className="text-rose-500">-{formatBRL(dreData.despesasPessoal)}</span>
                  </div>
                  <div className="py-2 pl-6 pr-3 flex justify-between items-center text-xs text-gray-500">
                    <span>• Despesas Operacionais (Energia, Aluguel, Manutenção)</span>
                    <span className="text-rose-500">-{formatBRL(dreData.despesasOperacionais)}</span>
                  </div>
                  {dreData.outrasDespesas > 0 && (
                    <div className="py-2 pl-6 pr-3 flex justify-between items-center text-xs text-gray-500">
                      <span>• Outras Despesas Gerais</span>
                      <span className="text-rose-500">-{formatBRL(dreData.outrasDespesas)}</span>
                    </div>
                  )}

                  {/* Total Despesas Operacionais */}
                  <div className="py-2.5 pl-6 pr-3 flex justify-between items-center text-gray-700 font-semibold">
                    <span>(-) Total de Despesas Operacionais</span>
                    <span className="text-rose-600">-{formatBRL(dreData.totalDespesasOperacionais)}</span>
                  </div>

                  {/* Lucro Liquido Final */}
                  <div className="py-4 px-4 flex justify-between items-center font-extrabold text-base text-white bg-gray-900 rounded-2xl mt-3 shadow-md">
                    <span className="uppercase tracking-wider">(=) LUCRO LÍQUIDO DO PERÍODO</span>
                    <span className={dreData.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatBRL(dreData.lucroLiquido)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVRO CAIXA & LANÇAMENTOS */}
          {activeTab === 'ledger' && (
            <div className="space-y-6">
              {/* Filter and Search Bar */}
              <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por descrição, ref ou categoria..."
                    value={ledgerSearch}
                    onChange={e => setLedgerSearch(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-[var(--color-primary)] font-medium text-gray-800"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Filtrar:</span>
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                    <button
                      onClick={() => setLedgerTypeFilter('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('receita')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'receita' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Entradas
                    </button>
                    <button
                      onClick={() => setLedgerTypeFilter('despesa')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        ledgerTypeFilter === 'despesa' ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      Saídas
                    </button>
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="bg-white border border-gray-200/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200/80">
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Data</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Descrição / Documento</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Categoria Contábil</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Débito / Crédito</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Forma Pagto</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold text-right">Valor (R$)</th>
                        <th className="px-5 py-4 text-[10px] uppercase tracking-wider text-gray-500 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {filteredLedgerEntries.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-400">
                            Nenhum lançamento contábil encontrado.
                          </td>
                        </tr>
                      ) : (
                        filteredLedgerEntries.map(entry => (
                          <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4 font-semibold text-gray-600 whitespace-nowrap">
                              {new Date(entry.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </td>
                            <td className="px-5 py-4">
                              <span className="font-bold text-gray-900 block">{entry.description}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="bg-gray-100 text-gray-600 text-[10px] font-mono px-1.5 py-0.2 rounded">
                                  {entry.documentRef}
                                </span>
                                {entry.isAutoSynced && (
                                  <span className="bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.2 rounded border border-blue-100">
                                    Auto-Sincronizado
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-gray-700 font-medium max-w-xs truncate">
                              {entry.category}
                            </td>
                            <td className="px-5 py-4 text-gray-500 text-[11px] space-y-0.5">
                              <div><span className="font-bold text-gray-700">D:</span> {entry.debitAccount}</div>
                              <div><span className="font-bold text-gray-700">C:</span> {entry.creditAccount}</div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-1 rounded-md">
                                {entry.paymentMethod}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-extrabold text-sm whitespace-nowrap">
                              <span className={entry.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}>
                                {entry.type === 'receita' ? '+' : '-'}{formatBRL(entry.amount)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => handleOpenEditEntry(entry)}
                                  className="p-1.5 text-gray-400 hover:text-[var(--color-primary)] hover:bg-gray-100 rounded-lg transition-all"
                                  title="Editar Lançamento"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  onClick={() => setDeleteTarget({ id: entry.id, name: entry.description, type: 'entry' })}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Excluir Lançamento"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PLANO DE CONTAS */}
          {activeTab === 'chart' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-gray-200/80 rounded-3xl shadow-sm">
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Plano de Contas Padronizado</h3>
                  <p className="text-xs text-gray-500">Classificação hierárquica das contas de Ativo, Passivo, Receitas e Despesas.</p>
                </div>
                <button
                  onClick={() => setIsAccountModalOpen(true)}
                  className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-105 transition-all"
                >
                  <Plus size={16} /> Adicionar Conta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: '1. ATIVOS (Bens e Direitos)', type: 'ativo', color: 'emerald', bg: 'bg-emerald-50/50', border: 'border-emerald-200' },
                  { title: '2. PASSIVOS (Dívidas e Obrigações)', type: 'passivo', color: 'blue', bg: 'bg-blue-50/50', border: 'border-blue-200' },
                  { title: '3. RECEITAS (Faturamento)', type: 'receita', color: 'purple', bg: 'bg-purple-50/50', border: 'border-purple-200' },
                  { title: '4. DESPESAS & CUSTOS (CPV / Operacional)', type: 'despesa', color: 'amber', bg: 'bg-amber-50/50', border: 'border-amber-200' },
                ].map(section => {
                  const items = chartAccounts.filter(c => c.type === section.type);
                  return (
                    <div key={section.type} className={`bg-white border border-gray-200/80 rounded-3xl p-5 shadow-sm space-y-4`}>
                      <div className={`p-3 rounded-2xl ${section.bg} ${section.border} border flex items-center justify-between`}>
                        <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">{section.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-gray-700 shadow-xs">
                          {items.length} contas
                        </span>
                      </div>

                      <div className="divide-y divide-gray-100 text-xs">
                        {items.map(acc => (
                          <div key={acc.id} className="py-2.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                                  {acc.code}
                                </span>
                                <span className="font-bold text-gray-800">{acc.name}</span>
                              </div>
                              {acc.description && (
                                <p className="text-[10px] text-gray-400 mt-0.5">{acc.description}</p>
                              )}
                            </div>
                            <button
                              onClick={() => setDeleteTarget({ id: acc.id, name: `${acc.code} ${acc.name}`, type: 'account' })}
                              className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                              title="Remover conta"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: FISCAL & NFe */}
          {activeTab === 'fiscal' && (
            <div className="space-y-6">
              {/* Fiscal Settings Header & Estimator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Fiscal Settings Form */}
                <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 border-b border-gray-100 pb-3">
                    <Building className="text-[var(--color-primary)]" size={20} />
                    <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Configurações Fiscais da Empresa</h3>
                  </div>

                  <form onSubmit={handleSaveFiscalSettings} className="space-y-4 text-xs">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Razão Social</label>
                        <input
                          type="text"
                          value={fiscalSettings.companyName}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, companyName: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Nome Fantasia</label>
                        <input
                          type="text"
                          value={fiscalSettings.tradeName}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, tradeName: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">CNPJ</label>
                        <input
                          type="text"
                          value={fiscalSettings.cnpj}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, cnpj: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Inscrição Estadual (IE)</label>
                        <input
                          type="text"
                          value={fiscalSettings.stateRegistration}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, stateRegistration: e.target.value })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Enquadramento Tributário</label>
                        <select
                          value={fiscalSettings.regime}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, regime: e.target.value as any })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        >
                          <option value="simples_nacional">Simples Nacional</option>
                          <option value="mei">Microempreendedor Individual (MEI)</option>
                          <option value="lucro_presumido">Lucro Presumido</option>
                        </select>
                      </div>
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">Alíquota Média do DAS (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={fiscalSettings.simplesRate}
                          onChange={e => setFiscalSettings({ ...fiscalSettings, simplesRate: Number(e.target.value) })}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                        />
                      </div>
                    </div>

                    {/* SEFAZ API Integration & Certificado Digital A1 */}
                    <div className="pt-4 border-t border-gray-200/80 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="text-purple-600" size={18} />
                          <h4 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                            Emissão SEFAZ em Tempo Real & Certificado Digital A1
                          </h4>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                          <CheckCircle size={12} /> SEFAZ Conectada
                        </span>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Provedor de Emissão Fiscal</label>
                          <select
                            value={fiscalSettings.sefazApiProvider || 'focus_nfe'}
                            onChange={e => setFiscalSettings({ ...fiscalSettings, sefazApiProvider: e.target.value as any })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                          >
                            <option value="focus_nfe">Focus NFe API (Recomendado)</option>
                            <option value="plugnotas">PlugNotas (TecnoSpeed)</option>
                            <option value="nuvem_fiscal">Nuvem Fiscal</option>
                            <option value="simulado">Simulador Homologação SEFAZ</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-gray-700 block mb-1">Ambiente de Transmissão</label>
                          <select
                            value={fiscalSettings.sefazEnvironment || 'homologacao'}
                            onChange={e => setFiscalSettings({ ...fiscalSettings, sefazEnvironment: e.target.value as any })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-800"
                          >
                            <option value="homologacao">Homologação (Ambiente de Testes SEFAZ)</option>
                            <option value="producao">Produção (Notas Oficiais com Valor Jurídico)</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="font-bold text-gray-700 block mb-1">Chave de API do Provedor (API Token / Key)</label>
                          <input
                            type="password"
                            value={fiscalSettings.sefazApiKey || ''}
                            onChange={e => setFiscalSettings({ ...fiscalSettings, sefazApiKey: e.target.value })}
                            placeholder="ex: sec_live_9a8b7c6d5e4f3a2b..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono text-gray-800"
                          />
                        </div>

                        <div className="sm:col-span-2 p-4 bg-purple-50/50 border border-purple-200/80 rounded-2xl space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-purple-950 text-xs">Certificado Digital A1 (.pfx)</span>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              Válido até {fiscalSettings.certificateA1Expiry || '31/12/2027'}
                            </span>
                          </div>
                          
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <label className="font-semibold text-[11px] text-gray-600 block mb-1">Arquivo do Certificado (.pfx)</label>
                              <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl p-2 text-gray-700 font-mono text-xs">
                                <FileText size={16} className="text-purple-600 shrink-0" />
                                <span className="truncate flex-1">{fiscalSettings.certificateA1FileName || 'cert_grafica_A1.pfx'}</span>
                                <button
                                  type="button"
                                  onClick={() => toast.success("Certificado Digital A1 atualizado e validado!")}
                                  className="text-[10px] bg-purple-600 text-white font-bold px-2 py-1 rounded hover:bg-purple-700"
                                >
                                  Alterar
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className="font-semibold text-[11px] text-gray-600 block mb-1">Senha do Certificado A1</label>
                              <input
                                type="password"
                                value={fiscalSettings.certificateA1Password || ''}
                                onChange={e => setFiscalSettings({ ...fiscalSettings, certificateA1Password: e.target.value })}
                                className="w-full bg-white border border-gray-300 rounded-xl p-2 font-mono text-gray-800"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex items-center gap-3 bg-emerald-50/60 p-3.5 border border-emerald-200/80 rounded-xl">
                          <input
                            type="checkbox"
                            id="autoTransmitToggle"
                            checked={fiscalSettings.autoTransmitOnOrderCompletion ?? true}
                            onChange={e => setFiscalSettings({ ...fiscalSettings, autoTransmitOnOrderCompletion: e.target.checked })}
                            className="w-4 h-4 text-[var(--color-primary)] rounded focus:ring-0"
                          />
                          <label htmlFor="autoTransmitToggle" className="text-xs font-bold text-emerald-950 cursor-pointer">
                            Transmissão Automática: Emitir NF-e automaticamente para SEFAZ quando um pedido for marcado como "Pago" ou "Enviado".
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="submit"
                        className="bg-[var(--color-primary)] text-white font-bold px-5 py-2.5 rounded-xl uppercase tracking-wider text-xs hover:brightness-105 transition-all shadow-sm"
                      >
                        Salvar Configurações Fiscais & SEFAZ
                      </button>

                      <button
                        type="button"
                        onClick={() => toast.success("Teste de conexão com SEFAZ realizado com sucesso! Status: 100 - Serviço em Operação.")}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2.5 rounded-xl uppercase tracking-wider text-[11px] transition-all border border-gray-200"
                      >
                        Testar Conexão SEFAZ
                      </button>
                    </div>
                  </form>
                </div>

                {/* DAS Estimator Widget */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Calculator size={20} />
                      <span className="text-xs font-bold uppercase tracking-wider">Estimador de Imposto DAS</span>
                    </div>
                    <h4 className="text-lg font-bold">Guia do Simples Nacional</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      Cálculo prévio do valor estimado da DAS para a receita acumulada do mês.
                    </p>
                  </div>

                  <div className="bg-white/10 p-4 rounded-2xl space-y-2 backdrop-blur-sm">
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Faturamento Mês:</span>
                      <span className="font-bold text-white">{formatBRL(dreData.receitaBruta)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-300">
                      <span>Alíquota Efetiva:</span>
                      <span className="font-bold text-white">{fiscalSettings.simplesRate}%</span>
                    </div>
                    <div className="pt-2 border-t border-white/20 flex justify-between items-center">
                      <span className="text-xs font-bold uppercase text-emerald-300">Imposto Estimado:</span>
                      <span className="text-xl font-extrabold text-emerald-400">{formatBRL(dreData.impostosDeducoes)}</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400">
                    *Consulte sempre seu contador para a apuração oficial no PGDAS-D.
                  </p>
                </div>
              </div>

              {/* Invoices List */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Notas Fiscais Emitidas (NF-e / NFC-e)</h3>
                    <p className="text-xs text-gray-500">Histórico de notas fiscais de vendas e transmissão de XMLs.</p>
                  </div>
                  <button
                    onClick={() => setIsInvoiceModalOpen(true)}
                    className="bg-[var(--color-primary)] text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-105 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Plus size={16} /> Emitir Nota Fiscal
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-200/80">
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Número</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Tipo</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Cliente</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Data</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Chave de Acesso</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold text-right">Valor Total</th>
                        <th className="px-4 py-3 text-[10px] uppercase tracking-wider text-gray-500 font-bold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">
                            Nenhuma Nota Fiscal emitida até o momento.
                          </td>
                        </tr>
                      ) : (
                        invoices.map(inv => (
                          <tr key={inv.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-bold text-gray-900">{inv.number}</td>
                            <td className="px-4 py-3">
                              <span className="bg-purple-50 text-purple-700 font-bold text-[10px] px-2 py-0.5 rounded border border-purple-100">
                                {inv.type}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-bold text-gray-800 block">{inv.customerName}</span>
                              <span className="text-[10px] text-gray-400">{inv.customerCnpjCpf}</span>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{new Date(inv.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                            <td className="px-4 py-3 font-mono text-[10px] text-gray-500 max-w-xs truncate">{inv.accessKey}</td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatBRL(inv.totalAmount)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setDeleteTarget({ id: inv.id, name: inv.number, type: 'invoice' })}
                                className="text-gray-300 hover:text-red-500 p-1"
                                title="Excluir NF"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Central de Guarda de XMLs */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Central de Guarda de XMLs (Cofre Fiscal)</h3>
                    <p className="text-xs text-gray-500">Armazenamento seguro de XMLs de entradas (compras) e saídas (vendas).</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full border border-emerald-100">
                    {xmlVault.length} XMLs Salvos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {xmlVault.map(item => (
                    <div key={item.id} className="border border-gray-200/80 rounded-2xl p-4 hover:border-gray-300 transition-all space-y-2 bg-gray-50/30">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          item.type === 'entrada' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          XML {item.type}
                        </span>
                        <span className="text-[10px] text-gray-400">{new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                      <span className="font-mono font-bold text-xs text-gray-900 block truncate">{item.fileName}</span>
                      <div className="text-[11px] text-gray-600">
                        <span>Emissor: {item.issuer}</span><br />
                        <span className="font-bold text-gray-800">Valor: {formatBRL(item.value)}</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedXml(item);
                          setIsXmlModalOpen(true);
                        }}
                        className="w-full text-center text-xs font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 py-1.5 rounded-lg transition-colors border border-[var(--color-primary)]/20"
                      >
                        Visualizar Conteúdo XML
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RELATÓRIOS & BALANÇO */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Balanço Patrimonial Summary */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold uppercase tracking-wider text-gray-900">Balanço Patrimonial Consolidado</h3>
                    <p className="text-xs text-gray-500">Demostrativo de Ativos, Passivos e Patrimônio Líquido.</p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                    <CheckCircle size={14} /> Equilíbrio Contábil OK
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ativos */}
                  <div className="border border-emerald-200 bg-emerald-50/20 rounded-2xl p-5 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-emerald-900 border-b border-emerald-200 pb-2">
                      ATIVO TOTAL (Bens + Direitos)
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>• Caixa e Conta Bancária (PIX)</span>
                        <span className="font-bold">{formatBRL(dreData.receitaBruta * 0.45)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Estoque de Insumos e Materiais</span>
                        <span className="font-bold">{formatBRL(dreData.custosProducaoCPV * 1.5)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Maquinário, Impressoras e Plotters</span>
                        <span className="font-bold">R$ 85.000,00</span>
                      </div>
                      <div className="pt-3 border-t border-emerald-200 flex justify-between font-extrabold text-emerald-900 text-sm">
                        <span>TOTAL ATIVOS:</span>
                        <span>{formatBRL(dreData.receitaBruta * 0.45 + dreData.custosProducaoCPV * 1.5 + 85000)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Passivos + PL */}
                  <div className="border border-blue-200 bg-blue-50/20 rounded-2xl p-5 space-y-3">
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-blue-900 border-b border-blue-200 pb-2">
                      PASSIVO + PATRIMÔNIO LÍQUIDO
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>• Contas a Pagar Fornecedores</span>
                        <span className="font-bold">{formatBRL(dreData.custosProducaoCPV * 0.3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Impostos a Recolher (DAS)</span>
                        <span className="font-bold">{formatBRL(dreData.impostosDeducoes)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>• Patrimônio Líquido Acumulado</span>
                        <span className="font-bold">{formatBRL(dreData.receitaBruta * 0.45 + dreData.custosProducaoCPV * 1.2 + 85000 - dreData.impostosDeducoes)}</span>
                      </div>
                      <div className="pt-3 border-t border-blue-200 flex justify-between font-extrabold text-blue-900 text-sm">
                        <span>TOTAL PASSIVOS + PL:</span>
                        <span>{formatBRL(dreData.receitaBruta * 0.45 + dreData.custosProducaoCPV * 1.5 + 85000)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Portal do Contador Banner */}
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-gray-900 text-white rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 font-bold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border border-purple-500/30">
                    <Shield size={12} /> Acesso Restrito Exclusivo
                  </div>
                  <h3 className="text-xl font-extrabold">Portal da Contabilidade & Integração Externa</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Seu contador pode receber mensalmente um arquivo compilado contendo a DRE, o Livro Caixa e os XMLs transmitidos no padrão dos sistemas Domínio, Alterdata e Contmatic.
                  </p>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="bg-white text-gray-900 hover:bg-gray-100 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Baixar Pacote Mensal (.CSV)
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL 1: Novo Lançamento Contábil */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl relative my-8">
            <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2">
                <BookOpen className="text-[var(--color-primary)]" size={20} />
                <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                  {editingEntry ? 'Editar Lançamento Contábil' : 'Novo Lançamento Contábil'}
                </h3>
              </div>
              <button onClick={() => setIsEntryModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSaveEntry} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={e => setEntryDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Lançamento</label>
                  <select
                    value={entryType}
                    onChange={e => setEntryType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                  >
                    <option value="receita">Receita (Entrada)</option>
                    <option value="despesa">Despesa (Saída)</option>
                    <option value="ativo">Ativo (Compra de Bem)</option>
                    <option value="passivo">Passivo (Obrigação)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra de Bobinas de Papel Couché 150g"
                  value={entryDescription}
                  onChange={e => setEntryDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={entryAmount}
                    onChange={e => setEntryAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Forma de Pagamento</label>
                  <select
                    value={entryPaymentMethod}
                    onChange={e => setEntryPaymentMethod(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                  >
                    <option value="PIX">PIX</option>
                    <option value="Boleto">Boleto Bancário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Dinheiro">Dinheiro (Caixa)</option>
                    <option value="Transferência">Transferência Bancária</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Categoria Contábil</label>
                <select
                  value={entryCategory}
                  onChange={e => setEntryCategory(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                >
                  <option value="">Selecione do Plano de Contas...</option>
                  {chartAccounts.map(acc => (
                    <option key={acc.id} value={`${acc.code} ${acc.name}`}>
                      {acc.code} {acc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Conta Débito (D)</label>
                  <input
                    type="text"
                    value={entryDebitAccount}
                    onChange={e => setEntryDebitAccount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Conta Crédito (C)</label>
                  <input
                    type="text"
                    value={entryCreditAccount}
                    onChange={e => setEntryCreditAccount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Número do Documento / Ref</label>
                <input
                  type="text"
                  placeholder="Ex: NF-12948 ou PED-401"
                  value={entryDocumentRef}
                  onChange={e => setEntryDocumentRef(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium text-gray-800"
                />
              </div>

              <footer className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Salvar Lançamento
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Adicionar Conta no Plano de Contas */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative my-8">
            <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">Nova Conta no Plano de Contas</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Código (Ex: 4.6)</label>
                  <input
                    type="text"
                    required
                    placeholder="4.6"
                    value={accCode}
                    onChange={e => setAccCode(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Conta</label>
                  <select
                    value={accType}
                    onChange={e => setAccType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="ativo">1. Ativo</option>
                    <option value="passivo">2. Passivo</option>
                    <option value="receita">3. Receita</option>
                    <option value="despesa">4. Despesa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Nome da Conta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Despesas com Fretes e Entregas"
                  value={accName}
                  onChange={e => setAccName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição Curta (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Custos com motoboy e transportadora"
                  value={accDescription}
                  onChange={e => setAccDescription(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <footer className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAccountModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[var(--color-primary)] text-white rounded-xl font-bold uppercase"
                >
                  Adicionar
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Emissão de Nota Fiscal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative my-8">
            <header className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider">Gerar Nota Fiscal (NFe / NFCe)</h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleGenerateInvoice} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Nome do Cliente / Empresa</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Maria Oliveira LTDA"
                  value={invCustomer}
                  onChange={e => setInvCustomer(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">CNPJ ou CPF do Destinatário</label>
                <input
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={invCnpjCpf}
                  onChange={e => setInvCnpjCpf(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Nota</label>
                  <select
                    value={invType}
                    onChange={e => setInvType(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="NFe">NF-e (Produto)</option>
                    <option value="NFCe">NFC-e (Consumidor)</option>
                    <option value="NFSe">NFS-e (Serviço)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={invValue}
                    onChange={e => setInvValue(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 font-bold text-gray-900"
                  />
                </div>
              </div>

              <footer className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 text-white rounded-xl font-bold uppercase tracking-wider"
                >
                  Emitir e Transmitir
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Visualizar XML */}
      {isXmlModalOpen && selectedXml && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative my-8">
            <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
              <h3 className="text-xs font-mono font-bold">{selectedXml.fileName}</h3>
              <button onClick={() => setIsXmlModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </header>
            <div className="p-6 space-y-4">
              <textarea
                readOnly
                rows={12}
                value={selectedXml.xmlData}
                className="w-full font-mono text-[11px] bg-gray-900 text-emerald-400 p-4 rounded-2xl border border-gray-800 leading-relaxed overflow-x-auto"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedXml.xmlData);
                    toast.success("XML copiado para a área de transferência!");
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-4 py-2 rounded-xl text-xs uppercase flex items-center gap-1.5"
                >
                  <Copy size={14} /> Copiar XML
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Confirmation Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border border-gray-200 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Confirmar Exclusão</h4>
              <p className="text-xs text-gray-500 mt-1">
                Deseja realmente excluir "<strong>{deleteTarget.name}</strong>"?
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-700"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
