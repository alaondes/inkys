import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Upload, Sparkles, Download, FileText, X } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export function CustomProductsAdmin() {
  const { settings, updateSettings } = useSettings();

  const [customPageTitle, setCustomPageTitle] = useState(settings.customPageTitle || '');
  const [customPageDescription, setCustomPageDescription] = useState(settings.customPageDescription || '');
  const [globalTemplateFile, setGlobalTemplateFile] = useState(settings.globalTemplateFile || '');
  const [globalTemplateFileName, setGlobalTemplateFileName] = useState(settings.globalTemplateFileName || '');
  const [customProducts, setCustomProducts] = useState(settings.customProducts || []);

  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    setCustomPageTitle(settings.customPageTitle || '');
    setCustomPageDescription(settings.customPageDescription || '');
    setGlobalTemplateFile(settings.globalTemplateFile || '');
    setGlobalTemplateFileName(settings.globalTemplateFileName || '');
    setCustomProducts(settings.customProducts || []);
  }, [settings]);

  const handleSave = () => {
    updateSettings({
      customPageTitle,
      customPageDescription,
      globalTemplateFile,
      globalTemplateFileName,
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

          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Gabarito/Molde de Arte Padrão (Global)</label>
            <p className="text-xs text-gray-400 ml-1 mb-2">Disponibilize um arquivo padrão para download (ex: gabarito de caneca, PDF com medidas, arquivo PSD, CDR, etc.) para que seu cliente possa criar a arte dele.</p>
            
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nome do Arquivo (Ex: gabarito_geral.pdf)"
                  value={globalTemplateFileName}
                  onChange={(e) => setGlobalTemplateFileName(e.target.value)}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              
              <div className="flex gap-2">
                <label className="cursor-pointer bg-[var(--color-primary)] text-white font-bold px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 hover:brightness-110 transition-all shrink-0">
                  <Upload size={14} /> Upload Gabarito
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setGlobalTemplateFile(reader.result as string);
                          setGlobalTemplateFileName(file.name);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                
                {globalTemplateFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setGlobalTemplateFile('');
                      setGlobalTemplateFileName('');
                    }}
                    className="bg-red-50 text-red-500 hover:bg-red-100 p-2.5 rounded-lg border border-red-100 transition-colors"
                    title="Excluir Gabarito"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase text-gray-400 font-bold shrink-0">Ou colar Link Direto:</span>
                <input
                  type="text"
                  placeholder="Ex: Link do Google Drive, Dropbox, OneDrive..."
                  value={globalTemplateFile?.startsWith('data:') ? '' : globalTemplateFile}
                  onChange={(e) => {
                    setGlobalTemplateFile(e.target.value);
                    if (e.target.value && !globalTemplateFileName) {
                      setGlobalTemplateFileName('Molde_de_Arte_Download');
                    }
                  }}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Recomendado para arquivos grandes acima de 1MB (como gabaritos complexos em PSD, CDR, Illustrator, ZIP).</p>
            </div>

            {globalTemplateFile && (
              <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50/50 border border-green-100 rounded-lg p-2.5 mt-2">
                <FileText size={16} />
                <span className="font-medium">Arquivo salvo: {globalTemplateFileName || "Gabarito Carregado"}</span>
                {globalTemplateFile.startsWith('data:') ? (
                  <span className="text-[10px] text-gray-400 font-normal">(Armazenado localmente como Base64)</span>
                ) : (
                  <span className="text-[10px] text-gray-400 font-normal">(Link externo)</span>
                )}
              </div>
            )}
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
              <div key={idx} className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-4 rounded-xl border border-gray-200 relative">
                <div className="flex-1 w-full space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Nome do Produto</label>
                      <input
                        type="text"
                        placeholder="Nome (ex: Caneca)"
                        value={cp.name}
                        onChange={(e) => {
                          const newProds = [...customProducts];
                          newProds[idx].name = e.target.value;
                          setCustomProducts(newProds);
                        }}
                        className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                    <div className="w-full sm:w-40 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Preço (R$)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
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
                          className="w-full pl-8 pr-2 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:border-[var(--color-primary)] outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">URL da Imagem Principal</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="URL da Imagem"
                          value={cp.image}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].image = e.target.value;
                            setCustomProducts(newProds);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                        />
                        <label className="cursor-pointer bg-white p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors shrink-0 text-gray-600" title="Upload Imagem">
                          <Upload size={18} />
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

                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">URL da Imagem Guia (Opcional)</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="URL da Imagem Guia"
                          value={cp.guideImage || ''}
                          onChange={(e) => {
                            const newProds = [...customProducts];
                            newProds[idx].guideImage = e.target.value;
                            setCustomProducts(newProds);
                          }}
                          className="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none"
                        />
                        <label className="cursor-pointer bg-white p-2.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors shrink-0 text-gray-600" title="Upload Imagem Guia">
                          <Upload size={18} />
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

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Texto de Instruções de Personalização (ex: envie imagem PNG...)</label>
                    <textarea
                      placeholder="Texto de instruções para este produto..."
                      value={cp.guideText || ''}
                      onChange={(e) => {
                        const newProds = [...customProducts];
                        newProds[idx].guideText = e.target.value;
                        setCustomProducts(newProds);
                      }}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-sm focus:border-[var(--color-primary)] outline-none resize-y min-h-[60px]"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-150">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Gabarito de Arte para este Produto (Opcional)</label>
                    <p className="text-[10px] text-gray-400">Insira um arquivo específico para que os clientes criem a arte deste produto.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        placeholder="Nome do Arquivo (Ex: gabarito_caneca.psd)"
                        value={cp.templateFileName || ''}
                        onChange={(e) => {
                          const newProds = [...customProducts];
                          newProds[idx].templateFileName = e.target.value;
                          setCustomProducts(newProds);
                        }}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none"
                      />
                      
                      <div className="flex gap-2">
                        <label className="cursor-pointer bg-gray-100 text-gray-700 font-bold px-3 py-2 rounded-lg text-[11px] flex items-center gap-1.5 hover:bg-gray-200 transition-all shrink-0">
                          <Upload size={12} /> Upload Arquivo
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const newProds = [...customProducts];
                                  newProds[idx].templateFile = reader.result as string;
                                  newProds[idx].templateFileName = file.name;
                                  setCustomProducts(newProds);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        
                        {cp.templateFile && (
                          <button
                            type="button"
                            onClick={() => {
                              const newProds = [...customProducts];
                              newProds[idx].templateFile = '';
                              newProds[idx].templateFileName = '';
                              setCustomProducts(newProds);
                            }}
                            className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg border border-red-100 transition-colors"
                            title="Remover Gabarito"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 font-bold shrink-0">Ou colar Link Direto:</span>
                      <input
                        type="text"
                        placeholder="Link externo do gabarito (Google Drive, OneDrive, etc.)"
                        value={cp.templateFile?.startsWith('data:') ? '' : cp.templateFile || ''}
                        onChange={(e) => {
                          const newProds = [...customProducts];
                          newProds[idx].templateFile = e.target.value;
                          if (e.target.value && !newProds[idx].templateFileName) {
                            newProds[idx].templateFileName = `Molde_de_Arte_${cp.name || 'Produto'}`;
                          }
                          setCustomProducts(newProds);
                        }}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-1.5 text-[11px] focus:border-[var(--color-primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col items-center justify-between md:justify-start gap-4 w-full md:w-auto md:self-stretch md:pt-6 border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pl-4 shrink-0">
                  <div className="flex gap-2">
                    {cp.image && (
                      <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-200 rounded-lg overflow-hidden" title="Imagem Principal">
                        <img src={cp.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {cp.guideImage && (
                      <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-200 rounded-lg overflow-hidden" title="Imagem Guia">
                        <img src={cp.guideImage} alt="Preview Guia" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newProds = [...customProducts];
                      newProds.splice(idx, 1);
                      setCustomProducts(newProds);
                    }}
                    className="text-red-500 hover:bg-red-50 p-2.5 rounded-lg border border-transparent hover:border-red-100 transition-colors self-end md:self-center"
                    title="Remover Produto"
                  >
                    <Trash2 size={20} />
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
