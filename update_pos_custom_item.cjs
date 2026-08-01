const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

// Update state
content = content.replace(
  "const [customItem, setCustomItem] = useState({ name: '', price: 0, image: '', quantity: 1 });",
  "const [customItem, setCustomItem] = useState({ name: '', price: 0, image: '', quantity: 1, saveToAvulsos: false });"
);

// Update handleAddCustomItem
content = content.replace(
  /const handleAddCustomItem = \(\) => {[\s\S]*?setCustomItem\({ name: '', price: 0, image: '', quantity: 1 }\);\n  };/,
  `const handleAddCustomItem = async () => {
    if (!customItem.name) {
      toast.error('Informe o nome do produto/serviço');
      return;
    }
    
    if (customItem.saveToAvulsos) {
      try {
        await addDoc(collection(db, 'avulso_products'), {
          name: customItem.name,
          price: customItem.price,
          image: customItem.image || '',
          createdAt: serverTimestamp()
        });
        toast.success('Produto salvo na lista de Avulsos!');
      } catch (e) {
        console.error(e);
        toast.error('Erro ao salvar produto avulso.');
      }
    }

    setCart([...cart, { 
      id: Date.now().toString(), 
      name: customItem.name, 
      price: customItem.price, 
      image: customItem.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop', 
      quantity: customItem.quantity, 
      isCustom: true 
    }]);
    setShowCustomModal(false);
    setCustomItem({ name: '', price: 0, image: '', quantity: 1, saveToAvulsos: false });
  };`
);

// Update Modal UI
content = content.replace(
  /<\/div>\n              \n              <button\n                onClick=\{handleAddCustomItem\}/,
  `</div>
              
              <div className="flex items-center gap-2 mt-4 bg-purple-50 p-3 rounded-xl border border-purple-100">
                <input
                  type="checkbox"
                  id="saveToAvulsos"
                  checked={customItem.saveToAvulsos}
                  onChange={e => setCustomItem({...customItem, saveToAvulsos: e.target.checked})}
                  className="w-4 h-4 text-[var(--color-primary)] rounded border-gray-300 focus:ring-[var(--color-primary)]"
                />
                <label htmlFor="saveToAvulsos" className="text-xs font-bold text-purple-900 cursor-pointer">
                  Salvar produto na lista de Avulsos para usos futuros
                </label>
              </div>

              <button
                onClick={handleAddCustomItem}`
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
