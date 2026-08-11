const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Avulsos.tsx', 'utf-8');

// The file currently ends around line 198.
// We will replace everything from `      </div>\n    </div>\n        </div>\n      )}\n    </div>\n  );\n}`
// wait, we can just replace from `</div>\n      </div>\n    </div>` to the end.

const index = content.lastIndexOf('          {filteredAvulsos.length === 0 && (');
if (index === -1) {
  console.log("Not found");
  process.exit(1);
}

const endPart = `          {filteredAvulsos.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 text-sm bg-white border border-slate-200/80 rounded-3xl">
              Nenhum serviço ou personalizado encontrado.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 relative border border-gray-200 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0 pb-2 border-b border-gray-100">
              <h3 className="text-xl font-bold uppercase tracking-wider text-gray-900">{editingAvulso ? 'Editar Item' : 'Novo Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 text-gray-900">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Item</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: Arte Final, Camiseta, Caneca..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Venda (R$)</label>
                    <input required type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Custo (R$) <span className="text-gray-400 font-normal lowercase">- opcional</span></label>
                    <input type="number" step="0.01" min="0" value={formData.costPrice || ''} onChange={e => setFormData({...formData, costPrice: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">URL da Imagem <span className="text-gray-400 font-normal lowercase">- opcional</span></label>
                  <input type="url" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="https://..." />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold shadow-sm hover:brightness-110 transition-all flex items-center gap-2">
                  <CheckCircle size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.substring(0, index) + endPart;
fs.writeFileSync('src/admin/views/Avulsos.tsx', content);
