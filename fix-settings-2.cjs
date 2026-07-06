const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');
code = code.replace(/const \{ resizeImage \} = await import\('\.\.\/\.\.\/utils\/image'\);\n/g, "");
fs.writeFileSync('src/admin/views/Settings.tsx', code);
