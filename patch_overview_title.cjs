const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Overview.tsx', 'utf8');

const titleOldRegex = /<div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">[\s\S]*?<div className="flex items-center gap-2 bg-gray-100 p-1\.5 rounded-2xl border border-gray-200">/;

const titleNew = `<div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-slate-200/60 pb-6 print:hidden">
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-[24px] font-bold tracking-tight text-slate-800">CRM Dashboard</h1>
            <p className="text-[14px] text-slate-500 font-medium">Let's get started</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#F3F4F9] p-1 rounded-xl">`;

code = code.replace(titleOldRegex, titleNew);

code = code.replace(/text-\[var\(--color-primary\)\]/g, 'text-[#3b3373]');

fs.writeFileSync('src/admin/views/Overview.tsx', code);
