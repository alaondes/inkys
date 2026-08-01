const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Customers.tsx', 'utf8');

const importOld = `import { collection, onSnapshot, doc, deleteDoc } from 'firebase/firestore';`;
const importNew = `import { collection, onSnapshot, doc, deleteDoc, getDocs, setDoc } from 'firebase/firestore';`;
content = content.replace(importOld, importNew);

const effectOld = `  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const ordersList: any[] = [];
      const customerMap = new Map();

      snapshot.docs.forEach(doc => {
        const order = doc.data();
        const id = doc.id;
        const email = order.email?.toLowerCase().trim();
        const phone = order.phone?.trim();
        const name = order.customer?.trim();
        
        // Identifier prioritizes email, then phone, then name
        const identifier = email || phone || name;

        let formattedDate = 'Data Indisponível';
        if (order.date?.toDate) {
          formattedDate = order.date.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        }

        ordersList.push({
          id,
          ...order,
          dateFormatted: formattedDate,
        });

        if (order.status === 'Cancelado') return; // Ignore cancelled
        if (!identifier) return;

        if (!customerMap.has(identifier)) {
          customerMap.set(identifier, {
            identifier,
            email: email || '',
            name: name || 'Cliente Sem Nome',
            phone: phone || '',
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: order.date?.toDate ? order.date.toDate() : new Date(0)
          });
        }
        const c = customerMap.get(identifier);
        if (order.status !== "Orçamento") c.totalSpent += (order.total || 0);
        if (order.status !== "Orçamento") c.orderCount += 1;
        const orderDate = order.date?.toDate ? order.date.toDate() : new Date(0);
        if (orderDate > c.lastOrderDate) {
          c.lastOrderDate = orderDate;
          c.name = order.customer; // update name to latest
          c.phone = order.phone;
        }
      });
      
      setOrders(ordersList);
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    }, (e) => { console.warn("Firestore snapshot warning:", e.message); });
    
    return () => unsubscribe();
  }, []);`;

const effectNew = `  useEffect(() => {
    let ordersList: any[] = [];
    let savedCustomers: any[] = [];
    
    const updateMerged = () => {
      const customerMap = new Map();
      
      // Load saved customers first
      savedCustomers.forEach(c => {
        customerMap.set(c.identifier, {
          ...c,
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(0)
        });
      });

      ordersList.forEach(order => {
        const email = order.email?.toLowerCase().trim();
        const phone = order.phone?.trim();
        const name = order.customer?.trim();
        
        const identifier = email || phone || name;
        if (!identifier) return;

        if (!customerMap.has(identifier)) {
          customerMap.set(identifier, {
            identifier,
            email: email || '',
            name: name || 'Cliente Sem Nome',
            phone: phone || '',
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: order.date?.toDate ? order.date.toDate() : new Date(0)
          });
        }
        
        if (order.status === 'Cancelado') return;

        const c = customerMap.get(identifier);
        if (order.status !== "Orçamento") {
          c.totalSpent += (order.total || 0);
          c.orderCount += 1;
        }
        const orderDate = order.date?.toDate ? order.date.toDate() : new Date(0);
        if (orderDate > c.lastOrderDate) {
          c.lastOrderDate = orderDate;
          if (!c.id) { // Only update name if not saved in customers collection
            c.name = order.customer; 
            c.phone = order.phone;
          }
        }
      });
      
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    };

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      ordersList = snapshot.docs.map(doc => {
        const order = doc.data();
        let formattedDate = 'Data Indisponível';
        if (order.date?.toDate) {
          formattedDate = order.date.toDate().toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          });
        }
        return {
          id: doc.id,
          ...order,
          dateFormatted: formattedDate,
        };
      });
      setOrders(ordersList);
      updateMerged();
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snapshot) => {
      savedCustomers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      updateMerged();
    });
    
    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, []);`;
content = content.replace(effectOld, effectNew);

fs.writeFileSync('src/admin/views/Customers.tsx', content);
