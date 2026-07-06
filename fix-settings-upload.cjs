const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

code = code.replace(/import { ref, uploadBytes, getDownloadURL } from 'firebase\/storage';/g, "import { ref, uploadString, getDownloadURL } from 'firebase/storage';");

const regex = /const storageRef = ref\(storage, `banners\/\$\{Date\.now\(\)\}_\$\{file\.name\}`\);\s+const snapshot = await uploadBytes\(storageRef, file\);\s+const res = await getDownloadURL\(snapshot\.ref\);/g;

code = code.replace(regex, `const resized = await resizeImage(file, 2000, 1125);
                                    const storageRef = ref(storage, \`banners/\${Date.now()}_\${file.name}\`);
                                    const snapshot = await uploadString(storageRef, resized, 'data_url');
                                    const res = await getDownloadURL(snapshot.ref);`);

fs.writeFileSync('src/admin/views/Settings.tsx', code);
