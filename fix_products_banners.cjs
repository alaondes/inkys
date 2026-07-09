const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// Replace handleProductBannerUpload to save as objects
code = code.replace(
  'const newBanners = [...(settings.productBanners || []), ...results];',
  'const newBanners = [...(settings.productBanners || []), ...results.map(r => ({ image: r, link: "" }))];'
);

// Replace add URL
code = code.replace(
  'updateSettings({ productBanners: [...(settings.productBanners || []), val] });',
  'updateSettings({ productBanners: [...(settings.productBanners || []), { image: val, link: "" }] });'
);
code = code.replace(
  'updateSettings({ productBanners: [...(settings.productBanners || []), val] });',
  'updateSettings({ productBanners: [...(settings.productBanners || []), { image: val, link: "" }] });'
);

// Replace rendering of product banners map
const oldMap = `{(settings.productBanners && settings.productBanners.length > 0) ? (
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
            </div>`;

const newMap = `{(settings.productBanners && settings.productBanners.length > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {settings.productBanners.map((item: any, index: number) => {
                const img = typeof item === 'string' ? item : item.image;
                const link = typeof item === 'string' ? '' : (item.link || '');
                return (
                  <div key={index} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                    <div className="relative group w-full h-24 rounded border border-gray-200 overflow-hidden shadow-sm">
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
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Link do banner (opcional)..." 
                        value={link}
                        onChange={(e) => {
                          const newBanners = [...(settings.productBanners || [])];
                          newBanners[index] = { image: img, link: e.target.value };
                          updateSettings({ productBanners: newBanners });
                        }}
                        className="flex-1 bg-white border border-gray-200 rounded-lg p-2 text-xs focus:border-[var(--color-primary)] outline-none" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>`;

code = code.replace(oldMap, newMap);
fs.writeFileSync('src/admin/views/Products.tsx', code);
