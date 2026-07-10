const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

// desktop close
content = content.replace(/              \);\s*\n\s*\}\)\}\s*\n\s*<\/React\.Fragment>\s*\n\s*\);\s*\n\s*\}\)\}\s*\n\s*<\/React\.Fragment>\s*\n\s*\}\)\}\s*\n\s*\{filteredProducts\.length === 0/g, `              );
            })}
          </React.Fragment>
        ))}
              {filteredProducts.length === 0`);

// mobile close
content = content.replace(/              \);\s*\n\s*\}\)\}\s*\n\s*<\/React\.Fragment>\s*\n\s*\}\)\}\s*\n\s*\{filteredProducts\.length === 0/g, `              );
            })}
          </React.Fragment>
        ))}
        {filteredProducts.length === 0`);

fs.writeFileSync('src/admin/views/Products.tsx', content);
