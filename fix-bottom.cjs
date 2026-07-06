const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings-new.tsx', 'utf8');
code = code.replace("      </div></div>\n      {toastMessage && (\n      {toastMessage && (", "      </div></div>\n      {toastMessage && (");
fs.writeFileSync('src/admin/views/Settings-new.tsx', code);
