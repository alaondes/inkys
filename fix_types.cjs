const fs = require('fs');

// Documents.tsx
let docCode = fs.readFileSync('src/admin/views/Documents.tsx', 'utf8');
docCode = docCode.replace(
  'interface OrderItem {\n  name: string;\n  quantity: number;\n  price: number;\n}',
  'interface OrderItem {\n  name: string;\n  quantity: number;\n  price: number;\n  selectedColor?: string;\n  selectedSize?: string;\n}'
);
fs.writeFileSync('src/admin/views/Documents.tsx', docCode);

// Orders.tsx
let ordCode = fs.readFileSync('src/admin/views/Orders.tsx', 'utf8');
ordCode = ordCode.replace(
  'interface OrderItem {\n  name: string;\n  quantity: number;\n  price: number;\n  image?: string;\n}',
  'interface OrderItem {\n  name: string;\n  quantity: number;\n  price: number;\n  image?: string;\n  selectedColor?: string;\n  selectedSize?: string;\n}'
);
fs.writeFileSync('src/admin/views/Orders.tsx', ordCode);

// PublicDocumentViewer.tsx
let pubCode = fs.readFileSync('src/components/PublicDocumentViewer.tsx', 'utf8');
pubCode = pubCode.replace(
  'interface OrderItem {\n  description: string;\n  quantity: number;\n  unitPrice: number;\n  image?: string;\n}',
  'interface OrderItem {\n  description: string;\n  quantity: number;\n  unitPrice: number;\n  image?: string;\n  selectedColor?: string;\n  selectedSize?: string;\n}'
);
fs.writeFileSync('src/components/PublicDocumentViewer.tsx', pubCode);
