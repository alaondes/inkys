const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const statsOld = `          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => stat.path && navigate(stat.path)}
                  className={\`bg-white border border-gray-200 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden group shadow-sm \${stat.path ? 'cursor-pointer hover:border-[var(--color-primary)] transition-all' : ''}\`}
                >
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity" />
                  
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-xs">
                        <Icon className="text-[var(--color-primary)]" size={20} />
                      </div>

                      {stat.change !== undefined ? (
                        <span className={\`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border \${
                          stat.changeType === 'positive' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }\`}>
                          {stat.changeType === 'positive' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {stat.change}
                        </span>
                      ) : (
                        <span className={\`text-xs font-bold px-2.5 py-1 rounded-full border \${
                          stat.badgeType === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          stat.badgeType === 'danger' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                          stat.badgeType === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          stat.badgeType === 'info' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }\`}>
                          {stat.badgeText}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">{stat.value}</h3>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.title}</p>
                  </div>
                </div>
              );
            })}
          </div>`;

const statsNew = `          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  onClick={() => stat.path && navigate(stat.path)}
                  className={\`bg-white p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group shadow-sm \${stat.path ? 'cursor-pointer hover:shadow-md transition-all' : ''}\`}
                >
                  <div className="w-14 h-14 shrink-0 rounded-full bg-[#F3F4F9] flex items-center justify-center">
                    <Icon className="text-[#3b3373]" size={24} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-1">{stat.value}</h3>
                    <p className="text-[13px] font-medium text-slate-500">{stat.title}</p>
                  </div>
                </div>
              );
            })}
          </div>`;

code = code.replace(statsOld, statsNew);

fs.writeFileSync('src/admin/views/Overview.tsx', code);
