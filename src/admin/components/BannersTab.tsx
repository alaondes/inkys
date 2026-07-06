import React from 'react';
import { 
  Plus, 
  Save, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Palette, 
  Type, 
  Sparkles 
} from 'lucide-react';

interface Banner {
  id?: string;
  image: string;
  titleHtml: string;
  subtitle: string;
  buttonText: string;
  buttonColor: string;
  buttonLink?: string;
  titleColor?: string;
  titleSize?: string;
  titleFont?: string;
  subtitleColor?: string;
  subtitleSize?: string;
  subtitleFont?: string;
  subtitleSameSize?: boolean;
  description?: string;
  descriptionColor?: string;
  descriptionSize?: string;
  descriptionFont?: string;
}

interface BannersTabProps {
  storefrontSettings: {
    heroBanners: Banner[];
    [key: string]: any;
  };
  setStorefrontSettings: React.Dispatch<React.SetStateAction<any>>;
  handleSaveStorefront: () => void;
  resizeImage: (file: File, maxWidth: number, maxHeight: number) => Promise<string>;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export function BannersTab({
  storefrontSettings,
  setStorefrontSettings,
  handleSaveStorefront,
  resizeImage,
  showToast
}: BannersTabProps) {
  const heroBanners = storefrontSettings.heroBanners || [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Banners (Carrossel)</h3>
          <p className="text-gray-500 text-sm">Configure os banners rotativos da página inicial do seu site.</p>
        </div>
        <button 
          type="button"
          onClick={() => {
            const newBanners = [...heroBanners];
            newBanners.push({
              id: Date.now().toString(),
              image: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?auto=format&fit=crop&q=80',
              titleHtml: 'Novo Banner',
              subtitle: 'Subtítulo',
              buttonText: 'Comprar',
              buttonColor: '#000000'
            });
            setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
          }}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center transition-all shadow-sm cursor-pointer"
        >
          <Plus size={14} className="inline mr-1" /> Adicionar Banner
        </button>
      </div>

      <div className="space-y-6">
        {heroBanners.map((banner, index) => (
          <div key={banner.id || index} className="p-6 border border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 relative group animate-in fade-in duration-300">
            
            {/* Header do Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-gray-100 gap-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-xl bg-violet-100 text-violet-700 text-xs font-bold font-mono">
                  #{index + 1}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-gray-800 font-sans flex items-center gap-1.5">
                    Banner Principal {index + 1}
                  </h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Configuração visual e conteúdo</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const newBanners = [...heroBanners];
                  newBanners.splice(index, 1);
                  setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                }}
                className="text-red-500 hover:text-white hover:bg-red-500 bg-red-50 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-red-100 cursor-pointer"
                title="Remover Banner"
              >
                <Trash2 size={14} /> Excluir Banner
              </button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6">
              
              {/* COLUNA ESQUERDA: Imagem */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ImageIcon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. IMAGEM DE FUNDO</span>
                  </div>
                  
                  <div className="relative aspect-[21/9] bg-slate-200 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-violet-400 group/img transition-colors cursor-pointer">
                    {banner.image ? (
                      <img src={banner.image} alt="Banner Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <ImageIcon size={32} className="opacity-40 mb-1" />
                        <span className="text-xs font-semibold">Sem imagem selecionada</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                      <Upload size={24} className="mb-1" />
                      <span className="text-xs font-bold">Fazer Upload (2000x1125)</span>
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await resizeImage(file, 2000, 1125);
                            const newBanners = [...heroBanners];
                            newBanners[index] = { ...newBanners[index], image: res };
                            setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                            showToast("Imagem carregada com sucesso!", "success");
                          } catch (error) { 
                            console.error("Upload error:", error); 
                            showToast("Erro ao fazer upload da imagem", "error"); 
                          }
                        }
                      }} />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <label className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      <Upload size={14} className="text-slate-500" />
                      Carregar Imagem
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await resizeImage(file, 2000, 1125);
                            const newBanners = [...heroBanners];
                            newBanners[index] = { ...newBanners[index], image: res };
                            setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                            showToast("Imagem carregada com sucesso!", "success");
                          } catch (error) { 
                            console.error("Upload error:", error); 
                            showToast("Erro ao fazer upload da imagem", "error"); 
                          }
                        }
                      }} />
                    </label>

                    <label className="flex items-center justify-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm">
                      <ImageIcon size={14} className="text-slate-500" />
                      Buscar Galeria
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await resizeImage(file, 2000, 1125);
                            const newBanners = [...heroBanners];
                            newBanners[index] = { ...newBanners[index], image: res };
                            setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                            showToast("Imagem carregada!", "success");
                          } catch (error) { 
                            console.error("Upload error:", error); 
                            showToast("Erro ao carregar imagem", "error"); 
                          }
                        }
                      }} />
                    </label>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1">Ou cole o link da imagem</label>
                      {banner.image?.startsWith('data:') && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1.5 py-0.5 rounded-md">Imagem Convertida ✓</span>
                      )}
                    </div>
                    <input type="text" 
                      placeholder="https://exemplo.com/imagem.jpg"
                      value={banner.image?.startsWith('data:') ? 'Imagem salva localmente (Base64)' : banner.image || ''}
                      disabled={banner.image?.startsWith('data:')}
                      onChange={(e) => {
                        if (banner.image?.startsWith('data:')) return;
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], image: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm disabled:bg-slate-100 disabled:text-slate-400 transition-all font-mono truncate"
                    />
                    {banner.image?.startsWith('data:') && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const newBanners = [...heroBanners];
                          newBanners[index] = { ...newBanners[index], image: '' };
                          setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                        }} 
                        className="text-[10px] text-red-500 hover:underline mt-1 font-semibold block text-right ml-auto cursor-pointer"
                      >
                        Limpar Imagem para colar link
                      </button>
                    )}
                  </div>
                </div>

                {/* CHAMADA PARA AÇÃO (BOTÃO) */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">5. CHAMADA PARA AÇÃO (BOTÃO)</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1">Texto do Botão</label>
                      <input type="text" placeholder="Ex: Comprar Agora" value={banner.buttonText || ''} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], buttonText: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none h-10 shadow-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1">Cor do Botão</label>
                      <input type="color" value={banner.buttonColor || '#b44e68'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], buttonColor: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full h-10 cursor-pointer rounded-xl border border-slate-200 p-0.5 bg-white shadow-sm" />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                      <LinkIcon size={10} /> Link do Botão
                    </label>
                    <input 
                      type="text" 
                      placeholder="Ex: #category-all ou https://..."
                      value={banner.buttonLink || ''} 
                      onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], buttonLink: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} 
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm transition-all font-mono" 
                    />
                    <p className="text-[9px] text-slate-400 ml-1">💡 Dica: Use <code className="bg-slate-100 px-1 py-0.5 rounded text-violet-600 font-mono">#category-all</code> para listar todos os produtos.</p>
                  </div>
                </div>
              </div>
              
              {/* COLUNA DIREITA: Textos, Estilos e Ações */}
              <div className="space-y-4">
                
                {/* TÍTULO PRINCIPAL */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">2. TÍTULO PRINCIPAL</span>
                    <span className="text-[9px] text-slate-400 font-semibold">(Suporta HTML)</span>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Ex: Caneca Personalizada"
                    value={banner.titleHtml || ''} 
                    onChange={e => {
                      const newBanners = [...heroBanners];
                      newBanners[index] = { ...newBanners[index], titleHtml: e.target.value };
                      setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                    }} 
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm transition-all" 
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Palette size={10} /> Cor
                      </label>
                      <input type="color" value={banner.titleColor || '#e84e70'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], titleColor: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full h-9 cursor-pointer rounded-xl border border-slate-200 p-0.5 bg-white shadow-sm" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Type size={10} /> Tam.
                      </label>
                      <select value={banner.titleSize || 'text-3xl'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], titleSize: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9">
                        <option value="text-2xl">Pequeno (2xl)</option>
                        <option value="text-3xl">Médio (3xl)</option>
                        <option value="text-4xl">Grande (4xl)</option>
                        <option value="text-5xl">Extra G (5xl)</option>
                        <option value="text-6xl">Super G (6xl)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Sparkles size={10} /> Fonte
                      </label>
                      <select value={banner.titleFont || 'font-sans'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], titleFont: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9">
                        <option value="font-sans">Inter (Padrão)</option>
                        <option value="font-montserrat">Montserrat</option>
                        <option value="font-outfit">Outfit</option>
                        <option value="font-space">Space Grotesk</option>
                        <option value="font-playfair">Playfair Display</option>
                        <option value="font-cinzel">Cinzel</option>
                        <option value="font-lora">Lora (Editorial)</option>
                        <option value="font-serif">Serif Clássica</option>
                        <option value="font-mono">Monospace Tech</option>
                        <option value="font-script">Dancing Cursiva</option>
                        <option value="font-pacifico">Pacifico Retrô</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SUBTÍTULO */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">3. SUBTÍTULO</span>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Ex: Transformando lembranças em emoção"
                    value={banner.subtitle || ''} 
                    onChange={e => {
                      const newBanners = [...heroBanners];
                      newBanners[index] = { ...newBanners[index], subtitle: e.target.value };
                      setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                    }} 
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm transition-all" 
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Palette size={10} /> Cor
                      </label>
                      <input type="color" value={banner.subtitleColor || '#592c60'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], subtitleColor: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full h-9 cursor-pointer rounded-xl border border-slate-200 p-0.5 bg-white shadow-sm" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Type size={10} /> Tam.
                      </label>
                      <select value={banner.subtitleSize || 'text-xl'} disabled={banner.subtitleSameSize} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], subtitleSize: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9 disabled:opacity-50 disabled:bg-slate-100">
                        <option value="text-sm">Pequeno (sm)</option>
                        <option value="text-base">Médio (base)</option>
                        <option value="text-lg">Grande (lg)</option>
                        <option value="text-xl">Extra (xl)</option>
                        <option value="text-2xl">2xl</option>
                        <option value="text-3xl">3xl</option>
                        <option value="text-4xl">4xl</option>
                        <option value="text-5xl">5xl</option>
                        <option value="text-6xl">6xl</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Sparkles size={10} /> Fonte
                      </label>
                      <select value={banner.subtitleFont || 'font-sans'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], subtitleFont: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9">
                        <option value="font-sans">Inter (Padrão)</option>
                        <option value="font-montserrat">Montserrat</option>
                        <option value="font-outfit">Outfit</option>
                        <option value="font-space">Space Grotesk</option>
                        <option value="font-playfair">Playfair Display</option>
                        <option value="font-cinzel">Cinzel</option>
                        <option value="font-lora">Lora (Editorial)</option>
                        <option value="font-serif">Serif Clássica</option>
                        <option value="font-mono">Monospace Tech</option>
                        <option value="font-script">Dancing Cursiva</option>
                        <option value="font-pacifico">Pacifico Retrô</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-1 ml-1">
                    <input 
                      type="checkbox" 
                      id={`subtitle-same-size-${banner.id || index}`}
                      checked={banner.subtitleSameSize || false} 
                      onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], subtitleSameSize: e.target.checked };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }}
                      className="rounded text-violet-600 focus:ring-violet-500 cursor-pointer w-4 h-4"
                    />
                    <label htmlFor={`subtitle-same-size-${banner.id || index}`} className="text-xs text-slate-600 font-medium cursor-pointer select-none">
                      Subtítulo no mesmo tamanho do título
                    </label>
                  </div>
                </div>

                {/* TEXTO COMPLEMENTAR (TERCEIRA LINHA) */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">4. TEXTO COMPLEMENTAR (OPCIONAL)</span>
                  </div>
                  
                  <input 
                    type="text" 
                    placeholder="Texto opcional abaixo do subtítulo"
                    value={banner.description || ''} 
                    onChange={e => {
                      const newBanners = [...heroBanners];
                      newBanners[index] = { ...newBanners[index], description: e.target.value };
                      setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                    }} 
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm transition-all" 
                  />
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Palette size={10} /> Cor
                      </label>
                      <input type="color" value={banner.descriptionColor || '#592c60'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], descriptionColor: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full h-9 cursor-pointer rounded-xl border border-slate-200 p-0.5 bg-white shadow-sm" />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Type size={10} /> Tam.
                      </label>
                      <select value={banner.descriptionSize || 'text-xl'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], descriptionSize: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9">
                        <option value="text-sm">Pequeno (sm)</option>
                        <option value="text-base">Médio (base)</option>
                        <option value="text-lg">Grande (lg)</option>
                        <option value="text-xl">Extra (xl)</option>
                        <option value="text-2xl">2xl</option>
                        <option value="text-3xl">3xl</option>
                        <option value="text-4xl">4xl</option>
                        <option value="text-5xl">5xl</option>
                        <option value="text-6xl">6xl</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-wider text-slate-500 font-bold ml-1 flex items-center gap-1">
                        <Sparkles size={10} /> Fonte
                      </label>
                      <select value={banner.descriptionFont || 'font-sans'} onChange={e => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], descriptionFont: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }} className="w-full bg-white border border-gray-200 rounded-xl p-2 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm h-9">
                        <option value="font-sans">Inter (Padrão)</option>
                        <option value="font-montserrat">Montserrat</option>
                        <option value="font-outfit">Outfit</option>
                        <option value="font-space">Space Grotesk</option>
                        <option value="font-playfair">Playfair Display</option>
                        <option value="font-cinzel">Cinzel</option>
                        <option value="font-lora">Lora (Editorial)</option>
                        <option value="font-serif">Serif Clássica</option>
                        <option value="font-mono">Monospace Tech</option>
                        <option value="font-script">Dancing Cursiva</option>
                        <option value="font-pacifico">Pacifico Retrô</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        type="button"
        onClick={handleSaveStorefront} 
        className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--color-primary)] text-white px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-sm"
      >
        <Save size={18} /> Salvar Banners
      </button>
    </div>
  );
}
