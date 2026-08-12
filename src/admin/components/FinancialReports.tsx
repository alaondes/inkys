import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import React, { useState, useMemo, useRef } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { 
  DollarSign, TrendingUp, TrendingDown, Percent, ShoppingBag, 
  Award, Ticket, Calendar, Download, Printer, Filter, ShieldCheck, 
  PieChart as PieIcon, BarChart3, AlertCircle, ArrowUpRight, ArrowDownRight, 
  Layers, ChevronRight, RefreshCw, FileSpreadsheet, Sparkles, Edit2, X, Check, Truck
} from 'lucide-react';
import { formatPrice, Product } from '../../data/products';
import { useSettings } from '../../context/SettingsContext';
import { useProducts } from '../../context/ProductContext';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export interface RawOrder {
  id: string;
  total: number;
  subtotal?: number;
  discount?: number;
  shippingCost?: number;
  status: string;
  paymentMethod?: string;
  couponCode?: string;
  customer?: string;
  date: Date | null;
  items?: Array<{
    id?: string;
    productId?: string;
    name: string;
    quantity: number;
    price: number;
    costPrice?: number;
  }>;
}

export type DateFilterPreset = 'today' | 'yesterday' | '7d' | '30d' | 'month' | 'last_month' | 'year' | 'custom';
export type StatusFilterOption = 'paid_only' | 'include_pending' | 'all';

interface FinancialReportsProps {
  orders: RawOrder[];
}

const PAYMENT_COLORS: Record<string, string> = {
  'PIX': '#10b981',
  'Cartão de Crédito': '#3b82f6',
  'Cartão de Débito': '#06b6d4',
  'Boleto': '#f59e0b',
  'Dinheiro': '#8b5cf6',
  'Outros': '#6b7280',
};

export function FinancialReports({ orders }: FinancialReportsProps) {
  const { settings } = useSettings();
  const { products } = useProducts();
  const [avulsos, setAvulsos] = useState<any[]>([]);
  const [editingCostModal, setEditingCostModal] = useState<{
    productName: string;
    unitPrice: number;
    currentCost?: number;
  } | null>(null);
  const [costInputValue, setCostInputValue] = useState<string>('');

  React.useEffect(() => {
    const q = query(collection(db, 'avulso_products'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvulsos(data);
    });
    return () => unsubscribe();
  }, []);

  // Filters State
  const [preset, setPreset] = useState<DateFilterPreset>('month');
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // First day of current month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>('paid_only');
  const [activeTab, setActiveTab] = useState<'dre' | 'abc' | 'coupons'>('dre');

  // Product cost filter & sort for ABC table
  const [productCostFilter, setProductCostFilter] = useState<'all' | 'has_cost' | 'missing_cost' | 'high_margin' | 'mid_margin' | 'low_margin'>('all');
  const [productSortBy, setProductSortBy] = useState<'revenue' | 'profit' | 'margin' | 'markup' | 'quantity' | 'cost'>('revenue');

  // Handle Preset Changes
  const handlePresetChange = (newPreset: DateFilterPreset) => {
    setPreset(newPreset);
    const now = new Date();
    
    if (newPreset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (newPreset === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (newPreset === '7d') {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === '30d') {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (newPreset === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (newPreset === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Map products cost price for fast lookup (combining catalog products and avulso products)
  const productCostMap = useMemo(() => {
    const map = new Map<string, { cost: number; isRealCost: boolean; source: 'catalog' | 'avulso'; id?: string }>();
    products.forEach(p => {
      const isRealCost = p.costPrice !== undefined && p.costPrice > 0;
      const cost = p.costPrice || 0;
      const info = { cost, isRealCost, source: 'catalog' as const, id: p.id };
      if (p.name) map.set(p.name.toLowerCase().trim(), info);
      if (p.id) map.set(p.id, info);
    });

    avulsos.forEach(a => {
      const isRealCost = a.costPrice !== undefined && a.costPrice > 0;
      const cost = a.costPrice || 0;
      const info = { cost, isRealCost, source: 'avulso' as const, id: a.id };
      if (a.name) map.set(a.name.toLowerCase().trim(), info);
      if (a.id) map.set(a.id, info);
    });

    return map;
  }, [products, avulsos]);

  const handleSaveProductCost = async () => {
    if (!editingCostModal) return;
    const newCost = costInputValue ? parseFloat(costInputValue.replace(/\./g, '').replace(',', '.')) : 0;
    
    try {
      const keyName = editingCostModal.productName.toLowerCase().trim();
      const existingMap = productCostMap.get(keyName);

      if (existingMap?.source === 'catalog' && existingMap.id) {
        await updateDoc(doc(db, 'products', existingMap.id), {
          costPrice: newCost
        });
        toast.success(`Custo do produto "${editingCostModal.productName}" atualizado no Catálogo!`);
      } else if (existingMap?.source === 'avulso' && existingMap.id) {
        await updateDoc(doc(db, 'avulso_products', existingMap.id), {
          costPrice: newCost
        });
        toast.success(`Custo do produto avulso "${editingCostModal.productName}" atualizado!`);
      } else {
        await addDoc(collection(db, 'avulso_products'), {
          name: editingCostModal.productName,
          price: editingCostModal.unitPrice || 0,
          costPrice: newCost,
          createdAt: serverTimestamp()
        });
        toast.success(`Custo salvo para "${editingCostModal.productName}"!`);
      }

      setEditingCostModal(null);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar custo do produto.');
    }
  };

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    if (!startDate || !endDate) return orders;

    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    return orders.filter(o => {
      if (!o.date) return false;
      const orderTime = o.date.getTime();
      const inDateRange = orderTime >= start.getTime() && orderTime <= end.getTime();
      if (!inDateRange) return false;

      // Status Filter
      if (statusFilter === 'paid_only') {
        const s = (o.status || '').toLowerCase().trim();
        return s === 'pago' || s === 'concluído' || s === 'concluido' || s === 'entregue' || s === 'enviado' || s === 'faturado' || s === 'aprovado' || s === 'paga' || s === 'finalizado';
      } else if (statusFilter === 'include_pending') {
        const s = (o.status || '').toLowerCase();
        return s !== 'cancelado' && s !== 'reembolsado';
      }
      return true; // 'all'
    });
  }, [orders, startDate, endDate, statusFilter]);

  // Canceled Orders in Period
  const canceledOrders = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');

    return orders.filter(o => {
      if (!o.date) return false;
      const orderTime = o.date.getTime();
      const inDateRange = orderTime >= start.getTime() && orderTime <= end.getTime();
      const s = (o.status || '').toLowerCase();
      return inDateRange && (s === 'cancelado' || s === 'reembolsado');
    });
  }, [orders, startDate, endDate]);

  // Comprehensive DRE Financial Metrics
  const dreMetrics = useMemo(() => {
    let grossRevenueGMV = 0; // Preço Produtos + Frete
    let totalProductsRevenue = 0; // Subtotal apenas Produtos
    let totalShippingRevenue = 0; // Total de Frete Cobrado
    let totalDiscounts = 0;  // Cupons + Descontos
    let totalCanceledValue = 0;
    let cmvTotal = 0;
    let validPaidOrdersCount = 0;
    let realCostItemsCount = 0;
    let totalItemsCount = 0;

    canceledOrders.forEach(o => {
      totalCanceledValue += (Number(o.total) || 0);
    });

    filteredOrders.forEach(order => {
      const total = Number(order.total) || 0;
      const discount = Number(order.discount) || 0;
      const shipping = Number(order.shippingCost) || 0;
      const subtotal = Number(order.subtotal) || Math.max(0, total + discount - shipping);

      totalProductsRevenue += subtotal;
      totalShippingRevenue += shipping;

      // GMV = Subtotal produtos + Frete
      const orderGMV = subtotal + shipping;
      grossRevenueGMV += orderGMV;
      totalDiscounts += discount;
      validPaidOrdersCount += 1;

      // Calculate CMV (Custo das Mercadorias Vendidas)
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const qty = Number(item.quantity) || 1;
          const itemPrice = Number(item.price) || 0;
          let cost = 0;
          let isRealCost = false;

          const keyName = item.name ? item.name.toLowerCase().trim() : '';
          const keyId = item.productId || '';

          if (item.costPrice !== undefined && item.costPrice > 0) {
            cost = Number(item.costPrice);
            isRealCost = true;
          } else if (keyName && productCostMap.has(keyName)) {
            const info = productCostMap.get(keyName)!;
            cost = info.cost;
            isRealCost = info.isRealCost;
          } else if (keyId && productCostMap.has(keyId)) {
            const info = productCostMap.get(keyId)!;
            cost = info.cost;
            isRealCost = info.isRealCost;
          }

          if (!isRealCost && itemPrice > 0) {
            cost = itemPrice * 0.35; // Default 35% fallback
          }

          if (isRealCost) {
            realCostItemsCount += qty;
          }
          totalItemsCount += qty;

          cmvTotal += (cost * qty);
        });
      } else {
        cmvTotal += (subtotal * 0.35);
        totalItemsCount += 1;
      }
    });

    const netRevenue = grossRevenueGMV - totalDiscounts; // Receita Líquida Real
    const grossProfit = netRevenue - cmvTotal; // Lucro Bruto Estimado
    const grossMarginPercent = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    const markupPercent = cmvTotal > 0 ? (grossProfit / cmvTotal) * 100 : 0;
    const averageTicket = validPaidOrdersCount > 0 ? netRevenue / validPaidOrdersCount : 0;
    const averageShippingPerOrder = validPaidOrdersCount > 0 ? totalShippingRevenue / validPaidOrdersCount : 0;
    const averageProfitPerOrder = validPaidOrdersCount > 0 ? grossProfit / validPaidOrdersCount : 0;
    const realCostCoveragePct = totalItemsCount > 0 ? (realCostItemsCount / totalItemsCount) * 100 : 0;

    return {
      grossRevenueGMV,
      totalProductsRevenue,
      totalShippingRevenue,
      totalDiscounts,
      totalCanceledValue,
      canceledCount: canceledOrders.length,
      netRevenue,
      cmvTotal,
      grossProfit,
      grossMarginPercent,
      markupPercent,
      validPaidOrdersCount,
      averageTicket,
      averageShippingPerOrder,
      averageProfitPerOrder,
      realCostItemsCount,
      totalItemsCount,
      realCostCoveragePct,
      hasUnregisteredCosts: realCostCoveragePct < 100
    };
  }, [filteredOrders, canceledOrders, productCostMap]);

  // Evolution Chart Data (Bruto vs. Líquido over time)
  const evolutionChartData = useMemo(() => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T23:59:59.999');
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

    const dayMap = new Map<string, { label: string; fullDate: string; bruto: number; liquido: number; pedidos: number }>();

    // Generate date ticks
    for (let i = 0; i < Math.min(diffDays, 60); i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const fullDate = d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });

      dayMap.set(key, { label, fullDate, bruto: 0, liquido: 0, pedidos: 0 });
    }

    filteredOrders.forEach(o => {
      if (!o.date) return;
      const key = o.date.toISOString().split('T')[0];
      if (dayMap.has(key)) {
        const item = dayMap.get(key)!;
        const total = Number(o.total) || 0;
        const discount = Number(o.discount) || 0;
        const subtotal = Number(o.subtotal) || (total + discount);
        const shipping = Number(o.shippingCost) || 0;

        const bruto = subtotal + shipping;
        const liquido = total;

        item.bruto += bruto;
        item.liquido += liquido;
        item.pedidos += 1;
      }
    });

    return Array.from(dayMap.values());
  }, [filteredOrders, startDate, endDate]);

  // Breakdown by Payment Method
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();

    filteredOrders.forEach(o => {
      let method = o.paymentMethod || 'Outros';
      const norm = method.toLowerCase();
      if (norm.includes('pix')) method = 'PIX';
      else if (norm.includes('crédito') || norm.includes('credito') || norm.includes('cartao')) method = 'Cartão de Crédito';
      else if (norm.includes('débito') || norm.includes('debito')) method = 'Cartão de Débito';
      else if (norm.includes('boleto')) method = 'Boleto';
      else if (norm.includes('dinheiro')) method = 'Dinheiro';
      else method = 'Outros';

      const current = map.get(method) || { count: 0, total: 0 };
      current.count += 1;
      current.total += (Number(o.total) || 0);
      map.set(method, current);
    });

    const totalRev = dreMetrics.netRevenue || 1;
    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      value: data.total,
      count: data.count,
      percent: (data.total / totalRev) * 100,
      color: PAYMENT_COLORS[name] || '#6b7280'
    })).sort((a, b) => b.value - a.value);
  }, [filteredOrders, dreMetrics.netRevenue]);

  // Curva ABC de Produtos Calculation
  const abcProducts = useMemo(() => {
    const productStatsMap = new Map<string, { 
      name: string; 
      quantity: number; 
      revenue: number; 
      cost: number; 
      profit: number;
      isRealCost: boolean;
      unitPrice: number;
      unitCost: number;
    }>();

    filteredOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          const name = item.name || 'Produto sem nome';
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const rev = price * qty;

          let unitCost = 0;
          let isRealCost = false;

          const keyName = name.toLowerCase().trim();
          const keyId = item.productId || '';

          if (item.costPrice !== undefined && item.costPrice > 0) {
            unitCost = Number(item.costPrice);
            isRealCost = true;
          } else if (productCostMap.has(keyName)) {
            const info = productCostMap.get(keyName)!;
            unitCost = info.cost;
            isRealCost = info.isRealCost;
          } else if (keyId && productCostMap.has(keyId)) {
            const info = productCostMap.get(keyId)!;
            unitCost = info.cost;
            isRealCost = info.isRealCost;
          }

          if (!isRealCost && price > 0) {
            unitCost = price * 0.35;
          }

          const totalCost = unitCost * qty;
          const profit = rev - totalCost;

          if (productStatsMap.has(name)) {
            const current = productStatsMap.get(name)!;
            current.quantity += qty;
            current.revenue += rev;
            current.cost += totalCost;
            current.profit += profit;
          } else {
            productStatsMap.set(name, {
              name,
              quantity: qty,
              revenue: rev,
              cost: totalCost,
              profit,
              isRealCost,
              unitPrice: price,
              unitCost
            });
          }
        });
      }
    });

    const list = Array.from(productStatsMap.values()).sort((a, b) => b.revenue - a.revenue);
    const totalCatalogRevenue = list.reduce((acc, p) => acc + p.revenue, 0) || 1;

    let accumulatedRevenue = 0;
    return list.map(item => {
      accumulatedRevenue += item.revenue;
      const cumPct = (accumulatedRevenue / totalCatalogRevenue) * 100;
      const sharePct = (item.revenue / totalCatalogRevenue) * 100;

      let categoryABC: 'A' | 'B' | 'C' = 'C';
      if (cumPct <= 80 || (cumPct - sharePct < 80)) {
        categoryABC = 'A';
      } else if (cumPct <= 95) {
        categoryABC = 'B';
      } else {
        categoryABC = 'C';
      }

      const marginPct = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
      const markupPct = item.cost > 0 ? (item.profit / item.cost) * 100 : 0;

      return {
        ...item,
        sharePct,
        cumPct,
        categoryABC,
        marginPct,
        markupPct
      };
    });
  }, [filteredOrders, productCostMap]);

  const processedAbcProducts = useMemo(() => {
    let result = [...abcProducts];

    // Filter
    if (productCostFilter === 'has_cost') {
      result = result.filter(p => p.isRealCost);
    } else if (productCostFilter === 'missing_cost') {
      result = result.filter(p => !p.isRealCost);
    } else if (productCostFilter === 'high_margin') {
      result = result.filter(p => p.marginPct >= 50);
    } else if (productCostFilter === 'mid_margin') {
      result = result.filter(p => p.marginPct >= 20 && p.marginPct < 50);
    } else if (productCostFilter === 'low_margin') {
      result = result.filter(p => p.marginPct < 20);
    }

    // Sort
    result.sort((a, b) => {
      if (productSortBy === 'profit') return b.profit - a.profit;
      if (productSortBy === 'margin') return b.marginPct - a.marginPct;
      if (productSortBy === 'markup') return b.markupPct - a.markupPct;
      if (productSortBy === 'quantity') return b.quantity - a.quantity;
      if (productSortBy === 'cost') return b.cost - a.cost;
      return b.revenue - a.revenue;
    });

    return result;
  }, [abcProducts, productCostFilter, productSortBy]);

  // Coupons Breakdown Calculation
  const couponsReport = useMemo(() => {
    const couponMap = new Map<string, { code: string; count: number; totalDiscount: number; totalRevenue: number }>();

    filteredOrders.forEach(o => {
      const discount = Number(o.discount) || 0;
      if (discount > 0 || o.couponCode) {
        const code = (o.couponCode || 'DESCONTO_MANUAL').toUpperCase().trim();
        const current = couponMap.get(code) || { code, count: 0, totalDiscount: 0, totalRevenue: 0 };
        current.count += 1;
        current.totalDiscount += discount;
        current.totalRevenue += (Number(o.total) || 0);
        couponMap.set(code, current);
      }
    });

    return Array.from(couponMap.values()).sort((a, b) => b.totalDiscount - a.totalDiscount);
  }, [filteredOrders]);

  // Export CSV Report Function
  const handleExportCSV = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    
    // Header & Summary DRE
    csv += `RELATÓRIO FINANCEIRO EXECUTIVO & DRE SIMPLIFICADA\n`;
    csv += `Loja: "${settings.storeName || 'Sua Loja'}"\n`;
    csv += `Período: "${startDate} até ${endDate}"\n`;
    csv += `Status Considerados: "${statusFilter === 'paid_only' ? 'Apenas Pagos' : statusFilter === 'include_pending' ? 'Incluir Pendentes' : 'Todos'}"\n\n`;

    csv += `1. DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO (DRE)\n`;
    csv += `Métrica,Valor (R$),Representação (%)\n`;
    csv += `Venda Bruta de Produtos,${dreMetrics.totalProductsRevenue.toFixed(2)},${((dreMetrics.totalProductsRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(2)}%\n`;
    csv += `(+) Receita de Frete / Entregas,${dreMetrics.totalShippingRevenue.toFixed(2)},${((dreMetrics.totalShippingRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(2)}%\n`;
    csv += `(=) Faturamento Bruto (GMV),${dreMetrics.grossRevenueGMV.toFixed(2)},100.00%\n`;
    csv += `(-) Descontos e Cupons,${dreMetrics.totalDiscounts.toFixed(2)},${((dreMetrics.totalDiscounts / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(2)}%\n`;
    csv += `(-) Pedidos Cancelados,${dreMetrics.totalCanceledValue.toFixed(2)},${((dreMetrics.totalCanceledValue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(2)}%\n`;
    csv += `(=) Receita Líquida,${dreMetrics.netRevenue.toFixed(2)},100.00%\n`;
    csv += `(-) Custo das Mercadorias Vendidas (CMV),${dreMetrics.cmvTotal.toFixed(2)},${((dreMetrics.cmvTotal / (dreMetrics.netRevenue || 1)) * 100).toFixed(2)}%\n`;
    csv += `(=) Lucro Bruto Estimado,${dreMetrics.grossProfit.toFixed(2)},${dreMetrics.grossMarginPercent.toFixed(2)}%\n`;
    csv += `Ticket Médio por Pedido,${dreMetrics.averageTicket.toFixed(2)},-\n`;
    csv += `Frete Médio por Pedido,${dreMetrics.averageShippingPerOrder.toFixed(2)},-\n\n`;

    // Curva ABC e Lucratividade por Produto
    csv += `2. LUCRATIVIDADE E CURVA ABC DE PRODUTOS\n`;
    csv += `Produto,Preço Venda (R$),Custo Unitário (R$),Origem Custo,Qtd Vendida,Faturamento (R$),CMV Total (R$),Lucro Bruto (R$),Margem (%),Markup (%),% Faturamento,Classe ABC\n`;
    abcProducts.forEach(p => {
      const origemCost = p.isRealCost ? 'Custo Real Cadastrado' : 'Estimativa 35%';
      csv += `"${p.name}",${p.unitPrice.toFixed(2)},${p.unitCost.toFixed(2)},"${origemCost}",${p.quantity},${p.revenue.toFixed(2)},${p.cost.toFixed(2)},${p.profit.toFixed(2)},${p.marginPct.toFixed(2)}%,${p.markupPct.toFixed(2)}%,${p.sharePct.toFixed(2)}%,Classe ${p.categoryABC}\n`;
    });
    csv += `\n`;

    // Cupons
    csv += `3. DESCONTO E CUPONS\n`;
    csv += `Cupom / Código,Qtd de Usos,Total de Desconto Concedido (R$),Faturamento Gerado (R$),Ticket Médio (R$)\n`;
    couponsReport.forEach(c => {
      const avg = c.count > 0 ? c.totalRevenue / c.count : 0;
      csv += `"${c.code}",${c.count},${c.totalDiscount.toFixed(2)},${c.totalRevenue.toFixed(2)},${avg.toFixed(2)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_dre_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Relatório CSV/Excel baixado com sucesso!');
  };

  // Print Clean Report
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP BAR & FILTERS (Flexible Date Selector & Status) */}
      <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
              <BarChart3 className="text-[var(--color-primary)]" size={24} /> Relatórios Financeiros & DRE
            </h2>
            <p className="text-gray-500 text-xs font-medium mt-0.5">
              Análise executiva de faturamento, custos, CMV, curva de produtos e saúde financeira
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <FileSpreadsheet size={16} /> Exportar Excel/CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs"
            >
              <Printer size={16} /> Relatório PDF / Imprimir
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end pt-1">
          {/* Quick Date Presets */}
          <div className="lg:col-span-6 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Calendar size={14} className="text-[var(--color-primary)]" /> Período do Relatório
            </label>
            <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
              {[
                { id: 'today', label: 'Hoje' },
                { id: 'yesterday', label: 'Ontem' },
                { id: '7d', label: '7 Dias' },
                { id: '30d', label: '30 Dias' },
                { id: 'month', label: 'Este Mês' },
                { id: 'last_month', label: 'Mês Passado' },
                { id: 'year', label: 'Este Ano' },
                { id: 'custom', label: 'Personalizado' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handlePresetChange(p.id as DateFilterPreset)}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    preset === p.id 
                      ? 'bg-white text-[var(--color-primary)] shadow-xs' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Inputs */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">Intervalo de Datas</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[var(--color-primary)]"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-800 outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          </div>

          {/* Order Status Filter */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <Filter size={14} className="text-[var(--color-primary)]" /> Status dos Pedidos
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterOption)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2 text-xs font-bold text-gray-800 outline-none focus:border-[var(--color-primary)]"
            >
              <option value="paid_only">Apenas Pedidos Pagos / Faturados</option>
              <option value="include_pending">Incluir Pedidos Pendentes</option>
              <option value="all">Todos (Incluindo Cancelados)</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRINTABLE REPORT HEADER (Only visible during print mode) */}
      <div className="hidden print:block p-8 bg-white border-b border-gray-300 text-gray-900 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            {settings.logoUrl ? (
              <img src={convertGoogleDriveUrl(settings.logoUrl)} alt="Logo" className="h-14 w-auto object-contain mb-2" />
            ) : null}
            <h1 className="text-2xl font-black uppercase tracking-tight">{settings.storeName || 'RELATÓRIO FINANCEIRO & DRE'}</h1>
            <p className="text-xs text-gray-600 font-semibold uppercase">Demonstração de Resultados e Desempenho Executivo de Vendas</p>
          </div>
          <div className="text-right text-xs text-gray-600 space-y-1">
            <p><strong>Período Analisado:</strong> {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR')} até {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
            <p><strong>Emissão:</strong> {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Status Considerados:</strong> {statusFilter === 'paid_only' ? 'Apenas Pagos' : statusFilter === 'include_pending' ? 'Incluir Pendentes' : 'Todos'}</p>
          </div>
        </div>
      </div>

      {/* 2. DRE SIMPLIFICADA EXECUTIVE BOARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary)]">Métricas Financeiras</span>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">1. DRE Simplificada (Demonstração do Resultado)</h3>
          </div>
          <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            {dreMetrics.validPaidOrdersCount} {dreMetrics.validPaidOrdersCount === 1 ? 'pedido considerado' : 'pedidos considerados'}
          </span>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Vendas de Produtos */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Vendas de Produtos</span>
            <p className="text-xl font-black text-gray-900 tracking-tight">{formatPrice(dreMetrics.totalProductsRevenue)}</p>
            <p className="text-[11px] text-gray-400 font-medium">Subtotal dos Itens</p>
          </div>

          {/* Frete Cobrado */}
          <div className="bg-indigo-50/60 border border-indigo-200 p-4 rounded-xl space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">(+) Frete Cobrado</span>
              <Truck size={14} className="text-indigo-600" />
            </div>
            <p className="text-xl font-black text-indigo-950 tracking-tight">{formatPrice(dreMetrics.totalShippingRevenue)}</p>
            <p className="text-[11px] text-indigo-700 font-medium">{formatPrice(dreMetrics.averageShippingPerOrder)}/pedido méd.</p>
          </div>

          {/* GMV */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider block">Faturamento Bruto (GMV)</span>
            <p className="text-xl font-black text-gray-900 tracking-tight">{formatPrice(dreMetrics.grossRevenueGMV)}</p>
            <p className="text-[11px] text-gray-400 font-medium">Produtos + Frete Cobrado</p>
          </div>

          {/* Deduções */}
          <div className="bg-amber-50/50 border border-amber-200/70 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider block">(-) Descontos Concedidos</span>
            <p className="text-xl font-black text-amber-900 tracking-tight">{formatPrice(dreMetrics.totalDiscounts)}</p>
            <p className="text-[11px] text-amber-700 font-medium">Cupons e Abatimentos</p>
          </div>

          {/* Receita Líquida */}
          <div className="bg-blue-50/50 border border-blue-200/80 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider block">(=) Receita Líquida Real</span>
            <p className="text-xl font-black text-blue-950 tracking-tight">{formatPrice(dreMetrics.netRevenue)}</p>
            <p className="text-[11px] text-blue-700 font-medium">GMV - Descontos</p>
          </div>

          {/* Lucro Bruto */}
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-1">
            <div className="flex justify-between items-center gap-1">
              <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">(=) Lucro Bruto</span>
              <div className="flex items-center gap-1">
                <span className="bg-emerald-200 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                  {dreMetrics.grossMarginPercent.toFixed(1)}% Margem
                </span>
              </div>
            </div>
            <p className="text-xl font-black text-emerald-950 tracking-tight">{formatPrice(dreMetrics.grossProfit)}</p>
            <p className="text-[11px] text-emerald-700 font-medium flex justify-between">
              <span>Receita - CMV</span>
              <span className="font-bold text-emerald-800">{formatPrice(dreMetrics.averageProfitPerOrder)}/ped</span>
            </p>
          </div>
        </div>

        {/* Visual Revenue Breakdown Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-bold text-gray-700 gap-1">
            <span className="uppercase tracking-wider text-[11px] text-gray-500 font-extrabold flex items-center gap-1.5">
              <PieIcon size={14} className="text-[var(--color-primary)]" /> Composição do Faturamento Bruto (GMV)
            </span>
            <div className="flex items-center gap-4 text-[11px] flex-wrap">
              <span className="flex items-center gap-1.5 text-gray-700">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-600"></span>
                Produtos: <strong>{formatPrice(dreMetrics.totalProductsRevenue)}</strong> ({((dreMetrics.totalProductsRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                Frete: <strong>{formatPrice(dreMetrics.totalShippingRevenue)}</strong> ({((dreMetrics.totalShippingRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                CMV: <strong>{formatPrice(dreMetrics.cmvTotal)}</strong> ({((dreMetrics.cmvTotal / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                Descontos: <strong>{formatPrice(dreMetrics.totalDiscounts)}</strong> ({((dreMetrics.totalDiscounts / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-800">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Lucro Bruto: <strong>{formatPrice(dreMetrics.grossProfit)}</strong> ({((dreMetrics.grossProfit / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
              style={{ width: `${Math.min(100, Math.max(0, (dreMetrics.totalProductsRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100))}%` }} 
              className="bg-gray-600 h-full transition-all"
              title="Venda de Produtos"
            />
            <div 
              style={{ width: `${Math.min(100, Math.max(0, (dreMetrics.totalShippingRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100))}%` }} 
              className="bg-indigo-500 h-full transition-all"
              title="Frete Cobrado"
            />
          </div>
        </div>

        {/* Cost Registration Notice */}
        {dreMetrics.hasUnregisteredCosts && (
          <div className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-bold">Precisão do Relatório e Cadastro de Custos:</p>
              <p className="text-amber-800 leading-relaxed">
                <strong>{dreMetrics.realCostCoveragePct.toFixed(0)}%</strong> das mercadorias vendidas possuem Preço de Custo cadastrado. 
                Os itens sem custo individual utilizam a estimativa técnica de <strong>35%</strong> sobre o preço de venda. 
                Para garantir 100% de precisão no CMV e Lucro Bruto, acesse o menu <strong>Produtos</strong> e informe o Preço de Custo de cada item.
              </p>
            </div>
          </div>
        )}

        {/* Detailed DRE Table Statement */}
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Linha da DRE</th>
                <th className="py-3 px-4 text-right">Valor em Reais (R$)</th>
                <th className="py-3 px-4 text-right">% em relação ao GMV</th>
                <th className="py-3 px-4 text-right">% em relação à Receita Líquida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
              <tr className="bg-white">
                <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-700"></span> Venda Bruta de Produtos
                </td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{formatPrice(dreMetrics.totalProductsRevenue)}</td>
                <td className="py-3 px-4 text-right font-semibold text-gray-600">
                  {((dreMetrics.totalProductsRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-gray-400">-</td>
              </tr>
              <tr className="bg-indigo-50/30 text-indigo-950">
                <td className="py-3 px-4 font-bold flex items-center gap-2 pl-6">
                  <Truck size={14} className="text-indigo-600" />
                  <span>(+) Receita de Frete / Entregas</span>
                </td>
                <td className="py-3 px-4 text-right font-bold text-indigo-900">+{formatPrice(dreMetrics.totalShippingRevenue)}</td>
                <td className="py-3 px-4 text-right text-indigo-800">
                  {((dreMetrics.totalShippingRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-indigo-700">
                  {((dreMetrics.totalShippingRevenue / (dreMetrics.netRevenue || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="bg-gray-100/70 font-black text-gray-900 border-t border-b border-gray-300">
                <td className="py-3 px-4 font-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-900"></span> (=) FATURAMENTO BRUTO TOTAL (GMV)
                </td>
                <td className="py-3 px-4 text-right font-black text-gray-900">{formatPrice(dreMetrics.grossRevenueGMV)}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-700">100,0%</td>
                <td className="py-3 px-4 text-right text-gray-400">-</td>
              </tr>
              <tr className="bg-amber-50/20 text-amber-900">
                <td className="py-3 px-4 font-bold flex items-center gap-2 pl-6">
                  <span className="text-amber-600">(-)</span> Descontos e Cupons Concedidos
                </td>
                <td className="py-3 px-4 text-right font-bold text-amber-900">-{formatPrice(dreMetrics.totalDiscounts)}</td>
                <td className="py-3 px-4 text-right text-amber-800">
                  {((dreMetrics.totalDiscounts / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right text-amber-800">
                  {((dreMetrics.totalDiscounts / (dreMetrics.netRevenue || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              {dreMetrics.totalCanceledValue > 0 && (
                <tr className="bg-rose-50/20 text-rose-900">
                  <td className="py-3 px-4 font-bold flex items-center gap-2 pl-6">
                    <span className="text-rose-600">(-)</span> Pedidos Cancelados / Reembolsados ({dreMetrics.canceledCount})
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-rose-900">-{formatPrice(dreMetrics.totalCanceledValue)}</td>
                  <td className="py-3 px-4 text-right text-rose-800">
                    {((dreMetrics.totalCanceledValue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right text-rose-800">-</td>
                </tr>
              )}
              <tr className="bg-blue-50/40 text-blue-950 font-black text-sm border-t-2 border-b-2 border-blue-200">
                <td className="py-3 px-4 font-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> (=) RECEITA LÍQUIDA REAL
                </td>
                <td className="py-3 px-4 text-right font-black">{formatPrice(dreMetrics.netRevenue)}</td>
                <td className="py-3 px-4 text-right font-bold text-blue-900">
                  {((dreMetrics.netRevenue / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-black text-blue-900">100,0%</td>
              </tr>
              <tr className="bg-rose-50/20 text-rose-900">
                <td className="py-3 px-4 font-bold flex items-center gap-2 pl-6">
                  <span className="text-rose-600">(-)</span> Custo das Mercadorias Vendidas (CMV)
                </td>
                <td className="py-3 px-4 text-right font-bold text-rose-900">-{formatPrice(dreMetrics.cmvTotal)}</td>
                <td className="py-3 px-4 text-right text-rose-800">
                  {((dreMetrics.cmvTotal / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-bold text-rose-800">
                  {((dreMetrics.cmvTotal / (dreMetrics.netRevenue || 1)) * 100).toFixed(1)}%
                </td>
              </tr>
              <tr className="bg-emerald-100/50 text-emerald-950 font-black text-sm">
                <td className="py-3 px-4 font-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> (=) LUCRO BRUTO ESTIMADO
                </td>
                <td className="py-3 px-4 text-right font-black text-emerald-900">{formatPrice(dreMetrics.grossProfit)}</td>
                <td className="py-3 px-4 text-right font-bold text-emerald-800">
                  {((dreMetrics.grossProfit / (dreMetrics.grossRevenueGMV || 1)) * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-black text-emerald-900">
                  {dreMetrics.grossMarginPercent.toFixed(1)}% Margem Bruta
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RELATÓRIOS E VISÕES ESTRATÉGICAS SECTION TABS */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4 print:hidden">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary)]">Análises Detalhadas</span>
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">2. Relatórios e Visões Estratégicas</h3>
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dre')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'dre' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Desempenho & Meios de Pagamento
            </button>
            <button
              onClick={() => setActiveTab('abc')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'abc' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Curva ABC de Produtos ({abcProducts.length})
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                activeTab === 'coupons' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Cupons e Descontos ({couponsReport.length})
            </button>
          </div>
        </div>

        {/* TAB 1: DESEMPENHO DE VENDAS & MEIOS DE PAGAMENTO */}
        {(activeTab === 'dre' || true) && (
          <div className={`space-y-6 ${activeTab !== 'dre' ? 'print:block hidden' : ''}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Evolution Chart (Bruto vs Liquido) */}
              <div className="lg:col-span-8 bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Evolução de Vendas (Bruto vs. Líquido)</h4>
                    <p className="text-xs text-gray-500">Comparativo entre faturamento bruto e dinheiro real faturado após descontos</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-gray-400 uppercase">Ticket Médio Líquido</span>
                    <p className="text-base font-black text-gray-900">{formatPrice(dreMetrics.averageTicket)}</p>
                  </div>
                </div>

                <div className="h-[280px] w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBruto" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#9ca3af" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorLiquido" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.35}/>
                          <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                      <XAxis dataKey="label" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v}`} />
                      <Tooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 min-w-[180px]">
                                <p className="font-bold text-gray-900 border-b pb-1">{data.fullDate || data.label}</p>
                                <p className="text-gray-600 flex justify-between">
                                  <span>Bruto:</span> <strong className="text-gray-900">{formatPrice(data.bruto)}</strong>
                                </p>
                                <p className="text-[var(--color-primary)] font-bold flex justify-between">
                                  <span>Receita Líquida:</span> <strong>{formatPrice(data.liquido)}</strong>
                                </p>
                                <p className="text-gray-400 text-[10px] flex justify-between">
                                  <span>Pedidos:</span> <strong>{data.pedidos}</strong>
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area type="monotone" dataKey="bruto" name="Fat. Bruto" stroke="#9ca3af" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#colorBruto)" />
                      <Area type="monotone" dataKey="liquido" name="Receita Líquida" stroke="var(--color-primary)" strokeWidth={2.5} fill="url(#colorLiquido)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Payment Methods Breakdown */}
              <div className="lg:col-span-4 bg-gray-50 border border-gray-200 p-5 rounded-xl space-y-4 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Faturado por Meio de Pagamento</h4>
                  <p className="text-xs text-gray-500">Distribuição financeira por PIX, Cartão, Boleto, etc.</p>
                </div>

                {paymentBreakdown.length === 0 ? (
                  <div className="py-12 text-center text-xs text-gray-400 font-medium">Nenhuma venda registrada no período</div>
                ) : (
                  <div className="space-y-3">
                    <div className="h-[140px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentBreakdown}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={60}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {paymentBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 border-t border-gray-200 pt-3">
                      {paymentBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                          <span className="flex items-center gap-2 text-gray-700">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                            {item.name} <span className="text-[10px] text-gray-400 font-normal">({item.count} {item.count === 1 ? 'venda' : 'vendas'})</span>
                          </span>
                          <span className="text-gray-900 font-bold">
                            {formatPrice(item.value)} <span className="text-[10px] text-gray-500 font-medium">({item.percent.toFixed(1)}%)</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: CURVA ABC DE PRODUTOS & ANÁLISE DE MARGEM */}
        {(activeTab === 'abc' || true) && (
          <div className={`space-y-4 ${activeTab !== 'abc' ? 'print:block hidden' : ''}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 border border-gray-200 p-4 rounded-xl">
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-[var(--color-primary)]" /> Análise de Produtos — Curva ABC, Custos & Margens
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  <strong>Classe A:</strong> 80% do faturamento | <strong>Classe B:</strong> 15% | <strong>Classe C:</strong> 5%
                </p>
              </div>

              {/* Filters & Sorting Controls */}
              <div className="flex flex-wrap items-center gap-3 text-xs w-full md:w-auto">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase text-gray-400">Filtrar por Custo & Margem</label>
                  <select
                    value={productCostFilter}
                    onChange={(e) => setProductCostFilter(e.target.value as any)}
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="all">Todos os Produtos ({abcProducts.length})</option>
                    <option value="has_cost">Apenas Custo Real Cadastrado</option>
                    <option value="missing_cost">Sem Custo Cadastrado (Estimado 35%)</option>
                    <option value="high_margin">Alta Margem (≥ 50%)</option>
                    <option value="mid_margin">Margem Média (20% a 49%)</option>
                    <option value="low_margin">Margem Baixa (&lt; 20%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold uppercase text-gray-400">Ordenar por</label>
                  <select
                    value={productSortBy}
                    onChange={(e) => setProductSortBy(e.target.value as any)}
                    className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 font-bold text-gray-800 outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="revenue">Maior Faturamento (R$)</option>
                    <option value="profit">Maior Lucro Bruto (R$)</option>
                    <option value="margin">Maior Margem de Lucro (%)</option>
                    <option value="markup">Maior Markup (%)</option>
                    <option value="quantity">Maior Volume (Qtd)</option>
                    <option value="cost">Maior CMV Total (R$)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-3 text-right">Preço Venda</th>
                    <th className="py-3 px-3 text-right">Custo Unitário</th>
                    <th className="py-3 px-3 text-center">Volume (Qtd)</th>
                    <th className="py-3 px-3 text-right">Faturamento Total</th>
                    <th className="py-3 px-3 text-right">CMV Total (Custo)</th>
                    <th className="py-3 px-3 text-right">Lucro Bruto</th>
                    <th className="py-3 px-3 text-right">Margem % / Markup</th>
                    <th className="py-3 px-4 text-center">Classe ABC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {processedAbcProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-gray-400">
                        Nenhum produto atende aos filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    processedAbcProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-gray-900">
                          <p>{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-normal">{p.sharePct.toFixed(1)}% do faturamento da loja</p>
                        </td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-800">{formatPrice(p.unitPrice)}</td>
                        <td className="py-3 px-3 text-right font-medium">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.isRealCost ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
                            }`}>
                              {formatPrice(p.unitCost)}
                              <span className="text-[8px] opacity-75">({p.isRealCost ? 'Real' : 'Est. 35%'})</span>
                            </span>
                            <button
                              onClick={() => {
                                setEditingCostModal({
                                  productName: p.name,
                                  unitPrice: p.unitPrice,
                                  currentCost: p.isRealCost ? p.unitCost : undefined
                                });
                                setCostInputValue(p.isRealCost ? p.unitCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
                              }}
                              className="p-1 hover:bg-gray-200 text-gray-400 hover:text-[var(--color-primary)] rounded transition-colors"
                              title="Cadastrar / Editar preço de custo deste produto"
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-700 bg-gray-50/50">{p.quantity} un</td>
                        <td className="py-3 px-3 text-right font-bold text-gray-900">{formatPrice(p.revenue)}</td>
                        <td className="py-3 px-3 text-right text-rose-700 font-medium">{formatPrice(p.cost)}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700 bg-emerald-50/30">
                          {formatPrice(p.profit)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <p className={`font-bold ${p.marginPct >= 50 ? 'text-emerald-700' : p.marginPct >= 20 ? 'text-amber-700' : 'text-rose-700'}`}>
                            {p.marginPct.toFixed(1)}% Margem
                          </p>
                          <p className="text-[10px] text-gray-400">+{p.markupPct.toFixed(0)}% Markup</p>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            p.categoryABC === 'A' 
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                              : p.categoryABC === 'B' 
                                ? 'bg-amber-100 text-amber-800 border-amber-300' 
                                : 'bg-gray-100 text-gray-700 border-gray-300'
                          }`}>
                            Classe {p.categoryABC}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {processedAbcProducts.length > 0 && (
                  <tfoot className="bg-gray-100 border-t-2 border-gray-200 text-xs font-black text-gray-900">
                    <tr>
                      <td className="py-3 px-4">TOTAL DOS PRODUTOS LISTADOS ({processedAbcProducts.length})</td>
                      <td className="py-3 px-3 text-right text-gray-400">-</td>
                      <td className="py-3 px-3 text-right text-gray-400">-</td>
                      <td className="py-3 px-3 text-center bg-gray-200/50">
                        {processedAbcProducts.reduce((acc, item) => acc + item.quantity, 0)} un
                      </td>
                      <td className="py-3 px-3 text-right">{formatPrice(processedAbcProducts.reduce((acc, item) => acc + item.revenue, 0))}</td>
                      <td className="py-3 px-3 text-right text-rose-800">{formatPrice(processedAbcProducts.reduce((acc, item) => acc + item.cost, 0))}</td>
                      <td className="py-3 px-3 text-right text-emerald-900">{formatPrice(processedAbcProducts.reduce((acc, item) => acc + item.profit, 0))}</td>
                      <td className="py-3 px-3 text-right text-emerald-900">
                        {(() => {
                          const totRev = processedAbcProducts.reduce((acc, item) => acc + item.revenue, 0);
                          const totProfit = processedAbcProducts.reduce((acc, item) => acc + item.profit, 0);
                          return totRev > 0 ? `${((totProfit / totRev) * 100).toFixed(1)}% M. Méd` : '-';
                        })()}
                      </td>
                      <td className="py-3 px-4"></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RELATÓRIO DE DESCONTO E CUPONS */}
        {(activeTab === 'coupons' || true) && (
          <div className={`space-y-4 ${activeTab !== 'coupons' ? 'print:block hidden' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Desconto e Cupons Promocionais</h4>
                <p className="text-xs text-gray-500">Acompanhamento do retorno e investimento de campanhas de marketing em cupons</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold text-gray-400 uppercase">Total de Descontos Concedidos</span>
                <p className="text-lg font-black text-amber-900">{formatPrice(dreMetrics.totalDiscounts)}</p>
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 border-b border-gray-200 font-black text-gray-500 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Código do Cupom / Promoção</th>
                    <th className="py-3 px-4 text-center">Qtd de Pedidos</th>
                    <th className="py-3 px-4 text-right">Total Descontado (R$)</th>
                    <th className="py-3 px-4 text-right">Faturamento Gerado</th>
                    <th className="py-3 px-4 text-right">Ticket Médio com Cupom</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                  {couponsReport.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">Nenhum cupom de desconto utilizado no período.</td>
                    </tr>
                  ) : (
                    couponsReport.map((c, idx) => {
                      const avgTicket = c.count > 0 ? c.totalRevenue / c.count : 0;
                      return (
                        <tr key={idx} className="hover:bg-amber-50/20 transition-colors">
                          <td className="py-3 px-4 font-black text-gray-900 flex items-center gap-2">
                            <Ticket size={14} className="text-amber-600" />
                            {c.code}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-gray-700">{c.count}</td>
                          <td className="py-3 px-4 text-right font-black text-amber-800">-{formatPrice(c.totalDiscount)}</td>
                          <td className="py-3 px-4 text-right font-bold text-gray-900">{formatPrice(c.totalRevenue)}</td>
                          <td className="py-3 px-4 text-right font-semibold text-gray-700">{formatPrice(avgTicket)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Edit Cost Modal */}
        {editingCostModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-gray-200 relative animate-in zoom-in-95 duration-150">
              <button 
                onClick={() => setEditingCostModal(null)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
              
              <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
                <Edit2 size={16} className="text-[var(--color-primary)]" />
                Editar Preço de Custo
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-semibold">{editingCostModal.productName}</p>

              <div className="space-y-3 bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Preço de Venda:</span>
                  <span className="font-bold text-gray-900">{formatPrice(editingCostModal.unitPrice)}</span>
                </div>
              </div>

              <div className="space-y-1.5 mb-5">
                <label className="text-xs font-bold text-gray-700 uppercase block">Preço de Custo Unitário (R$)</label>
                <input
                  type="text"
                  value={costInputValue}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setCostInputValue(val ? (parseInt(val, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
                  }}
                  placeholder="0,00"
                  autoFocus
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm font-bold text-gray-900 focus:border-[var(--color-primary)] outline-none"
                />
                <p className="text-[10px] text-gray-500">
                  Ao salvar, este valor será utilizado para o cálculo de CMV, Lucro Bruto e Margem do relatório.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditingCostModal(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProductCost}
                  className="flex-1 bg-[var(--color-primary)] text-white py-2.5 rounded-xl font-bold text-xs hover:brightness-110 transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Salvar Custo
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
