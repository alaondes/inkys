const fs = require('fs');
let code = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

const mainOldRegex = /<main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50\/60 relative">[\s\S]*?<\/header>/;

const mainNew = `<main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F4F5F9] relative">`;

code = code.replace(mainOldRegex, mainNew);

fs.writeFileSync('src/admin/AdminApp.tsx', code);
