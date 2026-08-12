const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const titleOld = `        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Visão Geral</h2>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">Resumo e performance da sua gráfica</p>
          </div>
        </div>`;

const titleNew = `        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800">CRM Dashboard</h2>
            <p className="text-[13px] text-slate-500 font-medium">Let's get started</p>
          </div>
        </div>`;

code = code.replace(titleOld, titleNew);

fs.writeFileSync('src/admin/views/Overview.tsx', code);
