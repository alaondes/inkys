const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Orders.tsx', 'utf8');
content = content.replace(
  "(['Pendente', 'Pago', 'Enviado', 'Cancelado'] as OrderStatus[])",
  "(['Pendente', 'Pago', 'Enviado', 'Cancelado', 'Orçamento'] as OrderStatus[])"
);
fs.writeFileSync('src/admin/views/Orders.tsx', content);
