const fs = require('fs');
let code = fs.readFileSync('src/storefront/CustomProductPage.tsx', 'utf8');

code = code.replace(/const \{ storage \} = await import\('\.\.\/lib\/firebase'\);\s*const \{ ref, uploadBytes, getDownloadURL \} = await import\('firebase\/storage'\);\s*const fileRef = ref\(storage, `custom_requests\/\$\{Date\.now\(\)\}_\$\{imageFile\.name\}`\);\s*await uploadBytes\(fileRef, imageFile\);\s*imageUrl = await getDownloadURL\(fileRef\);/g, 
  "const { resizeImage } = await import('../utils/image');\n        imageUrl = await resizeImage(imageFile, 800, 800);");

fs.writeFileSync('src/storefront/CustomProductPage.tsx', code);
console.log("Updated CustomProductPage.tsx");
