const fs = require('fs');
const content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

const navEnd = '</nav>';
const newLink = `
          {userPermissions?.settings && (
            <div className="mt-2">
              <Link
                to="/admin/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={\`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all \${
                  location.pathname === '/admin/settings'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200/60'
                }\`}
              >
                <Settings size={18} />
                <span>{getLabel('/admin/settings', 'Configurações')}</span>
              </Link>
            </div>
          )}
        </nav>`;

fs.writeFileSync('src/admin/AdminApp.tsx', content.replace(navEnd, newLink));
