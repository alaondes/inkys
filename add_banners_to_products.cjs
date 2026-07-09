const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const resizeImageSnippet = `
  const handleProductBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const resizeImage = (file: File): Promise<string> => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 2000;
              const MAX_HEIGHT = 1125;
              let width = img.width;
              let height = img.height;
              
              if (width > height) {
                if (width > MAX_WIDTH) {
                  height *= MAX_WIDTH / width;
                  width = MAX_WIDTH;
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width *= MAX_HEIGHT / height;
                  height = MAX_HEIGHT;
                }
              }
              
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
              }
              resolve(canvas.toDataURL('image/jpeg', 0.75));
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
        });
      };

      const loadToast = toast.loading('Processando imagens...');
      Promise.all(files.map(f => resizeImage(f))).then(results => {
        const newBanners = [...(settings.productBanners || []), ...results];
        updateSettings({ productBanners: newBanners });
        toast.success('Banners adicionados!', { id: loadToast });
      }).catch(err => {
        toast.error('Erro ao processar imagens', { id: loadToast });
      });
    }
    e.target.value = '';
  };
`;

// Insert the handler before `const handleImageUpload`
code = code.replace(
  'const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {',
  resizeImageSnippet + '\n  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery") => {'
);

const bannersUI = `
      {/* Banners dos Produtos (Detalhes do Produto) */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Banners dos Produtos (Detalhes)</h3>
          <p className="text-gray-500 text-sm">Estes banners aparecerão em formato de carrossel na página de detalhes de todos os produtos.</p>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <label className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:brightness-110 transition-colors shadow-sm whitespace-nowrap">
              <PlusCircle size={16} />
              Fazer Upload
              <input type="file" className="hidden" multiple accept="image/*" onChange={handleProductBannerUpload} />
            </label>
            <div className="flex-1 flex gap-2">
              <input 
                type="text" 
                placeholder="Ou adicionar por URL da imagem..." 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const val = e.currentTarget.value;
                    if (val) {
                      updateSettings({ productBanners: [...(settings.productBanners || []), val] });
                      e.currentTarget.value = '';
                      toast.success('Banner adicionado!');
                    }
                  }
                }}
              />
              <button 
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  const val = input.value;
                  if (val) {
                    updateSettings({ productBanners: [...(settings.productBanners || []), val] });
                    input.value = '';
                    toast.success('Banner adicionado!');
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap"
              >
                Adicionar URL
              </button>
            </div>
          </div>

          {(settings.productBanners && settings.productBanners.length > 0) ? (
            <div className="flex flex-wrap gap-4">
              {settings.productBanners.map((img, index) => (
                <div key={index} className="relative group w-48 h-24 rounded border border-gray-200 overflow-hidden shadow-sm">
                  <img 
                    src={img} 
                    alt={\`Banner Produto \${index}\`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      const newBanners = [...(settings.productBanners || [])];
                      newBanners.splice(index, 1);
                      updateSettings({ productBanners: newBanners });
                      toast.success('Banner removido!');
                    }}
                    className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-gray-500 text-sm">
              Nenhum banner adicionado. Adicione URLs ou faça upload de imagens.
            </div>
          )}
        </div>
      </div>
`;

code = code.replace(
  '<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">',
  bannersUI + '\n      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">'
);

fs.writeFileSync('src/admin/views/Products.tsx', code);
