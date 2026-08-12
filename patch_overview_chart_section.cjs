const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const chartHeaderRegex = /\{\/\* Charts Section \*\/\}\s*<div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">[\s\S]*?<div className="h-\[320px\] w-full pt-2">/;

const chartHeaderNew = `{/* Charts Section */}
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
            
            <div className="h-[320px] w-full pt-2">`;

code = code.replace(chartHeaderRegex, chartHeaderNew);

// Also let's update the chart gradient color from --color-primary to #3b3373
code = code.replace(/stopColor="var\(--color-primary\)"/g, 'stopColor="#3b3373"');
code = code.replace(/stroke="var\(--color-primary\)"/g, 'stroke="#3b3373"');

fs.writeFileSync('src/admin/views/Overview.tsx', code);
