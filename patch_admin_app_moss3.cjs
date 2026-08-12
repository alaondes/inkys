const fs = require('fs');
let code = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

// The aside
const asideOld = `      {/* Desktop Intelligent Sidebar */}
      <aside className={\`w-72 border-r border-slate-200 bg-white flex flex-col fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300 \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}\`}>
        
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={convertGoogleDriveUrl(logoUrl)} alt="Logo" className="h-10 w-auto max-w-[120px] object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md">
                G
              </div>
            )}
          </div>
          <button className="lg:hidden text-slate-400 hover:text-slate-700 p-1" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={22} />
          </button>
        </div>`;

const asideNew = `      {/* Desktop Intelligent Sidebar */}
      <aside className={\`w-64 border-r border-slate-200 bg-white flex flex-col fixed lg:static top-0 bottom-0 left-0 z-50 transition-transform duration-300 \${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}\`}>`;

code = code.replace(asideOld, asideNew);

fs.writeFileSync('src/admin/AdminApp.tsx', code);
