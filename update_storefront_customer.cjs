const fs = require('fs');
let content = fs.readFileSync('src/storefront/Storefront.tsx', 'utf8');

const importOld = `import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';`;
const importNew = `import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy, setDoc, doc } from 'firebase/firestore';`;
content = content.replace(importOld, importNew);

const saveOld = `      let orderId = "";
      try {
        const docRef = await withTimeout(addDoc(collection(db, 'orders'), orderData));
        orderId = docRef.id;`;
const saveNew = `      let orderId = "";
      try {
        const docRef = await withTimeout(addDoc(collection(db, 'orders'), orderData));
        orderId = docRef.id;
        
        const identifier = data.email?.toLowerCase().trim() || data.phone?.trim() || data.name?.trim();
        if (identifier) {
          const cId = identifier.replace(/\\//g, '_');
          await setDoc(doc(db, 'customers', cId), {
            identifier,
            name: data.name || 'Cliente Site',
            email: data.email || '',
            phone: data.phone || '',
            doc: data.cpf || '',
            updatedAt: serverTimestamp()
          }, { merge: true });
        }`;
content = content.replace(saveOld, saveNew);

fs.writeFileSync('src/storefront/Storefront.tsx', content);
