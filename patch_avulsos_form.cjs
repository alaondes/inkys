const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Avulsos.tsx', 'utf8');

// Insert mask functions if they don't exist
if (!code.includes('const maskBRLCurrency')) {
  code = code.replace(
    `import { calculateActualProductProfitability } from '../../lib/pricingUtils';`,
    `import { calculateActualProductProfitability, calculateSuggestedPrice } from '../../lib/pricingUtils';\nimport { Calculator, Sparkles } from 'lucide-react';\n\nconst maskBRLCurrency = (val: string): string => {
  const digits = val.replace(/\\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  if (isNaN(cents)) return '';
  const integerPart = Math.floor(cents / 100);
  const decimalPart = (cents % 100).toString().padStart(2, '0');
  const formattedInteger = new Intl.NumberFormat('pt-BR').format(integerPart);
  return \`\${formattedInteger},\${decimalPart}\`;
};

const parseBRLCurrency = (val: string): number => {
  const digits = val.replace(/\\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
};`
  );
}

// Find the form body
const formStart = `<form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 text-gray-900">`;
const formInnerStart = `<div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">`;

// Define the new form inner body
const newFormInner = `<div className="flex-1 overflow-y-auto pr-1 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Nome do Produto</label>
                    <input required type="text" value={formData.name || ""} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: Arte Final, Camiseta, Caneca..." />
                  </div>
                  
                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Código / SKU</label>
                    <input type="text" value={formData.sku || ""} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="Ex: CAN-001" className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" />
                  </div>

                  <div className="space-y-1 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Categoria</label>
                    <select 
                      value={formData.category || ""} 
                      onChange={e => setFormData({...formData, category: e.target.value})} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none"
                    >
                      <option value="">Selecione uma categoria...</option>
                      {settings.avulsosCategories?.map((cat, idx) => (
                        <option key={idx} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Preço Venda (R$)</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.price !== undefined ? maskBRLCurrency(Math.round(formData.price * 100).toString()) : ''} 
                      onChange={e => {
                        const numericValue = parseBRLCurrency(e.target.value);
                        setFormData({...formData, price: numericValue});
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none font-bold" 
                      placeholder="Ex: 36,90"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-red-600 flex items-center gap-1">
                        <span>Valor Promocional (R$)</span>
                      </label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">(Preço De / riscado)</span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.compareAtPrice !== undefined && formData.compareAtPrice > 0 ? maskBRLCurrency(Math.round(formData.compareAtPrice * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, compareAtPrice: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, compareAtPrice: numericValue});
                        }
                      }} 
                      className="w-full bg-red-50/40 border border-red-200/80 rounded-lg p-3 text-sm focus:border-red-500 outline-none font-semibold" 
                      placeholder="Ex: 49,90 (Opcional)"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Preço de Custo (R$)</label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">(fornecedor)</span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.costPrice !== undefined && formData.costPrice > 0 ? maskBRLCurrency(Math.round(formData.costPrice * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, costPrice: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, costPrice: numericValue});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                      placeholder="Ex: 12,00 (Opcional)"
                    />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Custo Embalagem (R$)</label>
                      <span className="text-[9px] text-gray-400 font-semibold lowercase">
                        (Padrão: R$ {(settings?.pricingRules?.defaultPackagingCost ?? 2).toFixed(2).replace('.', ',')})
                      </span>
                    </div>
                    <input 
                      type="text" 
                      value={formData.packagingCost !== undefined && formData.packagingCost > 0 ? maskBRLCurrency(Math.round(formData.packagingCost * 100).toString()) : ''} 
                      onChange={e => {
                        const raw = e.target.value;
                        if (raw === '') {
                          setFormData({...formData, packagingCost: undefined});
                        } else {
                          const numericValue = parseBRLCurrency(raw);
                          setFormData({...formData, packagingCost: numericValue});
                        }
                      }} 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" 
                      placeholder={\`Ex: \${(settings?.pricingRules?.defaultPackagingCost ?? 2.00).toFixed(2).replace('.', ',')} (Opcional)\`}
                    />
                  </div>
                  
                  {/* Indicador de Oferta / Valor Promocional Ativo */}
                  {(() => {
                    const p1 = formData.price || 0;
                    const p2 = formData.compareAtPrice || 0;
                    if (p1 > 0 && p2 > 0 && p1 !== p2) {
                      const original = Math.max(p1, p2);
                      const promo = Math.min(p1, p2);
                      const discountPct = Math.round((1 - promo / original) * 100);
                      const savings = original - promo;
                      return (
                        <div className="col-span-2 bg-gradient-to-r from-red-50 via-amber-50 to-orange-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between flex-wrap gap-2 text-xs shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                              🔥
                            </div>
                            <div>
                              <div className="font-extrabold text-red-950 flex items-center gap-2">
                                <span>Valor Promocional Ativo</span>
                                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {discountPct}% OFF
                                </span>
                              </div>
                              <div className="text-[11px] text-red-800 font-medium mt-0.5">
                                Preço no site: <strong className="font-black text-red-950">R$ {promo.toFixed(2).replace('.', ',')}</strong> (Preço riscado: <span className="line-through">R$ {original.toFixed(2).replace('.', ',')}</span> - Economia de R$ {savings.toFixed(2).replace('.', ',')})
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Sugestão de Precificação Fixa */}
                  {formData.costPrice !== undefined && formData.costPrice > 0 && (() => {
                    const calc = calculateSuggestedPrice(formData.costPrice, settings.pricingRules, formData.packagingCost);
                    const isCurrentPriceEqual = Math.abs((formData.price || 0) - calc.suggestedPrice) < 0.05;
                    return (
                      <div className="col-span-2 bg-gradient-to-r from-blue-50 via-slate-50 to-emerald-50 border border-blue-200/80 rounded-2xl p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-600 text-white rounded-lg shadow-sm">
                              <Calculator size={16} />
                            </div>
                            <div>
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 block">
                                Formação de Preço Inteligente
                              </span>
                              <span className="text-[10px] text-gray-500">
                                Regras ativas: Taxas, Impostos, Custo Fixo & Margem ({calc.sumPct.toFixed(1)}%)
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const suggestedFormatted = Math.round(calc.suggestedPrice * 100) / 100;
                              setFormData(prev => ({ ...prev, price: suggestedFormatted }));
                              toast.success(\`Preço R$ \${suggestedFormatted.toFixed(2).replace('.', ',')} aplicado!\`);
                            }}
                            className={\`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm \${
                              isCurrentPriceEqual 
                                ? 'bg-emerald-600 text-white cursor-default' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95'
                            }\`}
                          >
                            {isCurrentPriceEqual ? (
                              <>
                                <CheckCircle size={14} /> Preço Sugerido Aplicado
                              </>
                            ) : (
                              <>
                                <Sparkles size={14} /> Aplicar Preço Sugerido (R$ {calc.suggestedPrice.toFixed(2).replace('.', ',')})
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Desconto Pix (%)</label>
                    <input type="number" min="0" max="100" value={formData.pixDiscount !== undefined ? formData.pixDiscount : ''} onChange={e => setFormData({...formData, pixDiscount: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 10" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Parcelas (sem juros)</label>
                    <input type="number" min="1" max="12" value={formData.installments !== undefined ? formData.installments : ''} onChange={e => setFormData({...formData, installments: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 2" />
                  </div>

                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Quantidade em Estoque</label>
                    <input type="number" min="0" value={formData.stock !== undefined ? formData.stock : ''} onChange={e => setFormData({...formData, stock: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Sem limite (ilimitado)" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Avaliação (Estrelas)</label>
                    <input type="number" min="1" max="5" step="0.1" value={formData.rating !== undefined ? formData.rating : ''} onChange={e => setFormData({...formData, rating: e.target.value ? parseFloat(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 5" />
                  </div>
                  
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Qtd. Avaliações</label>
                    <input type="number" min="0" value={formData.reviews !== undefined ? formData.reviews : ''} onChange={e => setFormData({...formData, reviews: e.target.value ? parseInt(e.target.value) : undefined})} className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Ex: 15" />
                  </div>
                  
                  <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">Ocultar Produto</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Produtos ocultos não aparecem na loja para os clientes.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setFormData({...formData, hidden: !formData.hidden})}
                      className={\`w-12 h-6 rounded-full transition-colors relative \${formData.hidden ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}\`}
                    >
                      <div className={\`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform \${formData.hidden ? 'translate-x-6' : 'translate-x-0'}\`} />
                    </button>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Imagem Principal (Destaque)</label>
                    <div className="flex gap-2">
                      <input type="url" value={formData.image || ""} onChange={e => setFormData({...formData, image: e.target.value})} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Adicionar por URL da imagem principal..." />
                    </div>
                  </div>
                  
                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Galeria de Imagens (Carrossel)</label>
                      <span className="text-[10px] text-gray-400">Opcional</span>
                    </div>
                    <div className="space-y-2">
                      {(formData.gallery || []).map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input type="url" value={url} onChange={e => {
                            const newGallery = [...(formData.gallery || [])];
                            newGallery[idx] = e.target.value;
                            setFormData({...formData, gallery: newGallery});
                          }} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="URL da imagem..." />
                          <button type="button" onClick={() => {
                            const newGallery = [...(formData.gallery || [])];
                            newGallery.splice(idx, 1);
                            setFormData({...formData, gallery: newGallery});
                          }} className="p-3 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input type="url" id="new-gallery-url" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none" placeholder="Adicionar por URL da imagem..." onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                              setFormData({...formData, gallery: [...(formData.gallery || []), val]});
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}/>
                        <button type="button" onClick={() => {
                          const input = document.getElementById('new-gallery-url') as HTMLInputElement;
                          if (input && input.value) {
                            setFormData({...formData, gallery: [...(formData.gallery || []), input.value]});
                            input.value = '';
                          }
                        }} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors whitespace-nowrap">
                          Adicionar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-gray-100 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Tamanhos <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddSize} className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 hover:brightness-110">
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
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none uppercase font-bold" 
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

                  <div className="space-y-3 pt-4 border-t border-gray-100 col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Cores <span className="text-gray-400 lowercase">(opcional)</span></label>
                      <button type="button" onClick={handleAddColor} className="flex items-center gap-1 text-[10px] uppercase font-bold text-blue-600 hover:brightness-110">
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
                              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm outline-none" 
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
                  </div>
                </div>
              </div>`;

// Now let's carefully replace the existing form block with this new one
const startIndex = code.indexOf(formInnerStart);
// We want to replace from `<div className="flex-1 overflow-y-auto pr-1 space-y-4 pb-4">` until the start of `<div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 mt-2">`
const endString = `<div className="pt-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 mt-2">`;
const endIndex = code.indexOf(endString);

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newFormInner + "\n\n              " + code.substring(endIndex);
}

fs.writeFileSync('src/admin/views/Avulsos.tsx', code);
