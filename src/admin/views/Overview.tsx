import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  DollarSign, Package, ShoppingCart, TrendingUp, TrendingDown, 
  Calendar, Download, CheckCircle2, AlertTriangle, ShoppingBag, 
  Sparkles, ArrowUpRight, ArrowDownRight, FileSpreadsheet,
  LayoutDashboard, BarChart3, PieChart
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice } from '../../data/products';
import { useNavigate } from 'react-router-dom';
import { FinancialReports, RawOrder } from '../components/FinancialReports';

type TimeRange = '7d' | '30d' | 'month' | 'year';

interface ChartItem {
  name: string;
  fullDate: string;
  total: number;
  count: number;
  totalAnterior?: number;
  countAnterior?: number;
}

export function Overview() {
  const [mainTab, setMainTab] = useState<'dashboard' | 'reports'>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [comparePrevious, setComparePrevious] = useState<boolean>(true);
  
  const [rawOrders, setRawOrders] = useState<RawOrder[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  
  const navigate = useNavigate();

  // Listen to Firestore Products & Orders
  useEffect(() => {
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
      setProductCount(snap.docs.length);
      let outOfStock = 0;
      let lowStock = 0;
      snap.docs.forEach(doc => {
        const p = doc.data();
        if (p.stock !== undefined) {
          if (p.stock <= 0) outOfStock++;
          else if (p.stock <= 3) lowStock++;
        }
      });
      setOutOfStockCount(outOfStock);
      setLowStockCount(lowStock);
    }, () => {});

    const ordersUnsubscribe = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersList: RawOrder[] = snap.docs.map(doc => {
        const data = doc.data();
        let dateObj: Date | null = null;
        
        if (data.date?.toDate) {
          dateObj = data.date.toDate();
        } else if (data.createdAt?.toDate) {
          dateObj = data.createdAt.toDate();
        } else if (data.date) {
          dateObj = new Date(data.date);
        } else if (data.createdAt) {
          dateObj = new Date(data.createdAt);
        }

        return {
          id: doc.id,
          total: Number(data.total) || 0,
          subtotal: Number(data.subtotal) || 0,
          discount: Number(data.discount) || 0,
          shippingCost: Number(data.shippingCost) || 0,
          status: data.status || 'Pendente',
          paymentMethod: data.paymentMethod || '',
          couponCode: data.couponCode || '',
          customer: data.customer || 'Cliente',
          date: dateObj && !isNaN(dateObj.getTime()) ? dateObj : null,
          items: data.items || []
        };
      });

      setRawOrders(ordersList);
    }, () => {});

    return () => {
      productsUnsubscribe();
      ordersUnsubscribe();
    };
  }, []);

  // Helper to check if an order is paid
  const isPaidOrder = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    return s === 'pago' || s === 'concluído' || s === 'concluido' || s === 'entregue' || s === 'enviado' || s === 'faturado' || s === 'aprovado' || s === 'paga' || s === 'finalizado';
  };

  // Calculate filtered stats & chart data based on selected timeRange
  const { 
    chartData, 
    currentRevenue, 
    previousRevenue, 
    revenueDiffPercent, 
    currentOrderCount, 
    activeOrdersCount,
    averageTicket,
    peakDay 
  } = useMemo(() => {
    const now = new Date();
    // Normalize today to start/end of day
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let daysCount = 7;
    if (timeRange === '30d') daysCount = 30;
    else if (timeRange === 'month') daysCount = today.getDate(); // Days elapsed in current month
    else if (timeRange === 'year') daysCount = 12; // Months

    const currentDataMap: ChartItem[] = [];

    if (timeRange === 'year') {
      // Monthly view for current year
      const currentYear = now.getFullYear();
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      
      for (let m = 0; m < 12; m++) {
        currentDataMap.push({
          name: monthNames[m],
          fullDate: `${monthNames[m]} de ${currentYear}`,
          total: 0,
          count: 0,
          totalAnterior: 0,
          countAnterior: 0
        });
      }

      let curRev = 0;
      let prevRev = 0;
      let curCount = 0;

      rawOrders.forEach(order => {
        if (!order.date || !isPaidOrder(order.status)) return;
        const year = order.date.getFullYear();
        const month = order.date.getMonth();

        if (year === currentYear) {
          currentDataMap[month].total += order.total;
          currentDataMap[month].count += 1;
          curRev += order.total;
          curCount += 1;
        } else if (year === currentYear - 1) {
          currentDataMap[month].totalAnterior = (currentDataMap[month].totalAnterior || 0) + order.total;
          currentDataMap[month].countAnterior = (currentDataMap[month].countAnterior || 0) + 1;
          prevRev += order.total;
        }
      });

      let diffPct = 0;
      if (prevRev > 0) {
        diffPct = ((curRev - prevRev) / prevRev) * 100;
      } else if (curRev > 0) {
        diffPct = 100;
      }

      const activeCount = rawOrders.filter(o => o.status === 'Pendente').length;
      const avgTicket = curCount > 0 ? curRev / curCount : 0;
      
      let peak: ChartItem | null = null;
      currentDataMap.forEach(item => {
        if (!peak || item.total > peak.total) {
          peak = item;
        }
      });

      return {
        chartData: currentDataMap,
        currentRevenue: curRev,
        previousRevenue: prevRev,
        revenueDiffPercent: diffPct,
        currentOrderCount: curCount,
        activeOrdersCount: activeCount,
        averageTicket: avgTicket,
        peakDay: peak && peak.total > 0 ? peak : null
      };

    } else {
      // Daily view (7d, 30d, month)
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);

        const dayName = timeRange === '7d' 
          ? d.toLocaleDateString('pt-BR', { weekday: 'short' })
          : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

        const fullDate = d.toLocaleDateString('pt-BR', { 
          weekday: 'long', day: '2-digit', month: 'long' 
        });

        currentDataMap.push({
          name: dayName,
          fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
          total: 0,
          count: 0,
          totalAnterior: 0,
          countAnterior: 0
        });
      }

      // Start of current period
      const currentStart = new Date(today);
      currentStart.setDate(currentStart.getDate() - (daysCount - 1));
      currentStart.setHours(0,0,0,0);

      // Start of previous period
      const previousStart = new Date(currentStart);
      previousStart.setDate(previousStart.getDate() - daysCount);

      const previousEnd = new Date(currentStart);
      previousEnd.setMilliseconds(-1);

      let curRev = 0;
      let prevRev = 0;
      let curCount = 0;

      rawOrders.forEach(order => {
        if (!order.date || !isPaidOrder(order.status)) return;
        const orderTime = order.date.getTime();

        // Check if in current period
        if (orderTime >= currentStart.getTime()) {
          const diffDays = Math.floor((orderTime - currentStart.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < daysCount) {
            currentDataMap[diffDays].total += order.total;
            currentDataMap[diffDays].count += 1;
            curRev += order.total;
            curCount += 1;
          }
        } 
        // Check if in previous period
        else if (orderTime >= previousStart.getTime() && orderTime <= previousEnd.getTime()) {
          const diffDays = Math.floor((orderTime - previousStart.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays < daysCount) {
            currentDataMap[diffDays].totalAnterior = (currentDataMap[diffDays].totalAnterior || 0) + order.total;
            currentDataMap[diffDays].countAnterior = (currentDataMap[diffDays].countAnterior || 0) + 1;
            prevRev += order.total;
          }
        }
      });

      let diffPct = 0;
      if (prevRev > 0) {
        diffPct = ((curRev - prevRev) / prevRev) * 100;
      } else if (curRev > 0) {
        diffPct = 100;
      }

      const activeCount = rawOrders.filter(o => o.status === 'Pendente').length;
      const avgTicket = curCount > 0 ? curRev / curCount : 0;

      let peak: ChartItem | null = null;
      currentDataMap.forEach(item => {
        if (!peak || item.total > peak.total) {
          peak = item;
        }
      });

      return {
        chartData: currentDataMap,
        currentRevenue: curRev,
        previousRevenue: prevRev,
        revenueDiffPercent: diffPct,
        currentOrderCount: curCount,
        activeOrdersCount: activeCount,
        averageTicket: avgTicket,
        peakDay: peak && peak.total > 0 ? peak : null
      };
    }
  }, [rawOrders, timeRange]);

  // Export CSV Report Function
  const exportSalesReport = () => {
    let csvContent = '\uFEFF'; // UTF-8 BOM
    csvContent += 'Periodo/Data,Faturamento (R$),Qtd. Pedidos,Faturamento Período Anterior (R$)\n';

    chartData.forEach(item => {
      csvContent += `"${item.fullDate || item.name}",${item.total.toFixed(2)},${item.count},${(item.totalAnterior || 0).toFixed(2)}\n`;
    });

    csvContent += `"\nTOTAL DO PERÍODO",${currentRevenue.toFixed(2)},${currentOrderCount},${previousRevenue.toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `relatorio_vendas_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartItem;
      const isPeak = peakDay && data.name === peakDay.name && data.total > 0;

      return (
        <div className="bg-white border border-gray-200 p-3.5 rounded-xl shadow-xl min-w-[210px] text-xs space-y-2 z-50">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2 gap-2">
            <span className="font-bold text-gray-900">{data.fullDate || label}</span>
            {isPeak && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200 shrink-0">
                <Sparkles size={11} className="text-amber-600" /> Pico de Venda
              </span>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-gray-700">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] inline-block"></span>
                Faturamento:
              </span>
              <strong className="text-gray-900 font-bold">{formatPrice(data.total)}</strong>
            </div>

            <div className="flex justify-between items-center text-gray-500">
              <span>Qtd. Pedidos:</span>
              <strong className="text-gray-800 font-semibold">{data.count} {data.count === 1 ? 'pedido' : 'pedidos'}</strong>
            </div>

            {comparePrevious && data.totalAnterior !== undefined && (
              <div className="pt-2 border-t border-gray-100 flex justify-between items-center text-gray-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block"></span>
                  Período Ant.:
                </span>
                <strong className="text-gray-600 font-semibold">{formatPrice(data.totalAnterior)}</strong>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const stats = [
    { 
      label: 'Faturamento Total', 
      value: formatPrice(currentRevenue), 
      icon: DollarSign, 
      change: `${revenueDiffPercent >= 0 ? '+' : ''}${revenueDiffPercent.toFixed(1)}%`,
      changeType: revenueDiffPercent >= 0 ? 'positive' : 'negative',
      subtext: 'vs período anterior',
      path: '/admin/orders' 
    },
    { 
      label: 'Pedidos Pendentes', 
      value: activeOrdersCount.toString(), 
      icon: ShoppingCart, 
      badgeText: activeOrdersCount === 0 ? 'Tudo em dia!' : `${activeOrdersCount} a enviar`,
      badgeType: activeOrdersCount === 0 ? 'success' : 'warning',
      subtext: activeOrdersCount === 0 ? 'Nenhum pedido pendente' : 'Aguardando envio',
      path: '/admin/orders' 
    },
    { 
      label: 'Produtos', 
      value: productCount.toString(), 
      icon: Package, 
      badgeText: outOfStockCount > 0 
        ? `${outOfStockCount} esgotados` 
        : lowStockCount > 0 
          ? `${lowStockCount} baixo estoque` 
          : 'Estoque OK',
      badgeType: outOfStockCount > 0 ? 'danger' : lowStockCount > 0 ? 'warning' : 'neutral',
      subtext: 'Cadastrados no catálogo',
      path: '/admin/products' 
    },
    { 
      label: 'Ticket Médio', 
      value: formatPrice(averageTicket), 
      icon: ShoppingBag, 
      badgeText: 'Média / Pedido',
      badgeType: 'info',
      subtext: `${currentOrderCount} ${currentOrderCount === 1 ? 'pedido realizado' : 'pedidos realizados'}`,
      path: '/admin/orders' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Main Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6 print:hidden">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-800">CRM Dashboard</h1>
            <p className="text-[14px] text-slate-500 font-medium">Let's get started</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F3F4F9] p-1 rounded-xl">
          <button
            onClick={() => setMainTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
              mainTab === 'dashboard'
                ? 'bg-white text-[#3b3373] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setMainTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all ${
              mainTab === 'reports'
                ? 'bg-white text-[#3b3373] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Reports
          </button>
        </div>
      </div>

      {mainTab === 'reports' ? (
        <FinancialReports orders={rawOrders} />
      ) : (
        <>
          {/* Quick DRE Banner */}
          <div className="bg-white p-6 rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#EAE8F1] flex items-center justify-center shrink-0">
                <BarChart3 className="text-[#3b3373]" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-[15px] text-slate-800">DRE Simplificada & Relatórios</h3>
                <p className="text-slate-500 text-[13px] font-medium mt-0.5">
                  Consulte a separação do Faturamento Bruto (GMV), Receita Líquida, CMV e exporte.
                </p>
              </div>
            </div>
            <button
              onClick={() => setMainTab('reports')}
              className="bg-[#3b3373] hover:bg-[#2e2759] text-white text-[13px] font-medium px-5 py-2.5 rounded-lg transition-all shadow-sm shrink-0 flex items-center gap-2"
            >
              Acessar Relatórios <ArrowUpRight size={16} />
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => stat.path && navigate(stat.path)}
                  className={`bg-white p-6 rounded-xl flex items-center gap-4 relative overflow-hidden group shadow-sm ${stat.path ? 'cursor-pointer hover:shadow-md transition-all' : ''}`}
                >
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#EAE8F1] flex items-center justify-center">
                    <Icon className="text-[#3b3373]" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[26px] font-bold text-slate-800 tracking-tight leading-none mb-2">{stat.value}</h3>
                    <p className="text-[14px] font-medium text-slate-500">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 lg:p-8 space-y-6 border border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-[20px] font-bold text-slate-800 tracking-tight">Histórico de Vendas</h3>
                  {peakDay && (
                    <span className="bg-amber-50 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 mt-1">
                      <Sparkles size={12} className="text-amber-600" />
                      Pico: {peakDay.name} ({formatPrice(peakDay.total)})
                    </span>
                  )}
                </div>
                <p className="text-[13px] font-medium text-slate-500 mt-1">Evolução do faturamento</p>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  className="text-[13px] font-medium bg-[#F8F9FB] border border-slate-200 text-slate-700 py-1.5 px-3 rounded-lg focus:outline-hidden focus:border-[#3b3373] focus:ring-1 focus:ring-[#3b3373] transition-all cursor-pointer"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                >
                  <option value="7d">Últimos 7 dias</option>
                  <option value="30d">Últimos 30 dias</option>
                  <option value="month">Este Mês</option>
                  <option value="year">Este Ano</option>
                </select>
                <button
                  onClick={exportSalesReport}
                  className="flex items-center gap-1.5 bg-[#F8F9FB] border border-slate-200 text-slate-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                  title="Exportar dados do gráfico em CSV"
                >
                  <FileSpreadsheet size={14} />
                  Exportar
                </button>
              </div>
            </div>
            
            <div className="h-[320px] w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b3373" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3b3373" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={8}
                  />
                  <YAxis 
                    stroke="#9ca3af" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `R$ ${Math.round(value).toLocaleString('pt-BR')}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  
                  {comparePrevious && (
                    <Area 
                      type="monotone" 
                      dataKey="totalAnterior" 
                      name="Período Anterior" 
                      stroke="#9ca3af" 
                      strokeWidth={2} 
                      strokeDasharray="4 4"
                      fill="none" 
                      dot={{ r: 3, fill: '#9ca3af', strokeWidth: 1, stroke: '#fff' }}
                    />
                  )}

                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    name="Faturamento" 
                    stroke="#3b3373" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#colorSales)"
                    dot={{ r: 4, fill: 'var(--color-primary)', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: 'var(--color-primary)', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
