const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

if (!content.includes('filterType')) {
  // Add state
  content = content.replace(
    "const [search, setSearch] = useState('');",
    "const [search, setSearch] = useState('');\n  const [filterType, setFilterType] = useState<'todos' | 'online' | 'avulsos'>('todos');"
  );

  // Update filter logic
  content = content.replace(
    /const filteredProducts = allItems\.filter\(p =>[\s\S]*?\);/,
    `const filteredProducts = allItems.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    
    if (filterType === 'online') return !p.isAvulso;
    if (filterType === 'avulsos') return p.isAvulso;
    return true;
  });`
  );

  // Add filter UI
  content = content.replace(
    /<div className="flex gap-4">/g,
    `<div className="flex flex-col gap-4">
              <div className="flex gap-4">`
  );

  content = content.replace(
    /Item Personalizado Único\n              <\/button>\n            <\/div>\n          <\/div>/,
    `Item Personalizado Único
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterType('todos')}
                className={\`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors \${filterType === 'todos' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterType('online')}
                className={\`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors \${filterType === 'online' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}\`}
              >
                Loja Online
              </button>
              <button
                onClick={() => setFilterType('avulsos')}
                className={\`whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors \${filterType === 'avulsos' ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}\`}
              >
                Avulsos (Offline)
              </button>
            </div>
          </div>
          </div>`
  );

  fs.writeFileSync('src/admin/views/Pos.tsx', content);
}
