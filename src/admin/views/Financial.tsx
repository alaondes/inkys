import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Calculator, 
  CreditCard, 
  Truck, 
  Save, 
  Banknote, 
  Percent, 
  DollarSign, 
  TrendingUp, 
  Home, 
  Zap, 
  Users, 
  Megaphone, 
  Laptop, 
  Building2, 
  HelpCircle, 
  CheckCircle2, 
  Receipt, 
  ShieldCheck,
  Plus,
  Trash2,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useProducts } from '../../context/ProductContext';
import { calculateSuggestedPrice, defaultPricingRules, PricingRulesConfig } from '../../lib/pricingUtils';

export function Financial() {
  const { settings, updateSettings } = useSettings();
  const { products, setProducts } = useProducts();

  const [activeTab, setActiveTab] = useState<'precificacao' | 'pagamentos' | 'frete'>('precificacao');

  // Precificação Fixa State
  const [pricingRules, setPricingRules] = useState<PricingRulesConfig>({
    taxRatePct: settings.pricingRules?.taxRatePct ?? 6,
    gatewayFeePct: settings.pricingRules?.gatewayFeePct ?? 4,
    fixedCostPct: settings.pricingRules?.fixedCostPct ?? 10,
    desiredProfitPct: settings.pricingRules?.desiredProfitPct ?? 20,
    commissionPct: settings.pricingRules?.commissionPct ?? 0,
    defaultPackagingCost: settings.pricingRules?.defaultPackagingCost ?? 2.00,
    defaultShippingInCost: settings.pricingRules?.defaultShippingInCost ?? 0.00,
    useCalculatedFixedCost: settings.pricingRules?.useCalculatedFixedCost ?? true,
    rentCostMonthly: settings.pricingRules?.rentCostMonthly ?? 1200,
    utilitiesCostMonthly: settings.pricingRules?.utilitiesCostMonthly ?? 400,
    salariesCostMonthly: settings.pricingRules?.salariesCostMonthly ?? 3000,
    marketingCostMonthly: settings.pricingRules?.marketingCostMonthly ?? 500,
    softwareAccountingCostMonthly: settings.pricingRules?.softwareAccountingCostMonthly ?? 300,
    otherFixedCostsMonthly: settings.pricingRules?.otherFixedCostsMonthly ?? 100,
    estimatedMonthlyRevenue: settings.pricingRules?.estimatedMonthlyRevenue ?? 50000,
  });
  const [simCost, setSimCost] = useState<number>(20);

  // Pagamentos State
  const [paymentMethods, setPaymentMethods] = useState(settings.paymentMethods || { pix: true, credit: true, debit: true, boleto: false });
  const [pixDiscountPct, setPixDiscountPct] = useState<number>(Math.round((settings.pixDiscount ?? 0.10) * 100));
  const [installments, setInstallments] = useState<number>(settings.installments || 2);

  // Frete State
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(settings.freeShippingThreshold || 0);
  const [fixedShippingRates, setFixedShippingRates] = useState<Record<string, number>>(
    settings.fixedShippingRates || { 'SP': 15.90, 'RJ': 20.00 }
  );
  const [newStateUf, setNewStateUf] = useState('');
  const [newStateRate, setNewStateRate] = useState('');

  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (settings.pricingRules) {
      setPricingRules({
        taxRatePct: settings.pricingRules.taxRatePct ?? 6,
        gatewayFeePct: settings.pricingRules.gatewayFeePct ?? 4,
        fixedCostPct: settings.pricingRules.fixedCostPct ?? 10,
        desiredProfitPct: settings.pricingRules.desiredProfitPct ?? 20,
        commissionPct: settings.pricingRules.commissionPct ?? 0,
        defaultPackagingCost: settings.pricingRules.defaultPackagingCost ?? 2.00,
        defaultShippingInCost: settings.pricingRules.defaultShippingInCost ?? 0.00,
        useCalculatedFixedCost: true,
        rentCostMonthly: settings.pricingRules.rentCostMonthly ?? 1200,
        utilitiesCostMonthly: settings.pricingRules.utilitiesCostMonthly ?? 400,
        salariesCostMonthly: settings.pricingRules.salariesCostMonthly ?? 3000,
        marketingCostMonthly: settings.pricingRules.marketingCostMonthly ?? 500,
        softwareAccountingCostMonthly: settings.pricingRules.softwareAccountingCostMonthly ?? 300,
        otherFixedCostsMonthly: settings.pricingRules.otherFixedCostsMonthly ?? 100,
        estimatedMonthlyRevenue: settings.pricingRules.estimatedMonthlyRevenue ?? 50000,
      });
    }
    if (settings.paymentMethods) setPaymentMethods(settings.paymentMethods);
    if (settings.pixDiscount !== undefined) setPixDiscountPct(Math.round(settings.pixDiscount * 100));
    if (settings.installments) setInstallments(settings.installments);
    if (settings.freeShippingThreshold !== undefined) setFreeShippingThreshold(settings.freeShippingThreshold);
    if (settings.fixedShippingRates) setFixedShippingRates(settings.fixedShippingRates);
  }, [settings]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const applyPricingRulesToAllProductsAutomatically = async (rules: PricingRulesConfig) => {
    if (!products || products.length === 0) return 0;
    let updatedCount = 0;
    const updatedProducts = products.map(p => {
      if (p.costPrice !== undefined && p.costPrice > 0) {
        const calc = calculateSuggestedPrice(p.costPrice, rules, p.packagingCost);
        if (calc.suggestedPrice > 0) {
          const newPrice = Math.round(calc.suggestedPrice * 100) / 100;
          if (newPrice !== p.price) {
            updatedCount++;
            return {
              ...p,
              price: newPrice
            };
          }
        }
      }
      return p;
    });

    if (updatedCount > 0) {
      await setProducts(updatedProducts);
    }
    return updatedCount;
  };

  const handlePricingRuleChange = (key: keyof PricingRulesConfig, value: number | boolean) => {
    setPricingRules(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePricingRules = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const loadToast = toast.loading('Salvando despesas fixas e recalculando catálogo...');
    try {
      const updatedRules = { ...pricingRules, useCalculatedFixedCost: true };
      await updateSettings({ pricingRules: updatedRules });
      const updatedCount = await applyPricingRulesToAllProductsAutomatically(updatedRules);
      
      toast.dismiss(loadToast);
      if (updatedCount > 0) {
        toast.success(`Regras de precificação salvas! ${updatedCount} produto(s) recalculado(s) com sucesso.`);
      } else {
        toast.success('Regras de precificação e despesas fixas salvas com sucesso!');
      }
    } catch (error) {
      console.error(error);
      toast.dismiss(loadToast);
      toast.error('Erro ao salvar no banco.');
    }
  };

  const handleSavePaymentMethods = async () => {
    try {
      await updateSettings({ 
        paymentMethods, 
        pixDiscount: pixDiscountPct / 100, 
        installments 
      });
      showToast('Configurações de pagamento atualizadas com sucesso!');
    } catch (error) {
      showToast('Erro ao salvar pagamentos.', 'error');
    }
  };

  const handleSaveShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        freeShippingThreshold,
        fixedShippingRates
      });
      showToast('Configurações de frete salvas com sucesso!');
    } catch (error) {
      showToast('Erro ao salvar frete.', 'error');
    }
  };

  const handleAddStateRate = () => {
    const uf = newStateUf.trim().toUpperCase();
    const rate = parseFloat(newStateRate);
    if (!uf || uf.length !== 2) {
      toast.error('Informe uma sigla de estado (UF) válida com 2 letras.');
      return;
    }
    if (isNaN(rate) || rate < 0) {
      toast.error('Informe um valor de frete válido.');
      return;
    }
    setFixedShippingRates(prev => ({ ...prev, [uf]: rate }));
    setNewStateUf('');
    setNewStateRate('');
  };

  const handleRemoveStateRate = (uf: string) => {
    setFixedShippingRates(prev => {
      const copy = { ...prev };
      delete copy[uf];
      return copy;
    });
  };

  // Metrics
  const totalFixedExpenses = (pricingRules.rentCostMonthly || 0) + 
    (pricingRules.utilitiesCostMonthly || 0) + 
    (pricingRules.salariesCostMonthly || 0) + 
    (pricingRules.marketingCostMonthly || 0) + 
    (pricingRules.softwareAccountingCostMonthly || 0) + 
    (pricingRules.otherFixedCostsMonthly || 0);

  const revenueEst = pricingRules.estimatedMonthlyRevenue || 1;
  const fixedRatePct = (totalFixedExpenses / revenueEst) * 100;

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 text-emerald-600 font-extrabold text-xs uppercase tracking-wider mb-1">
            <DollarSign size={20} className="bg-emerald-100 p-1 rounded-lg" /> Módulo Financeiro
          </div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Gestão Financeira e Precificação</h2>
          <p className="text-gray-500 text-sm mt-0.5">
            Gerencie precificação com custos fixos, métodos de pagamento e regras de frete da sua loja.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-purple-50 border border-purple-100 px-4 py-2.5 rounded-2xl">
            <span className="text-[10px] text-purple-600 font-extrabold uppercase block">Despesas Fixas Totais</span>
            <span className="text-base font-black text-purple-900">R$ {totalFixedExpenses.toLocaleString('pt-BR')}/mês</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl">
            <span className="text-[10px] text-emerald-600 font-extrabold uppercase block">Taxa de Rateio Custo Fixo</span>
            <span className="text-base font-black text-emerald-900">{fixedRatePct.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('precificacao')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl font-extrabold text-xs uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'precificacao'
              ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
              : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
          }`}
        >
          <Calculator size={18} /> Precificação Fixa & Custos
        </button>

        <button
          onClick={() => setActiveTab('pagamentos')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl font-extrabold text-xs uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'pagamentos'
              ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
              : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
          }`}
        >
          <CreditCard size={18} /> Pagamentos & Descontos
        </button>

        <button
          onClick={() => setActiveTab('frete')}
          className={`flex items-center gap-2 px-5 py-3.5 rounded-t-2xl font-extrabold text-xs uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
            activeTab === 'frete'
              ? 'bg-white text-purple-700 border-purple-600 shadow-2xs'
              : 'text-gray-500 hover:text-gray-800 border-transparent hover:bg-gray-100/60'
          }`}
        >
          <Truck size={18} /> Frete & Entrega
        </button>
      </div>

      {/* TAB 1: PRECIFICAÇÃO FIXA */}
      {activeTab === 'precificacao' && (
        <div className="space-y-8 bg-white border border-gray-200/80 p-6 md:p-8 rounded-3xl shadow-sm animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider">
              <Calculator size={16} /> Estrutura de Custos & Margens
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-1">Calculadora de Precificação e Despesas Fixas</h3>
            <p className="text-gray-500 text-sm mt-1">
              Configure seus custos operacionais para que o sistema calcule automaticamente o preço de venda ideal com margem de lucro garantida.
            </p>
          </div>

          <form onSubmit={handleSavePricingRules} className="space-y-8">
            {/* Bloco 1: Impostos e Taxas */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-200">
                <Receipt className="text-purple-600" size={20} />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">1. Impostos, Maquininhas & Comissões (%)</h4>
                  <p className="text-[11px] text-gray-500">Impostos sobre Nota Fiscal, taxas de cartão/gateway e comissão de vendedores</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 space-y-1">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center justify-between">
                    <span>Imposto NF / DAS (%)</span>
                    <Percent size={14} className="text-purple-600" />
                  </label>
                  <p className="text-[10px] text-gray-400">Ex: Simples Nacional (6%), MEI ou Lucro Presumido</p>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={pricingRules.taxRatePct}
                    onChange={e => handlePricingRuleChange('taxRatePct', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold focus:border-purple-600 outline-none mt-1"
                  />
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 space-y-1">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center justify-between">
                    <span>Taxa Gateway / Cartão (%)</span>
                    <CreditCard size={14} className="text-blue-600" />
                  </label>
                  <p className="text-[10px] text-gray-400">Média cobrada pela maquininha ou gateway (Mercado Pago, PagBank)</p>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={pricingRules.gatewayFeePct}
                    onChange={e => handlePricingRuleChange('gatewayFeePct', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold focus:border-purple-600 outline-none mt-1"
                  />
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 space-y-1">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center justify-between">
                    <span>Comissão de Venda (%)</span>
                    <Users size={14} className="text-emerald-600" />
                  </label>
                  <p className="text-[10px] text-gray-400">Comissão paga ao vendedor ou equipe comercial</p>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={pricingRules.commissionPct}
                    onChange={e => handlePricingRuleChange('commissionPct', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold focus:border-purple-600 outline-none mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Bloco 2: Despesas Fixas Mensais */}
            <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200/60">
                <div className="flex items-center gap-2 text-purple-900">
                  <Building2 className="text-purple-600" size={20} />
                  <div>
                    <h4 className="font-extrabold text-sm uppercase tracking-wider">2. Custos e Despesas Fixas Mensais da Loja (R$)</h4>
                    <p className="text-[11px] text-purple-700">Valores fixos que a loja paga todos os meses, independente das vendas</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSavePricingRules()}
                  className="flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all shadow-xs shrink-0"
                >
                  <Save size={15} />
                  <span>SALVAR DESPESAS FIXAS</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Home size={14} className="text-purple-600" /> Aluguel do Espaço / Loja (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">Aluguel da loja, galpão ou estúdio</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={pricingRules.rentCostMonthly}
                      onChange={e => handlePricingRuleChange('rentCostMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Zap size={14} className="text-amber-500" /> Luz, Água & Internet (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">Energia elétrica, água, internet e telefone</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="20"
                      min="0"
                      value={pricingRules.utilitiesCostMonthly}
                      onChange={e => handlePricingRuleChange('utilitiesCostMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Users size={14} className="text-blue-600" /> Salários & Pró-labore (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">Salário de funcionários e retirada dos sócios</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="100"
                      min="0"
                      value={pricingRules.salariesCostMonthly}
                      onChange={e => handlePricingRuleChange('salariesCostMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Megaphone size={14} className="text-rose-600" /> Marketing & Anúncios (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">Tráfego pago Meta/Google Ads, anúncios e influenciadores</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={pricingRules.marketingCostMonthly}
                      onChange={e => handlePricingRuleChange('marketingCostMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Laptop size={14} className="text-indigo-600" /> Sistemas & Contabilidade (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">ERP (Bling/Tiny), plataforma, domínio e honorários do contador</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="20"
                      min="0"
                      value={pricingRules.softwareAccountingCostMonthly}
                      onChange={e => handlePricingRuleChange('softwareAccountingCostMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div className="space-y-1 bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-2xs">
                  <label className="text-[11px] uppercase font-bold text-gray-700 flex items-center gap-1.5">
                    <Building2 size={14} className="text-gray-600" /> Outras Despesas Fixas (R$/mês)
                  </label>
                  <p className="text-[10px] text-gray-400">Manutenção, taxas administrativas e despesas diversas</p>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={pricingRules.otherFixedCostsMonthly}
                      onChange={e => handlePricingRuleChange('otherFixedCostsMonthly', parseFloat(e.target.value) || 0)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pr-3 pl-10 text-sm focus:border-purple-600 outline-none font-bold text-gray-900"
                    />
                  </div>
                </div>
              </div>

              {/* Faturamento Estimado Bar */}
              <div className="bg-purple-900 text-white rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] text-purple-200 uppercase font-extrabold tracking-wider block">Faturamento Mensal Estimado da Loja (R$)</span>
                  <p className="text-[10px] text-purple-300">Estimativa do total vendido no mês para rateio proporcional dos custos fixos</p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  <div className="relative w-40">
                    <span className="absolute left-3 top-2 text-purple-300 font-bold text-xs">R$</span>
                    <input
                      type="number"
                      step="1000"
                      min="1"
                      value={pricingRules.estimatedMonthlyRevenue}
                      onChange={e => handlePricingRuleChange('estimatedMonthlyRevenue', parseFloat(e.target.value) || 1)}
                      className="w-full bg-purple-950 border border-purple-700 text-white font-extrabold text-sm rounded-lg py-1.5 pl-9 pr-2 focus:border-purple-400 outline-none"
                    />
                  </div>

                  <div className="bg-purple-950/80 px-4 py-2 rounded-lg border border-purple-700/60 text-right">
                    <span className="text-[10px] text-purple-300 block uppercase font-bold">Taxa de Rateio Gerada:</span>
                    <span className="text-lg font-black text-emerald-400">
                      {fixedRatePct.toFixed(1)}% <span className="text-[10px] text-purple-300 font-normal">(R$ {totalFixedExpenses.toLocaleString('pt-BR')} /mês)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 3: Margem de Lucro */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-200">
                <TrendingUp className="text-emerald-600" size={20} />
                <div>
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">3. Margem de Lucro Desejada (%)</h4>
                  <p className="text-[11px] text-gray-500">Lucro líquido limpo no bolso após pagar todos os custos e impostos</p>
                </div>
              </div>

              <div className="max-w-md bg-white p-4 rounded-xl border border-gray-200/80 space-y-2">
                <label className="text-[11px] uppercase font-bold text-gray-700">
                  Margem de Lucro Líquido Desejada (%)
                </label>
                <p className="text-[10px] text-gray-400">Recomendado entre 15% e 30% dependendo do segmento</p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    value={pricingRules.desiredProfitPct}
                    onChange={e => handlePricingRuleChange('desiredProfitPct', parseFloat(e.target.value) || 0)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-3 pr-8 text-sm focus:border-emerald-500 outline-none font-black text-emerald-700"
                  />
                  <span className="absolute right-3 top-3 text-emerald-600 font-bold text-sm">%</span>
                </div>
              </div>
            </div>

            {/* Simulation Box / DRE Demonstrativo */}
            {(() => {
              const simResult = calculateSuggestedPrice(simCost, pricingRules);
              return (
                <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <TrendingUp size={16} /> Simulação de Preço e DRE do Produto
                      </div>
                      <h4 className="text-base font-extrabold text-white mt-1">Demonstrativo de Formação de Preço de Venda</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 font-medium">Custo Matéria-prima Teste:</span>
                      <div className="relative w-36">
                        <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">R$</span>
                        <input
                          type="number"
                          value={simCost}
                          onChange={e => setSimCost(parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-lg py-1.5 pl-8 pr-2 focus:border-emerald-400 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                    <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Custo Direto do Produto:</span>
                      <span className="text-xl font-extrabold text-white block">
                        R$ {simResult.totalDirectCost.toFixed(2).replace('.', ',')}
                      </span>
                      <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                        <div>• Item/Matéria-prima: R$ {simResult.baseCost.toFixed(2)}</div>
                        <div>• Embalagem/Etiqueta: R$ {simResult.packagingCost.toFixed(2)}</div>
                        <div>• Frete de Entrada: R$ {simResult.shippingInCost.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Taxas e Rateios Impostos:</span>
                      <span className="text-xl font-extrabold text-amber-400 block">
                        {simResult.sumPct.toFixed(1)}% <span className="text-xs text-slate-400 font-normal">das vendas</span>
                      </span>
                      <div className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                        <div>• Imposto NF: {simResult.taxRatePct}% (R$ {simResult.taxAmount.toFixed(2)})</div>
                        <div>• Maquininha: {simResult.gatewayFeePct}% (R$ {simResult.gatewayFeeAmount.toFixed(2)})</div>
                        <div>• Comissão: {simResult.commissionPct}% (R$ {simResult.commissionAmount.toFixed(2)})</div>
                        <div>• Fixos (Aluguel/Luz/Salários): {simResult.effectiveFixedCostPct.toFixed(1)}% (R$ {simResult.fixedCostAmount.toFixed(2)})</div>
                      </div>
                    </div>

                    <div className="bg-emerald-950/50 p-4 rounded-xl border border-emerald-800/80 space-y-1.5">
                      <span className="text-emerald-400 font-extrabold uppercase text-[10px] block">Preço de Venda Sugerido:</span>
                      <span className="text-3xl font-black text-emerald-400 block">
                        R$ {simResult.suggestedPrice.toFixed(2).replace('.', ',')}
                      </span>
                      <p className="text-[10px] text-emerald-200 pt-1 border-t border-emerald-900">
                        Preço final no catálogo cobrindo 100% das despesas e gerando lucro desejado.
                      </p>
                    </div>

                    <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-slate-400 font-extrabold uppercase text-[10px] block">Lucro Líquido Limpo:</span>
                      <span className="text-xl font-extrabold text-green-400 block">
                        R$ {simResult.profitAmount.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-[10px] text-slate-400 block pt-1 border-t border-slate-800">
                        Margem Real de {simResult.profitMarginRealPct.toFixed(1)}% limpa sobre o preço de venda.
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-end gap-4">
              <button type="submit" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all shadow-md">
                <Save size={18} /> Salvar Regras de Precificação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: PAGAMENTOS */}
      {activeTab === 'pagamentos' && (
        <div className="space-y-8 bg-white border border-gray-200/80 p-6 md:p-8 rounded-3xl shadow-sm animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider">
              <CreditCard size={16} /> Métodos de Pagamento & Checkout
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-1">Configuração de Pagamentos e Descontos</h3>
            <p className="text-gray-500 text-sm mt-1">
              Ative ou desative as formas de pagamento aceitas pela loja no checkout do site.
            </p>
          </div>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <PaymentToggle
                icon={Banknote}
                title="Pix (Transferência Rápida)"
                active={paymentMethods.pix !== false}
                onToggle={() => setPaymentMethods(p => ({ ...p, pix: !p.pix }))}
              />
              <PaymentToggle
                icon={CreditCard}
                title="Cartão de Crédito"
                active={paymentMethods.credit !== false}
                onToggle={() => setPaymentMethods(p => ({ ...p, credit: !p.credit }))}
              />
              <PaymentToggle
                icon={CreditCard}
                title="Cartão de Débito"
                active={paymentMethods.debit !== false}
                onToggle={() => setPaymentMethods(p => ({ ...p, debit: !p.debit }))}
              />
              <PaymentToggle
                icon={Receipt}
                title="Boleto Bancário"
                active={!!paymentMethods.boleto}
                onToggle={() => setPaymentMethods(p => ({ ...p, boleto: !p.boleto }))}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6 p-6 border border-gray-100 rounded-2xl bg-gray-50/60">
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-gray-700 font-bold ml-1 flex items-center gap-1.5">
                  <Percent size={14} className="text-emerald-600" /> Desconto Especial no Pix (%)
                </label>
                <p className="text-[10px] text-gray-400 ml-1">Incentive o pagamento no Pix oferecendo desconto direto no checkout</p>
                <div className="relative mt-1">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="50"
                    value={pixDiscountPct}
                    onChange={e => setPixDiscountPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 font-extrabold text-sm text-gray-900 focus:border-purple-600 outline-none"
                  />
                  <span className="absolute right-3 top-3.5 text-gray-400 font-bold text-sm">%</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider text-gray-700 font-bold ml-1 flex items-center gap-1.5">
                  <CreditCard size={14} className="text-blue-600" /> Parcelas sem Juros (Máximo)
                </label>
                <p className="text-[10px] text-gray-400 ml-1">Número máximo de parcelas sem acréscimo no cartão</p>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="12"
                  value={installments}
                  onChange={e => setInstallments(parseInt(e.target.value) || 1)}
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 font-extrabold text-sm text-gray-900 focus:border-purple-600 outline-none mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSavePaymentMethods}
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
              >
                <Save size={18} /> Salvar Configurações de Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FRETE & ENTREGA */}
      {activeTab === 'frete' && (
        <div className="space-y-8 bg-white border border-gray-200/80 p-6 md:p-8 rounded-3xl shadow-sm animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 text-purple-600 text-xs font-bold uppercase tracking-wider">
              <Truck size={16} /> Logística & Fretes
            </div>
            <h3 className="text-xl font-black text-gray-900 mt-1">Regras de Frete e Entrega</h3>
            <p className="text-gray-500 text-sm mt-1">
              Defina o valor mínimo para Frete Grátis e ajuste tabelas de frete fixo por estado.
            </p>
          </div>

          <form onSubmit={handleSaveShipping} className="space-y-8">
            {/* Frete Grátis */}
            <div className="p-6 border border-gray-200/80 rounded-2xl bg-gray-50/60 space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                <Truck size={18} className="text-purple-600" /> Promoção de Frete Grátis
              </h4>
              <div className="space-y-1.5 max-w-md">
                <label className="text-[11px] uppercase tracking-wider text-gray-600 font-bold ml-1">
                  Valor Mínimo do Pedido para Frete Grátis (R$)
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={freeShippingThreshold || ''}
                    onChange={e => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 199.90 (Coloque 0 para desativar)"
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-3 font-extrabold text-sm text-gray-900 focus:border-purple-600 outline-none"
                  />
                </div>
                <p className="text-[10px] text-gray-400 ml-1">
                  Pedidos com valor igual ou superior a esta quantia receberão frete R$ 0,00 no carrinho.
                </p>
              </div>
            </div>

            {/* Tabela de Fretes Fixos por Estado */}
            <div className="p-6 border border-gray-200/80 rounded-2xl bg-white space-y-4">
              <h4 className="text-sm font-extrabold uppercase tracking-wider text-gray-800 flex items-center gap-2">
                <Layers size={18} className="text-blue-600" /> Tabela de Frete Fixo por Estado (UF)
              </h4>
              <p className="text-xs text-gray-500">
                Cadastre valores fixos de entrega para estados específicos do Brasil.
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  maxLength={2}
                  value={newStateUf}
                  onChange={e => setNewStateUf(e.target.value.toUpperCase())}
                  placeholder="UF (Ex: SP)"
                  className="w-28 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm font-bold uppercase focus:border-purple-600 outline-none"
                />
                <div className="relative w-40">
                  <span className="absolute left-3 top-3 text-gray-400 font-bold text-sm">R$</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={newStateRate}
                    onChange={e => setNewStateRate(e.target.value)}
                    placeholder="Valor (Ex: 15.90)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-9 pr-3 text-sm font-bold focus:border-purple-600 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddStateRate}
                  className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
                >
                  <Plus size={16} /> Adicionar Estado
                </button>
              </div>

              {Object.keys(fixedShippingRates).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                  {Object.entries(fixedShippingRates).map(([uf, rate]) => (
                    <div key={uf} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <div>
                        <span className="font-black text-sm text-gray-900 uppercase">{uf}</span>
                        <span className="text-xs font-bold text-purple-700 block">R$ {Number(rate).toFixed(2).replace('.', ',')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStateRate(uf)}
                        className="text-gray-400 hover:text-red-600 p-1.5 transition-colors rounded-lg hover:bg-red-50"
                        title="Remover"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic pt-2">Nenhum estado cadastrado. O frete padrão de consulta de CEP será aplicado.</p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
              >
                <Save size={18} /> Salvar Regras de Frete
              </button>
            </div>
          </form>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border ${
            toastMessage.type === 'success' 
              ? 'bg-white border-green-100 text-green-800' 
              : 'bg-white border-red-100 text-red-800'
          }`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              toastMessage.type === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <CheckCircle2 size={16} className={toastMessage.type === 'success' ? 'text-green-600' : 'text-red-600'} />
            </div>
            <span className="font-medium text-sm">{toastMessage.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}

function PaymentToggle({ icon: Icon, title, active, onToggle }: { icon: any; title: string; active: boolean; onToggle: () => void }) {
  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
        active ? 'bg-purple-50/60 border-purple-500 shadow-2xs' : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
          active ? 'bg-purple-600 text-white shadow-xs' : 'bg-gray-100 text-gray-400'
        }`}>
          <Icon size={20} />
        </div>
        <span className={`font-bold text-sm ${active ? 'text-gray-900' : 'text-gray-500'}`}>{title}</span>
      </div>

      <div className={`w-11 h-6 rounded-full relative transition-colors ${active ? 'bg-purple-600' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${active ? 'left-[22px]' : 'left-[2px]'}`} />
      </div>
    </div>
  );
}
