const fs = require('fs');

let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// Find the place to add grouped products logic
const groupedLogic = `
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const cat = product.category || 'Sem Categoria';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, typeof filteredProducts[0]>);

  const productCategories = Object.keys(groupedProducts).sort();
`;

// Insert the grouped logic right after filteredProducts declaration
content = content.replace(/const filteredProducts = [^]*?\);\n/, match => match + groupedLogic);

// Add React fragment import if not present
if (!content.includes("import React") && !content.includes("import { Fragment }")) {
  content = "import React from 'react';\n" + content;
}

// Desktop replacement
const desktopRegex = /<tbody className="divide-y divide-gray-100">\s*\{filteredProducts\.map\(\(product, index\) => \(/;
const desktopReplacement = `<tbody className="divide-y divide-gray-100">
              {productCategories.map(category => (
                <React.Fragment key={category}>
                  <tr className="bg-gray-100/60 border-y border-gray-200">
                    <td colSpan={5} className="px-4 py-2.5 font-bold text-gray-800 text-xs tracking-wider uppercase">
                      {category}
                    </td>
                  </tr>
                  {groupedProducts[category].map((product) => {
                    const index = filteredProducts.indexOf(product);
                    return (`
content = content.replace(desktopRegex, desktopReplacement);

// We need to close the desktop map properly
const desktopCloseRegex = /<X size=\{12\} \/><\/button>\s*<\/div>\s*\) : \(\s*<button\s*onClick=\{[^}]+\}\s*className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-all"\s*title="Excluir Produto"\s*>\s*<Trash2 size=\{14\} \/>\s*<\/button>\s*\)\}\s*<\/div>\s*<\/td>\s*<\/tr>\s*\)\)}\s*<\/tbody>/;

const desktopCloseReplacement = `<X size={12} /></button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDeleteId(product.id)} 
                          className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded transition-all"
                          title="Excluir Produto"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </React.Fragment>
        ))}
      </tbody>`;

content = content.replace(desktopCloseRegex, desktopCloseReplacement);

// Mobile replacement
const mobileRegex = /<div className="block md:hidden space-y-4">\s*\{filteredProducts\.map\(\(product, index\) => \(/;
const mobileReplacement = `<div className="block md:hidden space-y-4">
        {productCategories.map(category => (
          <React.Fragment key={category}>
            <div className="bg-gray-100/60 px-4 py-2 -mx-2 rounded border border-gray-200 shadow-sm mt-6 mb-2 flex items-center">
              <span className="font-bold text-gray-800 text-xs tracking-wider uppercase">{category}</span>
            </div>
            {groupedProducts[category].map((product) => {
              const index = filteredProducts.indexOf(product);
              return (`

content = content.replace(mobileRegex, mobileReplacement);

// We need to close the mobile map properly
const mobileCloseRegex = /<X size=\{12\} \/><\/button>\s*<\/div>\s*\) : \(\s*<button onClick=\{[^}]+\} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1.5 transition-colors border border-red-100">\s*<Trash2 size=\{14\} \/> Excluir\s*<\/button>\s*\)\}\s*<\/div>\s*<\/div>\s*\)\)}\s*<\/div>/;

const mobileCloseReplacement = `<X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteId(product.id)} className="flex-1 bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg text-sm font-bold flex justify-center items-center gap-1.5 transition-colors border border-red-100">
                  <Trash2 size={14} /> Excluir
                </button>
              )}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  ))}
</div>`;

content = content.replace(mobileCloseRegex, mobileCloseReplacement);

fs.writeFileSync('src/admin/views/Products.tsx', content);
console.log('Update completed');
