const fs = require('fs');
let lines = fs.readFileSync('src/admin/views/Products.tsx', 'utf8').split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === '))}'){
    if (lines[i+1].trim() === '{filteredProducts.length === 0 && (') {
      lines[i] = '        );\n      })}\n    </React.Fragment>\n  ))}';
      replaced = true;
      break;
    }
  }
}

if (replaced) {
  fs.writeFileSync('src/admin/views/Products.tsx', lines.join('\n'));
  console.log('replaced successfully');
} else {
  console.log('not found');
}
