const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

code = code.replace(/getDownloadURL\(snapshot\)/g, "getDownloadURL(snapshot.ref)");

fs.writeFileSync('src/admin/views/Settings.tsx', code);
