const fs = require('fs');
let code = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

const oldReturnStr = `  return (
    <div className="flex h-screen bg-slate-50/70 text-slate-900 font-sans overflow-hidden">
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}`;

const replacement1 = `  return (
    <div className="flex flex-col h-screen bg-[#F4F5F9] text-slate-900 font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <header className="h-16 bg-[#3b3373] text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 w-56 lg:w-[260px] h-16 shrink-0">
            {logoUrl ? (
              <img src={convertGoogleDriveUrl(logoUrl)} alt="Logo" className="h-8 w-auto max-w-[100px] object-contain brightness-0 invert" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded border border-white/20 bg-white/10 flex items-center justify-center text-white font-black text-sm">
                M
              </div>
            )}
            <span className="font-bold text-lg hidden lg:block">Moss</span>
          </div>
          
          <button 
            className="text-white/80 hover:text-white p-1 rounded-lg" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={22} />
          </button>

          <button className="hidden sm:flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            <Plus size={16} /> New
          </button>
          <button className="hidden md:flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors">
            Quick Link
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={() => setIsCalculatorOpen(true)}
            className="hidden sm:flex text-white/80 hover:text-white transition-colors"
          >
            <Calculator size={20} />
          </button>
          <Link to="/" target="_blank" className="text-white/80 hover:text-white transition-colors">
            <ExternalLink size={20} />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
      
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}`;

code = code.replace(oldReturnStr, replacement1);
fs.writeFileSync('src/admin/AdminApp.tsx', code);
