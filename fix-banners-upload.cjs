const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// Replace handleImageUpload declaration
code = code.replace(
  'const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {',
  'const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery" | "banners") => {'
);

// Replace the condition inside handleImageUpload
code = code.replace(
  'if (isGallery) {',
  'if (target === "gallery" || target === "banners") {'
);

code = code.replace(
  'const newGallery = [...(prev.gallery || []), ...results];',
  'const newItems = [...(prev[target] || []), ...results];'
);

code = code.replace(
  `// If there's no main image currently set, automatically use the first uploaded gallery image
            const image = !prev.image && newGallery.length > 0 ? newGallery[0] : prev.image;

            return {
              ...prev,
              gallery: newGallery,
              image: image
            };`,
  `// If there's no main image currently set, automatically use the first uploaded gallery image
            const image = !prev.image && target === "gallery" && newItems.length > 0 ? newItems[0] : prev.image;

            return {
              ...prev,
              [target]: newItems,
              image: image
            };`
);

// Add handleRemoveBannerImage
code = code.replace(
  'const handleRemoveGalleryImage = (index: number) => {',
  `const handleRemoveBannerImage = (index: number) => {
    setFormData(prev => {
      const newBanners = [...(prev.banners || [])];
      newBanners.splice(index, 1);
      return { ...prev, banners: newBanners };
    });
  };

  const handleRemoveGalleryImage = (index: number) => {`
);

// Replace existing calls to handleImageUpload
code = code.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, false\)\}/g,
  'onChange={(e) => handleImageUpload(e, "main")}'
);

code = code.replace(
  /onChange=\{\(e\) => handleImageUpload\(e, true\)\}/g,
  'onChange={(e) => handleImageUpload(e, "gallery")}'
);

// We also need to add the Banners section in the form. Let's find the Gallery section and append the Banners section after it.

const gallerySection = `                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Galeria de Imagens</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, "gallery")}
                        className="hidden"
                        id="gallery-upload"
                      />
                      <label 
                        htmlFor="gallery-upload" 
                        className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        <ImagePlus size={16} />
                        Fazer Upload
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const url = window.prompt('Cole a URL da imagem:');
                          if (url) {
                            setFormData(prev => ({
                              ...prev,
                              gallery: [...(prev.gallery || []), url]
                            }));
                          }
                        }}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
                      >
                        Add URL
                      </button>
                    </div>
                    {formData.gallery && formData.gallery.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {formData.gallery.map((img, index) => (
                          <div key={index} className="relative group w-16 h-16 rounded border border-gray-200 overflow-hidden">
                            <img 
                              src={img || undefined} 
                              alt={\`Galeria \${index}\`} 
                              className="w-full h-full object-contain" 
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveGalleryImage(index)}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>`;

const bannersSection = `                  <div className="space-y-1 col-span-2">
                    <label className="text-[10px] uppercase font-bold text-gray-500">Banners do Produto (Carrossel)</label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, "banners")}
                        className="hidden"
                        id="banners-upload"
                      />
                      <label 
                        htmlFor="banners-upload" 
                        className="flex-1 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors"
                      >
                        <ImagePlus size={16} />
                        Fazer Upload
                      </label>
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          placeholder="Ou cole uma URL..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const input = e.currentTarget;
                              const val = input.value.trim();
                              if (val) {
                                setFormData(prev => ({
                                  ...prev,
                                  banners: [...(prev.banners || []), val]
                                }));
                                input.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            const val = input.value.trim();
                            if (val) {
                              setFormData(prev => ({
                                ...prev,
                                banners: [...(prev.banners || []), val]
                              }));
                              input.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors whitespace-nowrap"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                    {formData.banners && formData.banners.length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-3">
                        {formData.banners.map((img, index) => (
                          <div key={index} className="relative group w-16 h-16 rounded border border-gray-200 overflow-hidden">
                            <img 
                              src={img || undefined} 
                              alt={\`Banner \${index}\`} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop' }}
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveBannerImage(index)}
                              className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>`;

// First let's check what the actual gallery section looks like in the code
fs.writeFileSync('fix-banners-upload.cjs-intermediate', code);
