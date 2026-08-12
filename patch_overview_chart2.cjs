const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const startIdx = code.indexOf('{/* Charts Section */}');
const endIdx = code.indexOf('<div className="h-[350px] lg:h-[400px] w-full mt-6">');

if (startIdx !== -1 && endIdx !== -1) {
    const chartNew = `{/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-[20px] font-bold text-slate-800">Desempenho de Vendas</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Evolução do faturamento</p>
                </div>
                <div className="flex gap-2">
                  <select 
                    className="text-sm font-medium bg-[#F8F9FB] border border-slate-200 text-slate-700 py-2 px-4 rounded-lg focus:outline-hidden focus:border-[#3b3373] focus:ring-1 focus:ring-[#3b3373] transition-all cursor-pointer"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                  >
                    <option value="7d">Últimos 7 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                  </select>
                </div>
              </div>
              `;
    
    code = code.substring(0, startIdx) + chartNew + code.substring(endIdx);
    fs.writeFileSync('src/admin/views/Overview.tsx', code);
    console.log("Patched chart container");
} else {
    console.log("Could not find boundaries", startIdx, endIdx);
}
