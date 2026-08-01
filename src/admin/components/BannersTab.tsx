import React from 'react';
import { convertGoogleDriveUrl } from '../../lib/urlUtils';
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
  textAlign?: string;
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
              titleHtml: '',
              subtitle: '',
              buttonText: '',
              buttonColor: '#000000'
            });
            setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
          }}
          className="bg-[var(--color-primary)] hover:brightness-110 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center transition-all shadow-sm cursor-pointer"
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
            
            <div className="gap-6">
              
              {/* COLUNA ESQUERDA: Imagem */}
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <ImageIcon size={14} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">1. IMAGEM DE FUNDO</span>
                  </div>
                  
                  <div className="relative aspect-[1920/633] bg-slate-200 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-violet-400 group/img transition-colors cursor-pointer">
                    {banner.image ? (
                      <img src={banner.image} alt="Banner Preview" className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <ImageIcon size={32} className="opacity-40 mb-1" />
                        <span className="text-xs font-semibold">Sem imagem selecionada</span>
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity">
                      <Upload size={24} className="mb-1" />
                      <span className="text-xs font-bold">Fazer Upload (1920x633)</span>
                      <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const res = await resizeImage(file, 1920, 1080);
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
                            const res = await resizeImage(file, 1920, 1080);
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
                            const res = await resizeImage(file, 1920, 1080);
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
                        newBanners[index] = { ...newBanners[index], image: convertGoogleDriveUrl(e.target.value) };
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
                  <div className="mt-4">
                    <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold ml-1 mb-1 block">Link de Destino do Banner</label>
                    <input type="text"
                      placeholder="Ex: /?category=Canecas ou /produto/123"
                      value={banner.buttonLink || ''}
                      onChange={(e) => {
                        const newBanners = [...heroBanners];
                        newBanners[index] = { ...newBanners[index], buttonLink: e.target.value };
                        setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none shadow-sm transition-all"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 ml-1">
                      Onde o cliente vai ao clicar no banner (deixe vazio para não ter link).
                    </p>
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
