const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Avulsos.tsx', 'utf-8');

const target = /<div className="overflow-x-auto">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<form/m;
const tableSection = content.match(/<div className="overflow-x-auto">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m)[0];

const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAvulsos.map((avulso) => {
            const hasCost = avulso.costPrice !== undefined && avulso.costPrice > 0;
            const profit = hasCost ? avulso.price - (avulso.costPrice || 0) : 0;
            const margin = hasCost && avulso.price > 0 ? (profit / avulso.price) * 100 : 0;
            
            return (
              <div key={avulso.id} className="bg-white border border-slate-200/80 rounded-3xl p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group">
                <div>
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/60 mb-3">
                    <img 
                      src={avulso.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop'} 
                      alt={avulso.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-sm line-clamp-2 leading-snug">{avulso.name}</h4>
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-base font-black text-slate-900">{formatPrice(avulso.price)}</span>
                      {hasCost ? (
                        <span className={\`text-[10px] font-black px-2 py-0.5 rounded-full \${profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}\`}>
                          +R$ {profit.toFixed(0)} ({margin.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium px-2 py-0.5 bg-gray-50 rounded-full">Sem custo</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-slate-100">
                  <button 
                    type="button"
                    onClick={() => handleOpenModal(avulso)} 
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit2 size={13} /> Editar
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleDelete(avulso.id)} 
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" 
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredAvulsos.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white border border-slate-200/80 rounded-3xl">
              Nenhum serviço ou personalizado encontrado.
            </div>
          )}
        </div>
      </div>
    </div>`;

content = content.replace(tableSection, newGrid);
fs.writeFileSync('src/admin/views/Avulsos.tsx', content);
