const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const startIdx = code.indexOf('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">');
const endIdx = code.indexOf('{/* Charts Section */}');

if (startIdx !== -1 && endIdx !== -1) {
    const statsNew = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => stat.path && navigate(stat.path)}
                  className={\`bg-white p-6 rounded-xl flex items-center gap-4 relative overflow-hidden group shadow-sm \${stat.path ? 'cursor-pointer hover:shadow-md transition-all' : ''}\`}
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

          `;
    
    code = code.substring(0, startIdx) + statsNew + code.substring(endIdx);
    fs.writeFileSync('src/admin/views/Overview.tsx', code);
    console.log("Patched stats array rendering");
} else {
    console.log("Could not find boundaries");
}
