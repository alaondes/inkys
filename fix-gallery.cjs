const fs = require('fs');
let code = fs.readFileSync('src/admin/views/Settings.tsx', 'utf8');

// Replace uploadBytes with uploadString in imports
code = code.replace("import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';", "import { ref, uploadString, getDownloadURL } from 'firebase/storage';");

// Fix the first input
const block1 = `const storageRef = ref(storage, \\\`banners/\\\${Date.now()}_\\\${file.name}\\\`);
const snapshot = await uploadBytes(storageRef, file);
const res = await getDownloadURL(snapshot.ref);`;

const newBlock1 = `const resized = await resizeImage(file, 2000, 1125);
const storageRef = ref(storage, \\\`banners/\\\${Date.now()}_\\\${file.name}\\\`);
const snapshot = await uploadString(storageRef, resized, 'data_url');
const res = await getDownloadURL(snapshot.ref);`;

code = code.replace(new RegExp(block1.replace(/[-/\\\\^$*+?.()|[\\]{}]/g, '\\\\$&'), 'g'), newBlock1);

// Add toast for error
if (!code.includes('import toast')) {
  code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport toast from 'react-hot-toast';");
}
code = code.replace(/} catch \(error\) {}/g, '} catch (error) { console.error("Upload error:", error); toast.error("Erro ao fazer upload da imagem"); }');

fs.writeFileSync('src/admin/views/Settings.tsx', code);
