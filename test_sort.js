const localProducts = [
  { id: '1722620000000', category: 'Canecas', sku: 'CAN-001' },
  { id: '1722621000000', category: 'Canecas', sku: 'DIA-001' } // newest
];

const newestProduct = [...localProducts].sort((a, b) => b.id.localeCompare(a.id))[0];
console.log(newestProduct.sku);
