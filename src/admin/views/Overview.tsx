import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';

const salesData = [
  { name: 'Seg', total: 400 },
  { name: 'Ter', total: 300 },
  { name: 'Qua', total: 550 },
  { name: 'Qui', total: 450 },
  { name: 'Sex', total: 700 },
  { name: 'Sab', total: 850 },
  { name: 'Dom', total: 600 },
];

export function Overview() {
  const stats = [
    { label: 'Vendas Totais', value: 'R$ 8.459,00', icon: DollarSign, change: '+12%' },
    { label: 'Pedidos Ativos', value: '34', icon: ShoppingCart, change: '+5%' },
    { label: 'Produtos', value: '112', icon: Package, change: '0%' },
    { label: 'Conversão', value: '3.4%', icon: TrendingUp, change: '+1.2%' },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          const isPositive = stat.change.startsWith('+');
          return (
            <div key={i} className="bg-white border border-gray-200 p-6 rounded-2xl flex flex-col relative overflow-hidden group shadow-sm">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />
              
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Icon className="text-[var(--color-primary)]" size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
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
              />
              <Area type="monotone" dataKey="total" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
