const fs = require('fs');
let lines = fs.readFileSync('src/admin/views/Products.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{filteredProducts.length === 0 && (')) {
    // go back and look for extra closures
    if (lines[i-1].trim() === '))}'){
      if (lines[i-2].trim() === '</React.Fragment>') {
        if (lines[i-3].trim() === '})}') {
          if (lines[i-4].trim() === ');') {
             // remove these 4 lines
             lines.splice(i-4, 4);
          }
        }
      }
    }
    break; // only do it for the first one (desktop)
  }
}
fs.writeFileSync('src/admin/views/Products.tsx', lines.join('\n'));
console.log('fixed desktop');
