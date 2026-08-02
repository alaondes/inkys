const fs = require('fs');

const file = 'src/admin/views/Products.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldSave = `      if (editingProduct) {
        const updatedProduct = { ...editingProduct, ...finalFormData } as Product;
        await updateProduct(updatedProduct);
        setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
        toast.success('Produto atualizado com sucesso!', { id: loadToast });
      } else {`;

const newSave = `      if (editingProduct) {
        const updatedProduct = { ...editingProduct, ...finalFormData } as Product;
        let productsToUpdate = [updatedProduct];
        
        // CHECK IF SKU PREFIX CHANGED
        const oldMatch = editingProduct.sku?.match(/^([a-zA-Z-]+?)(\\d+)$/);
        const newMatch = updatedProduct.sku?.match(/^([a-zA-Z-]+?)(\\d+)$/);
        
        if (oldMatch && newMatch && oldMatch[1] !== newMatch[1]) {
           const oldPrefix = oldMatch[1];
           const newPrefix = newMatch[1];
           
           const categoryProductsToUpdate = localProducts
             .filter(p => p.id !== updatedProduct.id && p.category === updatedProduct.category && p.sku?.startsWith(oldPrefix))
             .map(p => ({
                 ...p,
                 sku: p.sku.replace(oldPrefix, newPrefix)
             }));
             
           if (categoryProductsToUpdate.length > 0) {
              productsToUpdate = [updatedProduct, ...categoryProductsToUpdate];
           }
        }
        
        if (productsToUpdate.length === 1) {
          await updateProduct(updatedProduct);
          setLocalProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
          toast.success('Produto atualizado com sucesso!', { id: loadToast });
        } else {
          const newLocal = localProducts.map(p => {
             const found = productsToUpdate.find(pu => pu.id === p.id);
             return found || p;
          });
          setLocalProducts(newLocal);
          await setProducts(newLocal);
          toast.success(\`Produto e \${productsToUpdate.length - 1} SKUs atualizados!\`, { id: loadToast });
        }
      } else {`;

if (code.includes(oldSave)) {
  code = code.replace(oldSave, newSave);
  fs.writeFileSync(file, code);
  console.log('Patched handleSave');
} else {
  console.log('Could not find oldSave block');
}
