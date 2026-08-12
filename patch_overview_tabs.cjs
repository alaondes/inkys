const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const tabsRegex = /<button\s+onClick=\{\(\) => setMainTab\('dashboard'\)\}\s+className=\{\`flex items-center gap-2 px-5 py-2\.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all \$\{\s+mainTab === 'dashboard'\s+\?\s+'bg-white text-\[#3b3373\] shadow-sm'\s+:\s+'text-gray-600 hover:text-gray-900'\s+\}\`\}\s+>\s+<LayoutDashboard size=\{16\} \/> Painel Principal\s+<\/button>\s+<button\s+onClick=\{\(\) => setMainTab\('reports'\)\}\s+className=\{\`flex items-center gap-2 px-5 py-2\.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all \$\{\s+mainTab === 'reports'\s+\?\s+'bg-white text-\[#3b3373\] shadow-sm'\s+:\s+'text-gray-600 hover:text-gray-900'\s+\}\`\}\s+>\s+<BarChart3 size=\{16\} \/> Relatórios DRE & Vendas\s+<\/button>/m;

const tabsNew = `<button
            onClick={() => setMainTab('dashboard')}
            className={\`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all \${
              mainTab === 'dashboard'
                ? 'bg-white text-[#3b3373] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }\`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setMainTab('reports')}
            className={\`flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-lg transition-all \${
              mainTab === 'reports'
                ? 'bg-white text-[#3b3373] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }\`}
          >
            Reports
          </button>`;

code = code.replace(tabsRegex, tabsNew);

fs.writeFileSync('src/admin/views/Overview.tsx', code);
