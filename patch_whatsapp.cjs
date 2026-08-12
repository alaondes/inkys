const fs = require('fs');
let code = fs.readFileSync('src/utils/whatsapp.ts', 'utf8');

code = code.replace(
  "const colorText = item.selectedColor ? ` (Cor: ${item.selectedColor})` : '';",
  "const colorText = item.selectedColor ? ` (Cor: ${item.selectedColor})` : '';\n    const sizeText = item.selectedSize ? ` (Tamanho: ${item.selectedSize})` : '';"
);

code = code.replace(
  "${item.quantity}x ${item.name}${colorText} -",
  "${item.quantity}x ${item.name}${colorText}${sizeText} -"
);

fs.writeFileSync('src/utils/whatsapp.ts', code);
