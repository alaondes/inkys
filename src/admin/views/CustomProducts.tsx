import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, Sparkles, Download, FileText, X, Tag, DollarSign } from 'lucide-react';
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
  { id: 'ps', label: 'Photoshop', color: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { id: 'cdr', label: 'CorelDraw', color: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' },
  { id: 'ai', label: 'Illustrator', color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { id: 'canva', label: 'Canva', color: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100' },
  { id: 'pdf', label: 'PDF', color: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' },
  { id: 'other', label: 'Outro', color: 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100' },
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
    showToast('Página de personalizados atualizada com sucesso!');
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="text-[var(--color-primary)]" size={28} />
            Personalizados
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Configure as informações e os produtos exibidos na página de itens personalizáveis.
          </p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-sm shrink-0"
        >
          <Save size={18} /> Salvar Alterações
        </button>
      </div>

      {/* Page Info */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Conteúdo da Página</h3>
          <p className="text-gray-500 text-sm">Insira o título e a descrição de apresentação que os clientes verão.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Título da Página</label>
            <input
              type="text"
              value={customPageTitle}
              onChange={(e) => setCustomPageTitle(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none text-gray-900 transition-all"
              placeholder="Ex: Seu Produto, do Seu Jeito!"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Descrição</label>
            <textarea
              value={customPageDescription}
              onChange={(e) => setCustomPageDescription(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:border-[var(--color-primary)] outline-none resize-y min-h-[100px] text-gray-900 transition-all"
              placeholder="Descreva as vantagens de solicitar um produto personalizado..."
            />
          </div>
        </div>
      </div>

      {/* Customizable Products List */}
      <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Produtos Personalizáveis</h3>
            <p className="text-gray-500 text-sm">Gerencie o catálogo de produtos que podem ser personalizados.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setCustomProducts([...customProducts, { name: '', image: '', guideText: '', price: undefined }]);
            }}
            className="bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
          >
            <Plus size={16} /> Adicionar Produto
          </button>
        </div>

        <div className="space-y-4">
          {customProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
              Nenhum produto cadastrado. Clique em "Adicionar Produto" acima para começar.
            </div>
          ) : (
            customProducts.map((cp, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col md:flex-row gap-6 p-6 items-start">
                {/* Visual Accent Top Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary)] to-indigo-500 opacity-90" />
                
                <div className="flex-1 w-full space-y-4 text-left">
                  {/* Card Identifier Row */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 w-full">
                    <div className="flex items-center gap-2">
                      <span className="bg-purple-100 text-[var(--color-primary)] font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg">
                        Produto #{idx + 1}
                      </span>
                      <h4 className="font-extrabold text-gray-800 text-sm">
                        {cp.name || "Novo Produto Personalizado"}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {cp.templateFile || (cp.templates && cp.templates.some(t => t.file)) ? (
                        <span className="bg-green-50 text-green-700 border border-green-100 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Com Gabarito Ativo
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Sem Gabarito
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Identification Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold ml-1 flex items-center gap-1">
                        <Tag size={12} className="text-gray-400" />
                        Nome do Produto
                      </label>
                      <input
                        type="text"
                        placeholder="Nome (ex: Caneca de Cerâmica, Camiseta de Algodão)"
                        value={cp.name}
                        onChange={(e) => {
                          const newProds = [...customProducts];
                          newProds[idx].name = e.target.value;
                          setCustomProducts(newProds);
                        }}
                        className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all font-medium"
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold ml-1 flex items-center gap-1">
                        <DollarSign size={12} className="text-gray-400" />
                        Preço Base (R$)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold font-mono">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0,00"
                          value={cp.price !== undefined ? cp.price : ''}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].price = e.target.value !== '' ? parseFloat(e.target.value) : undefined;
                            setCustomProducts(newProds);
                          }}
                          className="w-full pl-9 pr-3 py-3 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all font-bold font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Images Upload Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold ml-1 flex items-center gap-1.5">
                        <Upload size={12} className="text-gray-400" />
                        Imagem Principal (Banner/Vitrine)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Insira URL ou faça upload ao lado"
                          value={cp.image}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].image = e.target.value;
                            setCustomProducts(newProds);
                          }}
                          className="flex-1 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all text-gray-600 font-mono"
                        />
                        <label className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]" title="Fazer Upload da Imagem Principal">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  const newProds = [...customProducts];
                                  newProds[idx].image = result;
                                  setCustomProducts(newProds);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold ml-1 flex items-center gap-1.5">
                        <Upload size={12} className="text-gray-400" />
                        Imagem de Referência / Guia (Opcional)
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="Insira URL ou faça upload ao lado"
                          value={cp.guideImage || ''}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].guideImage = e.target.value;
                            setCustomProducts(newProds);
                          }}
                          className="flex-1 bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none transition-all text-gray-600 font-mono"
                        />
                        <label className="cursor-pointer bg-white hover:bg-gray-50 border border-gray-200 p-3 rounded-xl transition-all shadow-xs flex items-center justify-center shrink-0 text-gray-600 hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]" title="Fazer Upload da Imagem Guia">
                          <Upload size={16} />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  const newProds = [...customProducts];
                                  newProds[idx].guideImage = result;
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

                  {/* Customization instruction text */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-extrabold ml-1 flex items-center gap-1.5">
                      <FileText size={12} className="text-gray-400" />
                      Texto de Instruções de Personalização (ex: envie imagem PNG com fundo transparente...)
                    </label>
                    <textarea
                      placeholder="Quais dicas ou orientações o cliente deve ver ao enviar a arte deste produto específico? (ex: formatos aceitos, margens seguras, dicas de qualidade de impressão)"
                      value={cp.guideText || ''}
                      onChange={(e) => {
                        const newProds = [...customProducts];
                        newProds[idx].guideText = e.target.value;
                        setCustomProducts(newProds);
                      }}
                      className="w-full bg-gray-50/50 hover:bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:border-[var(--color-primary)] focus:bg-white focus:ring-4 focus:ring-purple-100 outline-none resize-y min-h-[70px] transition-all"
                    />
                  </div>

                  {/* Interactive Multiple Templates Section */}
                  <div className="bg-gradient-to-br from-indigo-50/20 to-purple-50/40 border border-purple-100/60 rounded-2xl p-4 space-y-4">
                    <div className="flex items-start justify-between gap-2.5 pb-2 border-b border-purple-100/30">
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 text-[var(--color-primary)] flex items-center justify-center shrink-0 shadow-xs">
                          <FileText size={15} />
                        </div>
                        <div className="text-left">
                          <label className="text-[10px] uppercase tracking-wider text-purple-950 font-extrabold block leading-tight">
                            Gabaritos de Arte do Produto (Opcional - Máx. 4)
                          </label>
                          <p className="text-[10px] text-purple-700/80 mt-0.5 font-medium leading-relaxed">
                            Ofereça moldes de gabarito próprio para este item (Ex: molde PSD, CDR, AI, PDF) para o cliente baixar.
                          </p>
                        </div>
                      </div>
                      
                      {(!cp.templates || cp.templates.length < 4) && (
                        <button
                          type="button"
                          onClick={() => {
                            const newProds = [...customProducts];
                            if (!newProds[idx].templates) {
                              newProds[idx].templates = [];
                            }
                            // if there is old template files, migrate them to templates first if templates is empty
                            if (newProds[idx].templates.length === 0 && cp.templateFile) {
                              newProds[idx].templates.push({
                                name: cp.templateFileName || "Gabarito_1",
                                file: cp.templateFile
                              });
                              // clear old fields
                              newProds[idx].templateFile = "";
                              newProds[idx].templateFileName = "";
                            }
                            newProds[idx].templates.push({ name: '', file: '' });
                            setCustomProducts(newProds);
                          }}
                          className="bg-[var(--color-primary)] hover:brightness-105 text-white font-extrabold text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus size={11} />
                          <span>Adicionar Gabarito</span>
                        </button>
                      )}
                    </div>

                    {/* Existing / added templates list */}
                    {(() => {
                      // Migrate old fields to the list if the templates array doesn't exist
                      let templatesList = cp.templates || [];
                      if (templatesList.length === 0 && cp.templateFile) {
                        templatesList = [{ name: cp.templateFileName || 'Gabarito Principal', file: cp.templateFile }];
                      }
                      
                      if (templatesList.length === 0) {
                        return (
                          <div className="text-center py-4 bg-white/50 border border-dashed border-purple-100/80 rounded-xl">
                            <p className="text-xs text-purple-900/60 font-medium">Nenhum gabarito adicionado para este produto.</p>
                            <button
                              type="button"
                              onClick={() => {
                                const newProds = [...customProducts];
                                newProds[idx].templates = [{ name: '', file: '' }];
                                // Clear old properties if any
                                newProds[idx].templateFile = '';
                                newProds[idx].templateFileName = '';
                                setCustomProducts(newProds);
                              }}
                              className="text-[var(--color-primary)] font-extrabold text-[10px] uppercase tracking-wider mt-2 hover:underline inline-flex items-center gap-1"
                            >
                              <Plus size={10} /> Clique para adicionar o primeiro
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-3 text-left">
                          {templatesList.map((tmpl, tIdx) => {
                            const isExternal = tmpl.file && !tmpl.file.startsWith('data:');
                            return (
                              <div key={tIdx} className="bg-white border border-purple-100/55 rounded-xl p-3 space-y-2.5 relative shadow-xs">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                                    Gabarito #{tIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newProds = [...customProducts];
                                      const currentTemplates = [...(newProds[idx].templates || [])];
                                      if (currentTemplates.length === 0 && cp.templateFile) {
                                        // It was the migrated single one
                                        newProds[idx].templateFile = '';
                                        newProds[idx].templateFileName = '';
                                      } else {
                                        currentTemplates.splice(tIdx, 1);
                                        newProds[idx].templates = currentTemplates;
                                      }
                                      setCustomProducts(newProds);
                                    }}
                                    className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg border border-transparent hover:border-red-100 transition-colors cursor-pointer"
                                    title="Remover este gabarito"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                                  <input
                                    type="text"
                                    placeholder="Nome do gabarito (Ex: Gabarito Frente.psd)"
                                    value={tmpl.name || ''}
                                    onChange={(e) => {
                                      const newProds = [...customProducts];
                                      const currentTemplates = [...(newProds[idx].templates || [])];
                                      const detected = detectProgramFromFileName(e.target.value);
                                      if (currentTemplates.length === 0 && cp.templateFile) {
                                        newProds[idx].templates = [{
                                          name: e.target.value,
                                          file: cp.templateFile,
                                          program: detected
                                        }];
                                        newProds[idx].templateFile = '';
                                        newProds[idx].templateFileName = '';
                                      } else {
                                        if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                        currentTemplates[tIdx].name = e.target.value;
                                        if (detected) {
                                          currentTemplates[tIdx].program = detected;
                                        }
                                        newProds[idx].templates = currentTemplates;
                                      }
                                      setCustomProducts(newProds);
                                    }}
                                    className="flex-1 bg-gray-50 border border-gray-150 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] focus:bg-white outline-none"
                                  />

                                  <label className="cursor-pointer bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-extrabold px-3 py-2 rounded-lg text-[11px] flex items-center justify-center gap-1 hover:shadow-xs transition-all shrink-0">
                                    <Upload size={12} /> Upload
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
                                              newProds[idx].templates = [{
                                                name: file.name,
                                                file: reader.result as string,
                                                program: detected
                                              }];
                                              newProds[idx].templateFile = '';
                                              newProds[idx].templateFileName = '';
                                            } else {
                                              if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                              currentTemplates[tIdx].file = reader.result as string;
                                              currentTemplates[tIdx].name = file.name;
                                              if (detected) {
                                                currentTemplates[tIdx].program = detected;
                                              }
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

                                {/* Interactive Program Selection Badge-Row */}
                                <div className="space-y-1.5">
                                  <span className="text-[9px] text-purple-950 font-extrabold uppercase tracking-wider block">Programa Associado:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {programsList.map((prog) => {
                                      const isSelected = tmpl.program === prog.id;
                                      return (
                                        <button
                                          key={prog.id}
                                          type="button"
                                          onClick={() => {
                                            const newProds = [...customProducts];
                                            const currentTemplates = [...(newProds[idx].templates || [])];
                                            if (currentTemplates.length === 0 && cp.templateFile) {
                                              newProds[idx].templates = [{
                                                name: cp.templateFileName || 'Gabarito',
                                                file: cp.templateFile,
                                                program: prog.id
                                              }];
                                              newProds[idx].templateFile = '';
                                              newProds[idx].templateFileName = '';
                                            } else {
                                              if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                              currentTemplates[tIdx].program = prog.id;
                                              newProds[idx].templates = currentTemplates;
                                            }
                                            setCustomProducts(newProds);
                                          }}
                                          className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                                            isSelected
                                              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm font-extrabold'
                                              : `${prog.color} border-gray-150`
                                          }`}
                                        >
                                          {prog.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  <span className="text-[9px] text-gray-400 font-extrabold shrink-0 uppercase tracking-wider">Ou link direto:</span>
                                  <input
                                    type="text"
                                    placeholder="Link externo (Google Drive, OneDrive, etc.)"
                                    value={tmpl.file?.startsWith('data:') ? '' : tmpl.file || ''}
                                    onChange={(e) => {
                                      const newProds = [...customProducts];
                                      const currentTemplates = [...(newProds[idx].templates || [])];
                                      const val = e.target.value;
                                      const detected = detectProgramFromFileName(val);
                                      if (currentTemplates.length === 0 && cp.templateFile) {
                                        newProds[idx].templates = [{
                                          name: `Molde_${cp.name || 'Produto'}`,
                                          file: val,
                                          program: detected
                                        }];
                                        newProds[idx].templateFile = '';
                                        newProds[idx].templateFileName = '';
                                      } else {
                                        if (!currentTemplates[tIdx]) currentTemplates[tIdx] = { name: '', file: '' };
                                        currentTemplates[tIdx].file = val;
                                        if (val && !currentTemplates[tIdx].name) {
                                          currentTemplates[tIdx].name = `Molde_${cp.name || 'Produto'}_${tIdx + 1}`;
                                        }
                                        if (detected) {
                                          currentTemplates[tIdx].program = detected;
                                        }
                                        newProds[idx].templates = currentTemplates;
                                      }
                                      setCustomProducts(newProds);
                                    }}
                                    className="flex-1 bg-gray-50 border border-gray-150 rounded-lg p-1.5 text-[11px] focus:border-[var(--color-primary)] focus:bg-white outline-none text-gray-600 font-mono"
                                  />
                                </div>

                                {tmpl.file && (
                                  <div className="flex items-center gap-1.5 text-[9px] text-green-700 bg-green-50/50 border border-green-100 rounded-md px-2 py-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                    <span className="font-bold">Gabarito Pronto:</span>
                                    <span className="truncate">{tmpl.name || (isExternal ? "Link Externo" : "Arquivo Integrado")}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Right Panel: Previews & Remove Actions */}
                <div className="w-full md:w-44 flex flex-col items-center justify-between gap-4 shrink-0 md:self-stretch md:border-l border-gray-100 md:pl-6 pt-4 md:pt-0">
                  <div className="w-full flex flex-col gap-3">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-extrabold text-center block">Visualização</span>
                    
                    <div className="flex md:flex-col items-center justify-center gap-3">
                      {cp.image ? (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:scale-105 transition-transform" title="Imagem Principal">
                            <img src={cp.image} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase">Principal</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <div className="w-16 h-16 flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-xl" title="Sem Imagem">
                            <Upload size={14} className="text-gray-300" />
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase">Sem Imagem</span>
                        </div>
                      )}

                      {cp.guideImage ? (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:scale-105 transition-transform" title="Imagem Guia">
                            <img src={cp.guideImage} alt="Preview Guia" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase">Guia</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 w-20">
                          <div className="w-16 h-16 flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-xl" title="Sem Guia">
                            <Upload size={14} className="text-gray-300" />
                          </div>
                          <span className="text-[8px] text-gray-400 font-bold uppercase">Sem Guia</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newProds = [...customProducts];
                      newProds.splice(idx, 1);
                      setCustomProducts(newProds);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-red-500 hover:text-white bg-red-50/50 hover:bg-red-600 border border-red-100 hover:border-red-600 py-2.5 rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer mt-auto"
                    title="Excluir este Produto"
                  >
                    <Trash2 size={14} />
                    <span>Excluir Produto</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button 
          onClick={handleSave}
          className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-8 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all shadow-md"
        >
          <Save size={18} /> Salvar Todas as Configurações
        </button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-lg border bg-white border-green-100 text-green-800`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-100">
              <Save size={16} className="text-green-600" />
            </div>
            <span className="font-medium">{toastMessage.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
