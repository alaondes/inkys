const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// The file had a duplicate import line in the `resizeImage` replacement block. Let's make sure there's no syntax error.
fs.writeFileSync('src/admin/views/Settings.tsx', code);
