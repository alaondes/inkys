const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const chartOld = `          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900">Desempenho de Vendas</h3>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Evolução do faturamento</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="text-xs font-bold bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-hidden focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-all"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                  </select>
                </div>
              </div>`;

const chartNew = `          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 lg:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-[20px] font-bold text-slate-800">Desempenho de Vendas</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Evolução do faturamento</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="text-sm font-medium bg-[#F8F9FB] border border-slate-200 text-slate-700 py-2 px-4 rounded-lg focus:outline-hidden focus:border-[#3b3373] focus:ring-1 focus:ring-[#3b3373] transition-all"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                  </select>
                </div>
              </div>`;

code = code.replace(chartOld, chartNew);

fs.writeFileSync('src/admin/views/Overview.tsx', code);
