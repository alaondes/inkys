const fs = require('fs');
let content = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

const targetStr = `              {/* COLUNA DIREITA: Textos, Estilos e Ações */}
              <div className="space-y-4">`;

const replacementStr = `              {/* COLUNA DIREITA: Textos, Estilos e Ações */}
              <div className="space-y-4">
                {/* ALINHAMENTO DO TEXTO */}
                <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">ALINHAMENTO DO TEXTO</span>
                  </div>
                  <div className="flex gap-2">
                    {['left', 'center', 'right'].map(align => (
                      <button
                        key={align}
                        onClick={() => {
                          const newBanners = [...heroBanners];
                          newBanners[index] = { ...newBanners[index], textAlign: align };
                          setStorefrontSettings({ ...storefrontSettings, heroBanners: newBanners });
                        }}
                        className={\`flex-1 py-2 text-xs font-bold rounded-lg border transition-all \${
                          (banner.textAlign || 'center') === align 
                            ? 'bg-[var(--color-primary)] text-white border-transparent' 
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }\`}
                      >
                        {align === 'left' ? 'Esquerda' : align === 'center' ? 'Centro' : 'Direita'}
                      </button>
                    ))}
                  </div>
                </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/components/BannersTab.tsx', content);
console.log('Fixed align');
