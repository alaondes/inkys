const fs = require('fs');

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Find number inputs with step="0.01" or similar that are for price
  content = content.replace(
    /<input\s+type="number"\s+min="0"\s+step="0\.01"\s+value=\{customItem\.price\}\s+onChange=\{e => setCustomItem\(\{\.\.\.customItem, price: parseFloat\(e\.target\.value\) \|\| 0\}\)\}\s+className="([^"]+)"\s*\/>/g,
    `<input
                    type="text"
                    value={customItem.price ? customItem.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                    onChange={e => {
                      const val = e.target.value.replace(/\\D/g, '');
                      setCustomItem({...customItem, price: val ? parseInt(val, 10) / 100 : 0});
                    }}
                    placeholder="0,00"
                    className="$1"
                  />`
  );
  
  content = content.replace(
    /<input\s+type="number"\s+step="0\.01"\s+min="0"\s+value=\{formData\.price\}\s+onChange=\{e => setFormData\(\{\.\.\.formData, price: parseFloat\(e\.target\.value\) \|\| 0\}\)\}\s+className="([^"]+)"\s*\/>/g,
    `<input
                  type="text"
                  value={formData.price ? formData.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  onChange={e => {
                    const val = e.target.value.replace(/\\D/g, '');
                    setFormData({...formData, price: val ? parseInt(val, 10) / 100 : 0});
                  }}
                  placeholder="0,00"
                  className="$1"
                />`
  );

  fs.writeFileSync(filePath, content);
}

fixFile('src/admin/views/Pos.tsx');
fixFile('src/admin/views/Avulsos.tsx');
