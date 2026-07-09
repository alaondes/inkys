const fs = require('fs');
let code = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

const productBannersSection = `

      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wider mb-1">Banners dos Produtos (Detalhes do Produto)</h3>
          <p className="text-gray-500 text-sm">Estes banners aparecerão em formato de carrossel na página de detalhes de todos os produtos.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex gap-2 mb-4">
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
          </div>

          {(storefrontSettings.productBanners && storefrontSettings.productBanners.length > 0) ? (
            <div className="flex flex-wrap gap-4">
              {storefrontSettings.productBanners.map((img, index) => (
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
                      setStorefrontSettings(prev => {
                        const newBanners = [...(prev.productBanners || [])];
                        newBanners.splice(index, 1);
                        return { ...prev, productBanners: newBanners };
                      });
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
              Nenhum banner adicionado. Adicione URLs de imagens para exibir nos produtos.
            </div>
          )}
        </div>
      </div>
`;

code = code.replace(
  '      <button \n        type="button"\n        onClick={handleSaveStorefront}',
  productBannersSection + '\n      <button \n        type="button"\n        onClick={handleSaveStorefront}'
);

fs.writeFileSync('src/admin/components/BannersTab.tsx', code);
