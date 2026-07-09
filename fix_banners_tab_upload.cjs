const fs = require('fs');
let code = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

// We need to find the product banners section we just inserted and replace its input area to support file uploads.
const oldSection = `          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Adicionar por URL da imagem..." 
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const val = e.currentTarget.value;
                  if (val) {
                    setStorefrontSettings(prev => ({
                      ...prev,
                      productBanners: [...(prev.productBanners || []), val]
                    }));
                    e.currentTarget.value = '';
                  }
                }
              }}
            />
            <button 
              type="button"
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling;
                const val = input.value;
                if (val) {
                  setStorefrontSettings(prev => ({
                    ...prev,
                    productBanners: [...(prev.productBanners || []), val]
                  }));
                  input.value = '';
                }
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
            >
              Adicionar URL
            </button>
          </div>`;

const newSection = `          <div className="flex gap-2 mb-4">
            <label className="flex items-center justify-center gap-2 bg-[var(--color-primary)] text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:brightness-110 transition-colors shadow-sm whitespace-nowrap">
              <Upload size={16} />
              Fazer Upload
              <input type="file" className="hidden" multiple accept="image/*" onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (files.length > 0) {
                  showToast("Processando imagens...", "success");
                  try {
                    const resizePromises = files.map(f => resizeImage(f, 2000, 1125));
                    const newImages = await Promise.all(resizePromises);
                    setStorefrontSettings(prev => ({
                      ...prev,
                      productBanners: [...(prev.productBanners || []), ...newImages]
                    }));
                    showToast("Imagens carregadas com sucesso!", "success");
                  } catch (error) {
                    console.error("Upload error:", error);
                    showToast("Erro ao processar as imagens.", "error");
                  }
                  e.target.value = '';
                }
              }} />
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
                      setStorefrontSettings(prev => ({
                        ...prev,
                        productBanners: [...(prev.productBanners || []), val]
                      }));
                      e.currentTarget.value = '';
                    }
                  }
                }}
              />
              <button 
                type="button"
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  const val = input.value;
                  if (val) {
                    setStorefrontSettings(prev => ({
                      ...prev,
                      productBanners: [...(prev.productBanners || []), val]
                    }));
                    input.value = '';
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
              >
                Adicionar
              </button>
            </div>
          </div>`;

code = code.replace(oldSection, newSection);
fs.writeFileSync('src/admin/components/BannersTab.tsx', code);
