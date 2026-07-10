const fs = require('fs');
let lines = fs.readFileSync('src/admin/views/Products.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{filteredProducts.length === 0 && (')) {
    // we found the mobile one if the next line has 'bg-white border'
    if (lines[i+1] && lines[i+1].includes('bg-white border border-gray-200 p-8 text-center text-gray-400')) {
      if (lines[i-1].trim() === '))}'){
        lines[i-1] = '        );\n      })}\n    </React.Fragment>\n  ))}';
        break;
      }
    }
  }
}
fs.writeFileSync('src/admin/views/Products.tsx', lines.join('\n'));
console.log('fixed mobile');
