const localProducts = [
  { id: '1', category: 'Canecas', sku: 'PROD-001' },
  { id: '2', category: 'Canecas', sku: 'PROD-002' }
];

const generateNextSku = (categoryName) => {
    if (!categoryName) return '';
    const catProds = localProducts.filter(p => p.category === categoryName && p.sku);
    let prefix = '';
    let maxNumber = 0;
    
    if (catProds.length > 0) {
      for (const p of catProds) {
        const match = p.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
        if (match) {
          if (!prefix) prefix = match[1];
          const num = parseInt(match[2], 10);
          if (num > maxNumber) {
            maxNumber = num;
            prefix = match[1]; 
          }
        }
      }
    } else {
        // Look at all products to find the global highest if category is empty
        const allProds = localProducts.filter(p => p.sku);
        for (const p of allProds) {
            const match = p.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
            if (match) {
              if (!prefix) prefix = match[1];
              const num = parseInt(match[2], 10);
              if (num > maxNumber) {
                maxNumber = num;
                prefix = match[1]; 
              }
            }
        }
    }
    
    if (!prefix) {
      prefix = categoryName.substring(0, 3).toUpperCase() + '-';
    }
    
    return `${prefix}${String(maxNumber + 1).padStart(3, '0')}`;
};

console.log(generateNextSku('Dia dos Pais'));
