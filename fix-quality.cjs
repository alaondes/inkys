const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

code = code.replace(/canvas\.toDataURL\('image\/jpeg', 0\.5\)/g, "canvas.toDataURL('image/jpeg', 0.85)");
code = code.replace(/resizeImage\(file, 1200, 675\)/g, "resizeImage(file, 2000, 1125)");

fs.writeFileSync('src/admin/views/Settings.tsx', code);
console.log("Quality updated");
