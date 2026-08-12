const fs = require('fs');
let code = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

// Update pillar styles
const oldPillar = `              <div 
                key={pillar.id}
                className={\`rounded-2xl border transition-all duration-200 overflow-hidden \${
                  isPillarActive 
                    ? 'border-slate-300 bg-slate-50/50 shadow-xs' 
                    : 'border-slate-200/60 bg-white'
                }\`}
              >
                {/* Pillar Header Switcher */}
                <button
                  onClick={() => setActivePillar(activePillar === pillar.id ? '' : pillar.id)}
                  className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={\`w-8 h-8 rounded-xl flex items-center justify-center \${pillar.color}\`}>
                      <PillarIcon size={16} />
                    </div>
                    <span className="font-extrabold text-xs uppercase tracking-tight text-slate-900">
                      {pillar.title}
                    </span>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={\`text-slate-400 transition-transform duration-200 \${
                      activePillar === pillar.id || isPillarActive ? 'rotate-180 text-blue-600' : ''
                    }\`} 
                  />
                </button>`;

const newPillar = `              <div 
                key={pillar.id}
                className="mb-2"
              >
                {/* Pillar Header Switcher */}
                <button
                  onClick={() => setActivePillar(activePillar === pillar.id ? '' : pillar.id)}
                  className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-medium text-[11px] uppercase tracking-wider text-slate-400">
                      {pillar.title}
                    </span>
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={\`text-slate-400 transition-transform duration-200 \${
                      activePillar === pillar.id || isPillarActive ? 'rotate-180 text-indigo-600' : ''
                    }\`} 
                  />
                </button>`;

code = code.replace(oldPillar, newPillar);

// Update link styles
const oldLink = `                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={\`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all \${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }\`}
                        >`;

const newLink = `                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={\`flex items-center justify-between px-4 py-2.5 rounded-r-full text-sm font-medium transition-all mr-2 \${
                            isActive
                              ? 'bg-[#EFEFF9] text-[#3b3373]'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }\`}
                        >`;

code = code.replace(oldLink, newLink);

fs.writeFileSync('src/admin/AdminApp.tsx', code);
