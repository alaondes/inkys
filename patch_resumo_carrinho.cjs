const fs = require('fs');
let code = fs.readFileSync('src/components/checkout/ResumoCarrinho.tsx', 'utf8');

code = code.replace(
  "{item.name} {item.selectedColor ? `- ${item.selectedColor}` : ''}",
  "{item.name} {item.selectedColor ? `- Cor: ${item.selectedColor}` : ''} {item.selectedSize ? `- Tam: ${item.selectedSize}` : ''}"
);

fs.writeFileSync('src/components/checkout/ResumoCarrinho.tsx', code);
