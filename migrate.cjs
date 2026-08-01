const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, setDoc, doc } = require('firebase/firestore');
const fs = require('fs');

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json'));
const app = initializeApp(config);
const db = getFirestore(app);

async function migrate() {
  const snapshot = await getDocs(collection(db, 'orders'));
  const customerMap = new Map();
  
  snapshot.docs.forEach(d => {
    const order = d.data();
    const email = order.email?.toLowerCase().trim();
    const phone = order.phone?.trim();
    const name = order.customer?.trim();
    
    const identifier = email || phone || name;
    if (!identifier) return;
    if (order.status === 'Cancelado') return;

    if (!customerMap.has(identifier)) {
      customerMap.set(identifier, {
        identifier,
        email: email || '',
        name: name || 'Cliente Sem Nome',
        phone: phone || '',
        totalSpent: 0,
        orderCount: 0,
        lastOrderDate: order.date?.toDate ? order.date.toDate() : new Date(0),
        createdAt: new Date()
      });
    }
    const c = customerMap.get(identifier);
    if (order.status !== "Orçamento") {
      c.totalSpent += (order.total || 0);
      c.orderCount += 1;
    }
    const orderDate = order.date?.toDate ? order.date.toDate() : new Date(0);
    if (orderDate > c.lastOrderDate) {
      c.lastOrderDate = orderDate;
      c.name = order.customer;
      c.phone = order.phone;
    }
  });

  const customers = Array.from(customerMap.values());
  for (const c of customers) {
    const cId = c.identifier.replace(/\//g, '_');
    await setDoc(doc(db, 'customers', cId), c, { merge: true });
    console.log('Migrated', c.name);
  }
  console.log('Done');
}
migrate().catch(console.error);
