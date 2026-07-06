const fs = require('fs');
const content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

const [header, body] = content.split('<div className="space-y-8 max-w-4xl">');

// Now, body has all the sections.
// Sections are delimited by the {/* Comments */}.
// Let's split by these comments to get each block.

const sections = body.split(/(?={\/\*)/g);

let newBody = `
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full mx-auto">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-2">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6 px-2">Configurações</h2>
        
        <button 
          onClick={() => setActiveTab('loja')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'loja' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <Store size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Loja & Marca</span>
        </button>

        <button 
          onClick={() => setActiveTab('vitrine')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'vitrine' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <Layout size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Aparência</span>
        </button>

        <button 
          onClick={() => setActiveTab('pagamento')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'pagamento' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <CreditCard size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Pagamentos</span>
        </button>

        <button 
          onClick={() => setActiveTab('frete')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'frete' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <Truck size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Frete</span>
        </button>

        <button 
          onClick={() => setActiveTab('seguranca')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'seguranca' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <Shield size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Segurança</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 space-y-8 bg-white/70 backdrop-blur-sm border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm min-h-[600px]">
`;

// Categorize blocks
let lojaBlocks = [];
let vitrineBlocks = [];
let pagamentoBlocks = [];
let freteBlocks = [];
let segurancaBlocks = [];
let commonBlocks = []; // stuff at the end like toast

// There's a title <h2> that we can ignore (it's the first element)
for (let section of sections) {
  if (section.includes('<h2')) continue; // Skip the old title

  if (section.includes('{/* Store Details and Logo Customization */}')) lojaBlocks.push(section);
  else if (section.includes('{/* Theme Customization */}')) lojaBlocks.push(section);
  else if (section.includes('{/* Payment Methods */}')) pagamentoBlocks.push(section);
  else if (section.includes('{/* Storefront Customization */}')) vitrineBlocks.push(section);
  else if (section.includes('{/* WhatsApp Configuration */}')) lojaBlocks.push(section);
  else if (section.includes('{/* Store Features */}')) vitrineBlocks.push(section);
  else if (section.includes('{/* Shipping Configuration */}')) freteBlocks.push(section);
  else if (section.includes('{/* Password Management */}')) segurancaBlocks.push(section);
  else {
    // This could be the remaining part with toast message.
    commonBlocks.push(section);
  }
}

newBody += `
        {activeTab === 'loja' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${lojaBlocks.join('\n')}
          </div>
        )}
        
        {activeTab === 'vitrine' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${vitrineBlocks.join('\n')}
          </div>
        )}

        {activeTab === 'pagamento' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${pagamentoBlocks.join('\n')}
          </div>
        )}

        {activeTab === 'frete' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${freteBlocks.join('\n')}
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${segurancaBlocks.join('\n')}
          </div>
        )}
      </div>
`;
// add common blocks (the toast block)
newBody += commonBlocks.join('\n');

let newHeader = header.replace(
  'const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);',
  "const [activeTab, setActiveTab] = useState('loja');\n  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);"
);

let finalCode = newHeader + newBody;

fs.writeFileSync('src/admin/views/Settings.tsx', finalCode);
