const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

const target = `                          <div className="relative aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={banner.image} alt="Banner Preview" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                              <Upload size={24} />
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const res = await resizeImage(file, 1920, 1080);
                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index].image = res;
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) {}
                                }
                              }} />
                            </label>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Ou cole a URL da imagem aqui"
                            value={banner.image}
                            onChange={(e) => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index].image = e.target.value;
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none mt-2"
                          />`;

const replacement = `                          <div className="relative aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                            <img src={banner.image} alt="Banner Preview" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/40 md:opacity-0 md:hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity">
                              <Upload size={24} className="opacity-70 md:opacity-100" />
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const res = await resizeImage(file, 1920, 1080);
                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index].image = res;
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) {}
                                }
                              }} />
                            </label>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors">
                              <Image size={16} />
                              Buscar na Galeria
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const res = await resizeImage(file, 1920, 1080);
                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index].image = res;
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) {}
                                }
                              }} />
                            </label>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Ou cole a URL da imagem aqui"
                            value={banner.image}
                            onChange={(e) => {
                              const newBanners = [...storefrontSettings.heroBanners];
                              newBanners[index].image = e.target.value;
                              setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm focus:border-[var(--color-primary)] outline-none mt-2"
                          />`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/admin/views/Settings.tsx', code);
  console.log("Updated to add explicit gallery button");
} else {
  console.log("Could not find target content.");
}
