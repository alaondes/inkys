const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

const importStr = "import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';\nimport { storage } from '../../lib/firebase';\n";

if (!code.includes('import { storage }')) {
  code = code.replace("import { useSettings } from '../../context/SettingsContext';", "import { useSettings } from '../../context/SettingsContext';\n" + importStr);
}

// Replace resizeImage in heroBanners
code = code.replace(/const res = await resizeImage\(file, 2000, 1125\);/g, `
const storageRef = ref(storage, \`banners/\${Date.now()}_\${file.name}\`);
const snapshot = await uploadBytes(storageRef, file);
const res = await getDownloadURL(snapshot);
`);

// Same for the other resizeImage
code = code.replace(/const res = await resizeImage\(file, 1200, 675\);/g, `
const storageRef = ref(storage, \`banners/\${Date.now()}_\${file.name}\`);
const snapshot = await uploadBytes(storageRef, file);
const res = await getDownloadURL(snapshot);
`);

fs.writeFileSync('src/admin/views/Settings.tsx', code);
console.log("Updated banner upload to use Firebase Storage");
