const fs = require('fs');

const orig = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// I'll extract everything between `<h2 className="text-2xl font-bold uppercase tracking-widest">Configurações</h2>` and `{toastMessage && (`
const startMarker = '<h2 className="text-2xl font-bold uppercase tracking-widest">Configurações</h2>';
const endMarker = '{toastMessage && (';

const startIndex = orig.indexOf(startMarker);
const endIndex = orig.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Markers not found");
  process.exit(1);
}

const beforeStart = orig.slice(0, startIndex);
// Replace `<div className="space-y-8 max-w-4xl">` before it
const replacementPre = beforeStart.replace('<div className="space-y-8 max-w-4xl">', `<div className="flex flex-col lg:flex-row gap-8 max-w-6xl w-full mx-auto">
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
      <div className="flex-1 space-y-8 bg-white/70 backdrop-blur-sm border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm min-h-[600px]">`);

const innerContent = orig.slice(startIndex + startMarker.length, endIndex);
const afterEnd = orig.slice(endIndex);

// Define where each section goes
let lojaTab = [];
let vitrineTab = [];
let pagamentoTab = [];
let freteTab = [];
let segurancaTab = [];

// Split by top-level divs that represent cards.
// Each major card starts with `<div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm space-y-4">`
// Let's just do it manually with split by `{/*`
const sections = innerContent.split(/(?={\/\* )/);

sections.forEach(sec => {
  if (sec.includes('Store Details') || sec.includes('Theme Customization') || sec.includes('WhatsApp Configuration')) {
    lojaTab.push(sec);
  } else if (sec.includes('Storefront Customization') || sec.includes('Store Features')) {
    vitrineTab.push(sec);
  } else if (sec.includes('Payment Methods')) {
    pagamentoTab.push(sec);
  } else if (sec.includes('Shipping Configuration')) {
    freteTab.push(sec);
  } else if (sec.includes('Password Management')) {
    segurancaTab.push(sec);
  }
});

let finalInner = `
        {activeTab === 'loja' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${lojaTab.join('')}
          </div>
        )}
        {activeTab === 'vitrine' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${vitrineTab.join('')}
          </div>
        )}
        {activeTab === 'pagamento' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${pagamentoTab.join('')}
          </div>
        )}
        {activeTab === 'frete' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${freteTab.join('')}
          </div>
        )}
        {activeTab === 'seguranca' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            ${segurancaTab.join('')}
          </div>
        )}
      </div>
`;

let finalFile = replacementPre + finalInner + afterEnd;
// add activeTab state
finalFile = finalFile.replace(
  'const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);',
  "const [activeTab, setActiveTab] = useState('loja');\n  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);"
);

fs.writeFileSync('src/admin/views/Settings-new2.tsx', finalFile);
