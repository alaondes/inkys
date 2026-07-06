const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// We will replace the uploadString logic back to uploadBytes for full quality, 
// and we will remove the redundant "Buscar na Galeria" button to avoid confusion.

// Remove the second button (Buscar na Galeria)
const redundantButtonRegex = /<div className="flex gap-2 mt-2">\s*<label className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors">\s*<Image size=\{16\} \/>\s*Buscar na Galeria\s*<input type="file" className="hidden" accept="image\/\*" onChange=\{async \(e\) => \{[\s\S]*?\}\} \/>\s*<\/label>\s*<\/div>/g;

code = code.replace(redundantButtonRegex, '');

// Restore uploadBytes for full quality on the first button
const uploadRegex = /const resized = await resizeImage\(file, 2000, 1125\);\s*const storageRef = ref\(storage, `banners\/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);\s*const snapshot = await uploadString\(storageRef, resized, 'data_url'\);\s*const res = await getDownloadURL\(snapshot\.ref\);/g;

code = code.replace(uploadRegex, `const storageRef = ref(storage, \`banners/\${Date.now()}_\${file.name}\`);
const snapshot = await uploadBytes(storageRef, file);
const res = await getDownloadURL(snapshot.ref);`);

// And we need to make sure uploadBytes is imported
if (!code.includes('uploadBytes,')) {
    code = code.replace("import { ref, uploadString, getDownloadURL } from 'firebase/storage';", "import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';");
}

fs.writeFileSync('src/admin/views/Settings.tsx', code);
