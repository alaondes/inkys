const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Orders.tsx', 'utf8');
content = content.replace(
  '<option value="Cancelado">Cancelados</option>',
  '<option value="Cancelado">Cancelados</option>\n            <option value="Orçamento">Orçamentos</option>'
);
fs.writeFileSync('src/admin/views/Orders.tsx', content);
