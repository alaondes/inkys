const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const importOld = `import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy } from 'firebase/firestore';`;
const importNew = `import { collection, addDoc, updateDoc, doc, serverTimestamp, onSnapshot, query, orderBy, setDoc } from 'firebase/firestore';`;
content = content.replace(importOld, importNew);

const saveOld = `      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      toast.success(status === 'Orçamento' ? "Orçamento gerado com sucesso!" : "Venda registrada com sucesso!");`;
const saveNew = `      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      const identifier = customerInfo.email?.toLowerCase().trim() || customerInfo.phone?.trim() || customerInfo.name?.trim();
      if (identifier) {
        const cId = identifier.replace(/\\//g, '_');
        await setDoc(doc(db, 'customers', cId), {
          identifier,
          name: customerInfo.name || 'Cliente Balcão',
          email: customerInfo.email || '',
          phone: customerInfo.phone || '',
          doc: customerInfo.doc || '',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      
      toast.success(status === 'Orçamento' ? "Orçamento gerado com sucesso!" : "Venda registrada com sucesso!");`;
content = content.replace(saveOld, saveNew);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
