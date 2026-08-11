import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, FileText, X, Image as ImageIcon, CheckCircle2, Tag, DollarSign, LayoutGrid } from 'lucide-react';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
import { useSettings } from '../../context/SettingsContext';

const detectProgramFromFileName = (name: string): string | undefined => {
  const lower = name.toLowerCase();
  if (lower.endsWith('.psd')) return 'ps';
  if (lower.endsWith('.cdr')) return 'cdr';
  if (lower.endsWith('.ai')) return 'ai';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.includes('canva.com') || lower.includes('canva')) return 'canva';
  return undefined;
};

const programsList = [
  { id: 'ps', label: 'Photoshop', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'cdr', label: 'CorelDraw', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'ai', label: 'Illustrator', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'canva', label: 'Canva', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'pdf', label: 'PDF', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { id: 'other', label: 'Outro', color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export function CustomProductsAdmin() {
  const { settings, updateSettings } = useSettings();

  const [customPageTitle, setCustomPageTitle] = useState(settings.customPageTitle || '');
  const [customPageDescription, setCustomPageDescription] = useState(settings.customPageDescription || '');
  const [customProducts, setCustomProducts] = useState(settings.customProducts || []);

  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setCustomPageTitle(settings.customPageTitle || '');
    setCustomPageDescription(settings.customPageDescription || '');
    setCustomProducts(settings.customProducts || []);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      customPageTitle,
      customPageDescription,
      customProducts,
    });
    showToast('Alterações salvas com sucesso!');
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      {/* Header do Catálogo de Personalizados */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Personalizados</h2>
            <span className="bg-purple-50 text-purple-700 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-100 uppercase tracking-wider">
              {customProducts.length} {customProducts.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
          <p className="text-slate-500 text-xs font-medium">
            Configure as informações e os produtos exibidos na página de itens personalizáveis.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button 
            onClick={handleSave}
            className="flex-1 md:flex-none text-xs font-black text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5"
          >
            <Save size={16} /> Salvar Alterações
          </button>
        </div>
      </div>

      {/* Page Content Section */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs space-y-5">
        <div>
          <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
            <LayoutGrid size={16} className="text-slate-400" />
            Conteúdo da Página
          </h3>
          <p className="text-slate-500 text-xs mt-0.5 ml-5.5">Insira o título e a descrição de apresentação que os clientes verão.</p>
        </div>
        
        <div className="grid grid-cols-1 gap-4 ml-5.5">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 ml-1">Título de Apresentação</label>
            <input
              type="text"
              value={customPageTitle}
              onChange={(e) => setCustomPageTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-900"
              placeholder="Ex: Crie produtos exclusivos com a sua marca"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 ml-1">Descrição</label>
            <textarea
              value={customPageDescription}
              onChange={(e) => setCustomPageDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-900 resize-y"
              placeholder="Descreva as vantagens de solicitar um produto personalizado..."
            />
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Catálogo de Produtos</h3>
            <p className="text-slate-500 text-xs mt-0.5">Gerencie os itens personalizáveis e seus respectivos gabaritos (moldes).</p>
          </div>
          <button
            type="button"
            onClick={() => setCustomProducts([...customProducts, { name: '', image: '', guideText: '', price: undefined }])}
            className="px-4 py-2.5 rounded-2xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>

        {customProducts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs font-medium">
            Nenhum produto cadastrado. Adicione um novo produto para começar.
          </div>
        ) : (
          <div className="space-y-6">
            {customProducts.map((cp: any, idx: number) => {
              const templates = cp.templates || [];
              if (templates.length === 0 && cp.templateFile) {
                templates.push({
                  name: cp.templateFileName || 'Gabarito Principal',
                  file: cp.templateFile,
                  program: 'other'
                });
              }

              return (
                <div key={idx} className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col xl:flex-row overflow-hidden relative">
                  {/* Accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500/20" />

                  {/* Left Form Content */}
                  <div className="flex-1 p-6 space-y-5 pl-7">
                    
                    {/* Header of product item */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-purple-100 text-purple-700 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-purple-200">
                          Produto #{idx + 1}
                        </span>
                        {templates.some((t: any) => t.file) ? (
                           <span className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                             Gabarito Ativo
                           </span>
                        ) : (
                           <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                             Sem Gabarito
                           </span>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const newProds = [...customProducts];
                          newProds.splice(idx, 1);
                          setCustomProducts(newProds);
                        }}
                        className="text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 p-2 rounded-xl transition-all border border-slate-200 hover:border-rose-200"
                        title="Excluir produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 ml-1 flex items-center gap-1">
                          <Tag size={12} className="text-slate-400" /> Nome do Produto
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Caneca Branca"
                          value={cp.name || ''}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].name = e.target.value;
                            setCustomProducts(newProds);
                          }}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-900"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 ml-1 flex items-center gap-1">
                          <DollarSign size={12} className="text-slate-400" /> Preço (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={cp.price !== undefined ? cp.price : ''}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].price = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
                            setCustomProducts(newProds);
                          }}
                          className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-bold text-slate-900 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-black text-slate-500 ml-1 flex items-center gap-1">
                        <FileText size={12} className="text-slate-400" /> Instruções para o cliente
                      </label>
                      <textarea
                        placeholder="Ex: Envie a imagem com fundo transparente..."
                        value={cp.guideText || ''}
                        onChange={(e) => {
                          const newProds = [...customProducts];
                          newProds[idx].guideText = e.target.value;
                          setCustomProducts(newProds);
                        }}
                        rows={2}
                        className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2.5 text-xs focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:bg-white outline-none transition-all font-medium text-slate-700 resize-y"
                      />
                    </div>

                    {/* Templates/Gabaritos Area */}
                    <div className="pt-5 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <label className="text-[11px] font-black text-slate-900">Gabaritos de Arte</label>
                          <p className="text-[10px] text-slate-500 font-medium">Ofereça moldes próprios para este item (Máx. 4)</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newProds = [...customProducts];
                            if (!newProds[idx].templates) newProds[idx].templates = [];
                            if (newProds[idx].templates.length < 4) {
                              newProds[idx].templates.push({ name: '', file: '' });
                              setCustomProducts(newProds);
                            } else {
                              showToast('Máximo de 4 gabaritos por produto.', 'error');
                            }
                          }}
                          className="text-[10px] font-black text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-100 px-3 py-1.5 rounded-xl transition-all"
                        >
                          + Adicionar Gabarito
                        </button>
                      </div>

                      {templates.length === 0 ? (
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Nenhum gabarito cadastrado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {templates.map((tmpl: any, tIdx: number) => {
                            const isExternal = tmpl.file && tmpl.file.startsWith('http');
                            return (
                              <div key={tIdx} className="flex flex-col gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newProds = [...customProducts];
                                    const currentTemplates = [...(newProds[idx].templates || [])];
                                    if (currentTemplates.length === 0 && cp.templateFile) {
                                      newProds[idx].templateFile = '';
                                      newProds[idx].templateFileName = '';
                                    } else {
                                      currentTemplates.splice(tIdx, 1);
                                      newProds[idx].templates = currentTemplates;
                                    }
                                    setCustomProducts(newProds);
                                  }}
                                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-500 bg-white border border-slate-200 p-1.5 rounded-lg transition-colors hover:border-rose-200"
                                >
                                  <Trash2 size={13} />
                                </button>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                                  <input
                                    type="text"
                                    placeholder="Nome (Ex: Molde Frente.psd)"
                                    value={tmpl.name || ''}
                                    onChange={(e) => {
                                      const newProds = [...customProducts];
                                      const currentTemplates = [...(newProds[idx].templates || [])];
                                      const detected = detectProgramFromFileName(e.target.value);
                                      if (currentTemplates.length === 0 && cp.templateFile) {
                                        newProds[idx].templates = [{ name: e.target.value, file: cp.templateFile, program: detected }];
                                        newProds[idx].templateFile = '';
                                        newProds[idx].templateFileName = '';
                                      } else {
                                        if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                        currentTemplates[tIdx].name = e.target.value;
                                        if (detected) currentTemplates[tIdx].program = detected;
                                        newProds[idx].templates = currentTemplates;
                                      }
                                      setCustomProducts(newProds);
                                    }}
                                    className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 font-medium"
                                  />

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      placeholder="Link URL do arquivo"
                                      value={isExternal ? tmpl.file : (tmpl.file ? 'Arquivo local carregado' : '')}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        const newProds = [...customProducts];
                                        const currentTemplates = [...(newProds[idx].templates || [])];
                                        if (currentTemplates.length === 0 && cp.templateFile) {
                                          newProds[idx].templates = [{ name: cp.templateFileName || '', file: val, program: undefined }];
                                          newProds[idx].templateFile = '';
                                          newProds[idx].templateFileName = '';
                                        } else {
                                          if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                          currentTemplates[tIdx].file = val;
                                          newProds[idx].templates = currentTemplates;
                                        }
                                        setCustomProducts(newProds);
                                      }}
                                      className="flex-1 bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs outline-none focus:border-blue-500 font-mono text-slate-500"
                                    />
                                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 px-3 py-2 rounded-xl transition-all shadow-xs flex-shrink-0 flex items-center justify-center">
                                      <Upload size={14} />
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                              const newProds = [...customProducts];
                                              const currentTemplates = [...(newProds[idx].templates || [])];
                                              const detected = detectProgramFromFileName(file.name);
                                              if (currentTemplates.length === 0 && cp.templateFile) {
                                                newProds[idx].templates = [{ name: file.name, file: reader.result as string, program: detected }];
                                                newProds[idx].templateFile = '';
                                                newProds[idx].templateFileName = '';
                                              } else {
                                                if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                                currentTemplates[tIdx].file = reader.result as string;
                                                currentTemplates[tIdx].name = file.name;
                                                if (detected) currentTemplates[tIdx].program = detected;
                                                newProds[idx].templates = currentTemplates;
                                              }
                                              setCustomProducts(newProds);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                  <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Programa associado:</span>
                                  <div className="flex gap-1.5 flex-wrap">
                                    {programsList.map(prog => {
                                      const isSelected = tmpl.program === prog.id;
                                      return (
                                        <button
                                          key={prog.id}
                                          type="button"
                                          onClick={() => {
                                            const newProds = [...customProducts];
                                            const currentTemplates = [...(newProds[idx].templates || [])];
                                            if (currentTemplates.length === 0 && cp.templateFile) {
                                              newProds[idx].templates = [{ name: cp.templateFileName || '', file: cp.templateFile, program: prog.id }];
                                              newProds[idx].templateFile = '';
                                              newProds[idx].templateFileName = '';
                                            } else {
                                              if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                              currentTemplates[tIdx].program = prog.id;
                                              newProds[idx].templates = currentTemplates;
                                            }
                                            setCustomProducts(newProds);
                                          }}
                                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
                                            isSelected 
                                            ? prog.color
                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                          }`}
                                        >
                                          {prog.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Sidebar - Media Preview */}
                  <div className="w-full xl:w-72 bg-slate-50 border-t xl:border-t-0 xl:border-l border-slate-200/80 p-6 flex flex-col gap-6">
                    <span className="text-[10px] uppercase tracking-wider font-black text-slate-400 block text-center xl:text-left">Visualização</span>
                    
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">Imagem Principal</label>
                      <div className="flex flex-col gap-3">
                        <div className="w-full aspect-square bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs group">
                          {cp.image ? (
                            <img src={cp.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <ImageIcon size={32} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 w-full flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Colar URL da imagem..."
                            value={cp.image || ''}
                            onChange={(e) => {
                              const newProds = [...customProducts];
                              newProds[idx].image = convertGoogleDriveUrl(e.target.value);
                              setCustomProducts(newProds);
                            }}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-[11px] outline-none focus:border-blue-500 font-mono text-slate-600"
                          />
                          <label className="cursor-pointer w-full text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2 transition-all flex items-center justify-center gap-1.5 shadow-xs">
                            <Upload size={13} /> Fazer upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newProds = [...customProducts];
                                    newProds[idx].image = reader.result as string;
                                    setCustomProducts(newProds);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-200/80">
                      <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider">Guia (Opcional)</label>
                      <div className="flex flex-col gap-3">
                        <div className="w-full aspect-square bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 shadow-xs group">
                          {cp.guideImage ? (
                            <img src={cp.guideImage} alt="Preview Guia" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <ImageIcon size={32} className="text-slate-300" />
                          )}
                        </div>
                        <div className="flex-1 w-full flex flex-col gap-2">
                          <input
                            type="text"
                            placeholder="Colar URL da guia..."
                            value={cp.guideImage || ''}
                            onChange={(e) => {
                              const newProds = [...customProducts];
                              newProds[idx].guideImage = e.target.value;
                              setCustomProducts(newProds);
                            }}
                            className="w-full bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 text-[11px] outline-none focus:border-blue-500 font-mono text-slate-600"
                          />
                          <label className="cursor-pointer w-full text-[11px] font-black text-slate-700 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl px-3 py-2 transition-all flex items-center justify-center gap-1.5 shadow-xs">
                            <Upload size={13} /> Fazer upload
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newProds = [...customProducts];
                                    newProds[idx].guideImage = reader.result as string;
                                    setCustomProducts(newProds);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span className="font-bold text-xs">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
