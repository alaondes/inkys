const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const target = "        ))}\n\n        {filteredProducts.length === 0 && (";
const replacement = `        );
      })}
    </React.Fragment>
  ))}

        {filteredProducts.length === 0 && (`;

content = content.replace(target, replacement);
fs.writeFileSync('src/admin/views/Products.tsx', content);
console.log('Fixed!');
