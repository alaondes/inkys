const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

const oldOrderData = `const orderData = {
        customer: customerInfo.name,
        email: customerInfo.email,
        phone: customerInfo.phone,
        date: serverTimestamp(),
        total,
        status,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        })),
        notes,
        createdAt: serverTimestamp(),
      };`;

const newOrderData = `const orderData = {
        customer: customerInfo.name || 'Cliente Balcão',
        email: customerInfo.email || '',
        phone: customerInfo.phone || '',
        date: serverTimestamp(),
        total,
        status,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop',
        })),
        shippingInfo: {
          mode: shippingMode,
          cost: shippingMode === 'pago' ? shippingCost : 0
        },
        notes,
        createdAt: serverTimestamp(),
      };`;

content = content.replace(oldOrderData, newOrderData);
fs.writeFileSync('src/admin/views/Pos.tsx', content);
