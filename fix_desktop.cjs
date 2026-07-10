const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// The original closing was `              ))}` at line 748.
const regex = /              \)\)}\s*\{filteredProducts\.length === 0 && \(/;
const replacement = `              );
            })}
          </React.Fragment>
        ))}
              {filteredProducts.length === 0 && (`

content = content.replace(regex, replacement);

fs.writeFileSync('src/admin/views/Products.tsx', content);
console.log('Desktop fixed');
