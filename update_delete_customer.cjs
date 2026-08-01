const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Customers.tsx', 'utf8');

const deleteOld = `  const executeDeleteCustomer = async (customer: any) => {
    try {
      // Find orders to delete
      const customerOrders = orders.filter(o => (o.email?.toLowerCase().trim() || o.phone?.trim() || o.customer?.trim()) === customer.identifier);
      
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      customerOrders.forEach(o => {
        batch.delete(doc(db, 'orders', o.id));
      });
      
      await batch.commit();

      toast.success('Cliente e seus pedidos foram excluídos com sucesso!');
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Ocorreu um erro ao tentar excluir o cliente.');
    }
  };`;
const deleteNew = `  const executeDeleteCustomer = async (customer: any, deleteOrders: boolean = false) => {
    try {
      const { writeBatch } = await import('firebase/firestore');
      const batch = writeBatch(db);
      
      if (deleteOrders) {
        const customerOrders = orders.filter(o => (o.email?.toLowerCase().trim() || o.phone?.trim() || o.customer?.trim()) === customer.identifier);
        customerOrders.forEach(o => {
          batch.delete(doc(db, 'orders', o.id));
        });
      }
      
      // Delete from customers collection if it exists
      if (customer.id) {
        batch.delete(doc(db, 'customers', customer.id));
      } else {
        // If they were derived but not saved, we can mark them deleted by saving a deleted flag
        const cId = customer.identifier.replace(/\\//g, '_');
        batch.set(doc(db, 'customers', cId), { deleted: true });
      }
      
      await batch.commit();

      toast.success(deleteOrders ? 'Cliente e seus pedidos foram excluídos com sucesso!' : 'Cliente excluído com sucesso!');
      setSelectedCustomer(null);
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      toast.error('Ocorreu um erro ao tentar excluir o cliente.');
    }
  };`;
content = content.replace(deleteOld, deleteNew);

const btnOld = `                    <button
                      type="button"
                      onClick={() => executeDeleteCustomer(selectedCustomer)}
                      className="px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Sim, Excluir Tudo
                    </button>`;
const btnNew = `                    <button
                      type="button"
                      onClick={() => executeDeleteCustomer(selectedCustomer, false)}
                      className="px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Apenas o Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => executeDeleteCustomer(selectedCustomer, true)}
                      className="px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-red-800 hover:bg-red-900 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={13} /> Cliente + Pedidos
                    </button>`;
content = content.replace(btnOld, btnNew);

const updateMergedOld = `      savedCustomers.forEach(c => {
        customerMap.set(c.identifier, {
          ...c,
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(0)
        });
      });`;
const updateMergedNew = `      savedCustomers.forEach(c => {
        if (c.deleted) return;
        customerMap.set(c.identifier, {
          ...c,
          totalSpent: 0,
          orderCount: 0,
          lastOrderDate: c.createdAt?.toDate ? c.createdAt.toDate() : new Date(0)
        });
      });`;
content = content.replace(updateMergedOld, updateMergedNew);

const updateMergedFilterOld = `        const identifier = email || phone || name;
        if (!identifier) return;

        if (!customerMap.has(identifier)) {`;
const updateMergedFilterNew = `        const identifier = email || phone || name;
        if (!identifier) return;
        
        // Skip if customer was marked as deleted
        if (savedCustomers.find(c => c.identifier === identifier && c.deleted)) return;

        if (!customerMap.has(identifier)) {`;
content = content.replace(updateMergedFilterOld, updateMergedFilterNew);

fs.writeFileSync('src/admin/views/Customers.tsx', content);
