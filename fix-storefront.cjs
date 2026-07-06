const fs = require('fs');
let code = fs.readFileSync('src/storefront/Storefront.tsx', 'utf8');

code = code.replace(/const \{ storage, db \} = await import\('\.\.\/lib\/firebase'\);\s*const \{ ref, uploadBytes, getDownloadURL \} = await import\('firebase\/storage'\);/g, 
  "const { db } = await import('../lib/firebase');");

code = code.replace(/const fileRef = ref\(storage, `uploads\/\$\{Date\.now\(\)\}_\$\{item\.file\.name\}`\);\s*await uploadBytes\(fileRef, item\.file\);\s*const url = await getDownloadURL\(fileRef\);/g, 
  "const { resizeImage } = await import('../utils/image');\n          const url = await resizeImage(item.file, 800, 800);");

fs.writeFileSync('src/storefront/Storefront.tsx', code);
console.log("Updated Storefront.tsx");
