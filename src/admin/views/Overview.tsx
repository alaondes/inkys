import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice } from '../../data/products';

export function Overview() {
  const [salesData, setSalesData] = useState<{ name: string; total: number }[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    const productsUnsubscribe = onSnapshot(collection(db, 'products'), (snap) => {
      setProductCount(snap.docs.length);
    });

    const ordersUnsubscribe = onSnapshot(collection(db, 'orders'), (snap) => {
      let revenue = 0;
      let active = 0;
      const days: Record<string, number> = {};

      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days[d.toLocaleDateString('pt-BR', { weekday: 'short' })] = 0;
      }

      snap.docs.forEach(doc => {
        const order = doc.data();
        if (order.status !== 'Cancelado') {
          revenue += order.total || 0;
        }
        if (order.status === 'Pendente' || order.status === 'Pago') {
          active++;
        }

        // Add to chart if within last 7 days
        if (order.date && order.date.toDate) {
          const date = order.date.toDate();
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - date.getTime());
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays <= 7) {
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
            if (days[dayName] !== undefined && order.status !== 'Cancelado') {
              days[dayName] += order.total || 0;
            }
          }
        }
      });

      setTotalRevenue(revenue);
      setActiveOrders(active);
      
      const chartData = Object.entries(days).map(([name, total]) => ({ name, total }));
      setSalesData(chartData);
    });

    return () => {
      productsUnsubscribe();
      ordersUnsubscribe();
    };
  }, []);

  const stats = [
    { label: 'Faturamento Total', value: formatPrice(totalRevenue), icon: DollarSign, change: '100%' },
    { label: 'Pedidos Pendentes', value: activeOrders.toString(), icon: ShoppingCart, change: 'Pedidos não enviados' },
    { label: 'Produtos', value: productCount.toString(), icon: Package, change: 'Catálogo' },
    { label: 'Conversão', value: '---', icon: TrendingUp, change: 'BETA' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Icon className="text-[var(--color-primary)]" size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-500`}>
                  {stat.change}
                </span>
              </div>
              
              <h3 className="text-3xl font-bold text-gray-900 tracking-widest">{stat.value}</h3>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-medium mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider">Histórico de Vendas</h3>
          <p className="text-gray-500 text-sm">Resumo de desempenho dos últimos 7 dias</p>
        </div>
        
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(0,0,0,0.3)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="rgba(0,0,0,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '8px', color: '#111827' }}
                itemStyle={{ color: 'var(--color-primary)' }}
                formatter={(value: number) => formatPrice(value)}
              />
              <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
