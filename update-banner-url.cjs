const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

const targetContent = `                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Imagem do Banner</label>
                          <div className="relative aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                        </div>
                      </div>`;

const replacementContent = `                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-1">Imagem do Banner (Upload ou URL)</label>
                          <div className="relative aspect-[21/9] bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
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
                          />
                        </div>
                      </div>`;

if (code.includes(targetContent)) {
  code = code.replace(targetContent, replacementContent);
  fs.writeFileSync('src/admin/views/Settings.tsx', code);
  console.log("Updated settings");
} else {
  console.log("Could not find target content.");
}
