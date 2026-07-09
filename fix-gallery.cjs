const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// The replacement logic:
code = code.replace(
  'const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isGallery: boolean) => {',
  'const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "main" | "gallery" | "banners") => {'
);

code = code.replace(
  'if (isGallery) {',
  'if (target === "gallery" || target === "banners") {'
);

code = code.replace(
  'const newGallery = [...(prev.gallery || []), ...results];',
  'const newItems = [...(prev[target] || []), ...results];'
);

code = code.replace(
  `            // If there's no main image currently set, automatically use the first uploaded gallery image
            const image = !prev.image && newGallery.length > 0 ? newGallery[0] : prev.image;

            return {
              ...prev,
              gallery: newGallery,
              image: image
            };`,
  `            // If there's no main image currently set, automatically use the first uploaded gallery image
            const image = !prev.image && target === "gallery" && newItems.length > 0 ? newItems[0] : prev.image;

            return {
              ...prev,
              [target]: newItems,
              image: image
            };`
);

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

// We need to replace handleImageUpload(e, false) with handleImageUpload(e, "main") and handleImageUpload(e, true) with handleImageUpload(e, "gallery")
code = code.replace(/onChange=\{e => handleImageUpload\(e, false\)\}/g, 'onChange={e => handleImageUpload(e, "main")}');
code = code.replace(/onChange=\{e => handleImageUpload\(e, true\)\}/g, 'onChange={e => handleImageUpload(e, "gallery")}');
code = code.replace(/onChange=\{\(e\) => handleImageUpload\(e, false\)\}/g, 'onChange={(e) => handleImageUpload(e, "main")}');
code = code.replace(/onChange=\{\(e\) => handleImageUpload\(e, true\)\}/g, 'onChange={(e) => handleImageUpload(e, "gallery")}');


// Find the end of the Gallery div to append the Banners div. Let's just find "                    )}\\n                  </div>" around line 882 and replace it with itself + the Banners div.
// Note: we can use a string replace by matching the end of the Gallery section.

const galleryEndMarker = `                      </div>
                    )}
                  </div>`;

const bannersSection = `                  <div className="space-y-1 col-span-2">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[10px] uppercase font-bold text-gray-500">Banners do Produto (Carrossel Promoções)</label>
                      <label className="text-[10px] uppercase font-bold bg-[var(--color-primary)] text-white px-3 py-2 rounded-lg hover:brightness-110 cursor-pointer flex items-center gap-1 transition-all">
                        <PlusCircle size={14} /> Adicionar Banner
                        <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "banners")} />
                      </label>
                    </div>
                    <div className="flex gap-2 mb-2">
                      <input 
                        type="text" 
                        placeholder="Adicionar por URL da imagem..." 
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none" 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = e.currentTarget.value;
                            if (val) {
                              setFormData(prev => ({
                                ...prev,
                                banners: [...(prev.banners || []), val]
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
                    {formData.banners && formData.banners.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {formData.banners.map((img, index) => (
                          <div key={index} className="relative group w-32 h-16 rounded border border-gray-200 overflow-hidden">
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

// Check if galleryEndMarker exists in the file exactly as formatted.
let splitByGalleryEnd = code.split(galleryEndMarker);
if (splitByGalleryEnd.length >= 2) {
  // It exists. Append bannersSection right after the first occurrence.
  code = splitByGalleryEnd[0] + galleryEndMarker + '\\n' + bannersSection + splitByGalleryEnd.slice(1).join(galleryEndMarker);
  fs.writeFileSync('src/admin/views/Products.tsx', code);
  console.log("Successfully appended banners section.");
} else {
  console.log("Failed to find gallery end marker. Dumping marker context.");
  // Dump a portion of the code to see what we should match
  console.log(code.substring(code.indexOf('Galeria de Imagens'), code.indexOf('Galeria de Imagens') + 1500));
}

