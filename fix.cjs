const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const regex = /          <\/div>\n        \)\)}\n        \{filteredProducts\.length === 0 && \(/g;

const replacement = `          </div>
        );
      })}
    </React.Fragment>
  ))}
        {filteredProducts.length === 0 && (`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/admin/views/Products.tsx', content);
