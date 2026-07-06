const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

const regex = /<\/label>\s*<\/div>\s*<input\s*type="text"/;
const newCode = `</label>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors">
                              <Image size={16} />
                              Buscar na Galeria
                              <input type="file" className="hidden" accept="image/*" onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const storageRef = ref(storage, \`banners/\${Date.now()}_\${file.name}\`);
                                    const snapshot = await uploadBytes(storageRef, file);
                                    const res = await getDownloadURL(snapshot.ref);

                                    const newBanners = [...storefrontSettings.heroBanners];
                                    newBanners[index] = { ...newBanners[index], image: res };
                                    setStorefrontSettings({...storefrontSettings, heroBanners: newBanners});
                                  } catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }
                                }
                              }} />
                            </label>
                          </div>
                          
                          <input type="text"`;

code = code.replace(regex, newCode);

fs.writeFileSync('src/admin/views/Settings.tsx', code);
