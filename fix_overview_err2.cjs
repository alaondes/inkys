const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const startIdx = code.indexOf('{/* Quick DRE Banner */}');
const endIdx = code.indexOf('{/* Stats Grid */}');

if (startIdx !== -1 && endIdx !== -1) {
    const replacement = `{/* Quick DRE Banner */}
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

          `;
    
    code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
    fs.writeFileSync('src/admin/views/Overview.tsx', code);
    console.log("Fixed banner section");
}
