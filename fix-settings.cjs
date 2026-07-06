const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// replace uploadBytes usage with resizeImage
code = code.replace(/const storageRef = ref\(storage, `banners\/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);\s*const snapshot = await uploadBytes\(storageRef, file\);\s*const res = await getDownloadURL\(snapshot\.ref\);/g, 
  "const { resizeImage } = await import('../../utils/image');\nconst res = await resizeImage(file, 2000, 1125);");

fs.writeFileSync('src/admin/views/Settings.tsx', code);
console.log("Updated Settings.tsx");
