const fs = require('fs');
let code = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

const regex = /<div className="mt-12 pt-8 border-t border-gray-200">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<button/g;
// Actually let's just find the exact string that starts with `<div className="mt-12 pt-8 border-t border-gray-200">` and ends before the `<button type="button" onClick={handleSaveStorefront}`

code = code.replace(
  /<div className="mt-12 pt-8 border-t border-gray-200">[\s\S]*?Banners dos Produtos \(Detalhes do Produto\)[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<button/,
  '<button'
);

fs.writeFileSync('src/admin/components/BannersTab.tsx', code);
