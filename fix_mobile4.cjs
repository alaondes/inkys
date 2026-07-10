const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const target = "        ))}\n        {filteredProducts.length === 0 && (";
const replacement = `        );
      })}
    </React.Fragment>
  ))}
        {filteredProducts.length === 0 && (`;

const index = content.indexOf(target);
if (index !== -1) {
  content = content.substring(0, index) + replacement + content.substring(index + target.length);
  fs.writeFileSync('src/admin/views/Products.tsx', content);
  console.log('Fixed mobile 4 with exact string match');
} else {
  console.log('Target string not found in file');
}
