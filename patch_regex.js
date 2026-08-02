import fs from 'fs';
const file = 'src/admin/views/Products.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.split('/^([a-zA-Z-]+?)(\\d+)$/').join('/^(.+?)(\\d+)$/');
fs.writeFileSync(file, code);
