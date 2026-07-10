const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

const targetStr = `                          </div>
        );
      })}
    </React.Fragment>
  ))}
                      </div>`;
const replacementStr = `                          </div>
                        ))}
                      </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/admin/views/Products.tsx', content);
console.log('Undone');
