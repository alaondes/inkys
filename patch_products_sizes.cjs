const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

code = code.replace(
  `  const handleRemoveColor = (index: number) => {
    const currentColors = [...(formData.colors || [])];
    currentColors.splice(index, 1);
    setFormData({ ...formData, colors: currentColors });
  };`,
  `  const handleRemoveColor = (index: number) => {
    const currentColors = [...(formData.colors || [])];
    currentColors.splice(index, 1);
    setFormData({ ...formData, colors: currentColors });
  };

  const handleAddSize = () => {
    const currentSizes = formData.sizes || [];
    setFormData({ ...formData, sizes: [...currentSizes, 'Novo Tamanho'] });
  };

  const handleUpdateSize = (index: number, value: string) => {
    const currentSizes = [...(formData.sizes || [])];
    currentSizes[index] = value;
    setFormData({ ...formData, sizes: currentSizes });
  };

  const handleRemoveSize = (index: number) => {
    const currentSizes = [...(formData.sizes || [])];
    currentSizes.splice(index, 1);
    setFormData({ ...formData, sizes: currentSizes });
  };`
);

const colorsUI = `                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddColor} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Cor
                      </button>
                    </div>
                    
                    {formData.colors && formData.colors.length > 0 && (
                      <div className="space-y-2">
                        {formData.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              title="Cor (Hexadecimal)"
                              type="color" 
                              value={color.hex.startsWith('linear-gradient') ? '#ffffff' : color.hex} 
                              onChange={e => handleUpdateColor(index, 'hex', e.target.value)}
                              disabled={color.hex.startsWith('linear')}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border-none appearance-none p-0 shrink-0" 
                            />
                            <input 
                              type="text" 
                              value={color.name} 
                              onChange={e => handleUpdateColor(index, 'name', e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" 
                              placeholder="Nome da Cor (ex: Vermelho)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>`;

const newUI = `                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Tamanhos <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddSize} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Tamanho
                      </button>
                    </div>
                    
                    {formData.sizes && formData.sizes.length > 0 && (
                      <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              type="text" 
                              value={size} 
                              onChange={e => handleUpdateSize(index, e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none uppercase font-bold" 
                              placeholder="Tamanho (ex: P, M, G, 42)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveSize(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddColor} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Cor
                      </button>
                    </div>
                    
                    {formData.colors && formData.colors.length > 0 && (
                      <div className="space-y-2">
                        {formData.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              title="Cor (Hexadecimal)"
                              type="color" 
                              value={color.hex.startsWith('linear-gradient') ? '#ffffff' : color.hex} 
                              onChange={e => handleUpdateColor(index, 'hex', e.target.value)}
                              disabled={color.hex.startsWith('linear')}
                              className="w-10 h-10 rounded cursor-pointer bg-transparent border-none appearance-none p-0 shrink-0" 
                            />
                            <input 
                              type="text" 
                              value={color.name} 
                              onChange={e => handleUpdateColor(index, 'name', e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none" 
                              placeholder="Nome da Cor (ex: Vermelho)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveColor(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>`;

// Safely do the replace since we might not match the entire HTML exactly if something changed, let's just do a string literal replace or regex:
if (code.includes('Adicionar Cor')) {
    // Find the exact index where 'col-span-2 space-y-3 pt-4 border-t border-gray-100' starts for Colors
    // and insert sizes right before it
    const colorBlockIndex = code.indexOf('<div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">\\n                    <div className="flex items-center justify-between">\\n                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores');
    
    // Instead of complex exact match, let's just use string replace on a known anchor
    code = code.replace(
      '<div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">\n                    <div className="flex items-center justify-between">\n                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores',
      `                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Tamanhos <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddSize} className="flex items-center gap-1 text-[10px] uppercase font-bold text-[var(--color-primary)] hover:brightness-110">
                        <PlusCircle size={14} /> Adicionar Tamanho
                      </button>
                    </div>
                    
                    {formData.sizes && formData.sizes.length > 0 && (
                      <div className="space-y-2">
                        {formData.sizes.map((size, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <input 
                              type="text" 
                              value={size} 
                              onChange={e => handleUpdateSize(index, e.target.value)}
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none uppercase font-bold" 
                              placeholder="Tamanho (ex: P, M, G, 42)"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveSize(index)}
                              className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Variações / Cores`
    );
}

fs.writeFileSync('src/admin/views/Products.tsx', code);
