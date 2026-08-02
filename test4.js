const localProducts = [
  { id: '100', category: 'Dia dos Pais', sku: 'PAI-001' }
];
const generateNextSku = (categoryName) => {
    if (!categoryName) return '';
    const catProds = localProducts.filter(p => p.category === categoryName && p.sku);
    let prefix = '';
    let maxNumber = 0;
    
    if (catProds.length > 0) {
      const newestProduct = [...catProds].sort((a, b) => b.id.localeCompare(a.id))[0];
      const matchNewest = newestProduct.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
      if (matchNewest) {
        prefix = matchNewest[1];
      }
      
      for (const p of catProds) {
        const match = p.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    } else {
        const allProds = localProducts.filter(p => p.sku);
        if (allProds.length > 0) {
          const newestProduct = [...allProds].sort((a, b) => b.id.localeCompare(a.id))[0];
          const matchNewest = newestProduct.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
          if (matchNewest) {
            prefix = matchNewest[1];
          }
        }
        for (const p of allProds) {
            const match = p.sku?.match(/^([a-zA-Z-]+?)(\d+)$/);
            if (match) {
              const num = parseInt(match[2], 10);
              if (num > maxNumber) {
                maxNumber = num;
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
