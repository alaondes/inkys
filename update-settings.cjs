const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// Add activeTab state
content = content.replace(
  'const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);',
  "const [activeTab, setActiveTab] = useState('loja');\n  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);"
);

const tabsMenu = `
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-64 shrink-0 space-y-1">
        <h2 className="text-2xl font-bold uppercase tracking-widest mb-6">Configurações</h2>
        
        <button 
          onClick={() => setActiveTab('loja')}
          className={\`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all \${activeTab === 'loja' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}\`}
        >
          <Store size={20} />
          <span className="font-bold text-sm uppercase tracking-wider">Geral da Loja</span>
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
      <div className="flex-1 space-y-8 bg-white/50 backdrop-blur-sm border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm">
`;

content = content.replace(
  /<div className="space-y-8 max-w-4xl">\s*<h2 className="text-2xl font-bold uppercase tracking-widest">Configurações<\/h2>/,
  tabsMenu
);

// We need to wrap each section.
// The easiest way is to use replace on the comments to insert the tab checks.
// But we must close the previous tab check as well.

const sections = [
  { marker: '{/* Store Details and Logo Customization */}', tabStart: '{activeTab === "loja" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'loja' },
  { marker: '{/* Theme Customization */}', tab: 'loja' }, // Keep in loja
  { marker: '{/* Payment Methods */}', tabStart: '</div>)}{activeTab === "pagamento" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'pagamento' },
  { marker: '{/* Storefront Customization */}', tabStart: '</div>)}{activeTab === "vitrine" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'vitrine' },
  { marker: '{/* WhatsApp Configuration */}', tabStart: '</div>)}{activeTab === "loja" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'loja' }, // Wait, multiple 'loja' blocks... let's just use one big wrapping block per tab if possible, or multiple is fine since it's just React nodes.
  { marker: '{/* Store Features */}', tabStart: '</div>)}{activeTab === "vitrine" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'vitrine' },
  { marker: '{/* Shipping Configuration */}', tabStart: '</div>)}{activeTab === "frete" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'frete' },
  { marker: '{/* Password Management */}', tabStart: '</div>)}{activeTab === "seguranca" && (<div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">', tab: 'seguranca' },
  { marker: '{toastMessage && (', tabStart: '</div></div>\n      {toastMessage && (' }
];

sections.forEach(sec => {
  if (sec.tabStart) {
    // Only replace the first occurrence
    content = content.replace(sec.marker, `${sec.tabStart}\n      ${sec.marker}`);
  }
});

// Since WhatsApp is going to loja, maybe we should just close it correctly.
// Let's just output the modified content to a new file to verify.
fs.writeFileSync('src/admin/views/Settings-new.tsx', content);
