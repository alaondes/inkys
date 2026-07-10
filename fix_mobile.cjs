const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const str = "        ))}\n        {filteredProducts.length === 0 && (";
const newStr = `        );
      })}
    </React.Fragment>
  ))}
        {filteredProducts.length === 0 && (`

const parts = content.split("        ))}\n        {filteredProducts.length === 0 && (");
if(parts.length > 1) {
  content = parts.join(newStr);
} else {
  // Try another approach
  content = content.replace(/          <\/div>\n        \)\)}\n        \{filteredProducts\.length === 0 && \(/g, `          </div>
        );
      })}
    </React.Fragment>
  ))}
        {filteredProducts.length === 0 && (`);
}

fs.writeFileSync('src/admin/views/Products.tsx', content);
