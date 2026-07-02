import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { formatPrice } from '../../data/products';
import { Search } from 'lucide-react';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const customerMap = new Map();
      snapshot.docs.forEach(doc => {
        const order = doc.data();
        if (order.status === 'Cancelado') return; // Ignore cancelled
        const email = order.email?.toLowerCase().trim();
        if (!email) return;

        if (!customerMap.has(email)) {
          customerMap.set(email, {
            email,
            name: order.customer,
            phone: order.phone,
            totalSpent: 0,
            orderCount: 0,
            lastOrderDate: order.date?.toDate ? order.date.toDate() : new Date(0)
          });
        }
        const c = customerMap.get(email);
        c.totalSpent += (order.total || 0);
        c.orderCount += 1;
        const orderDate = order.date?.toDate ? order.date.toDate() : new Date(0);
        if (orderDate > c.lastOrderDate) {
          c.lastOrderDate = orderDate;
          c.name = order.customer; // update name to latest
          c.phone = order.phone;
        }
      });
      setCustomers(Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent));
    });
    return () => unsubscribe();
  }, []);

  const filtered = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold uppercase tracking-widest">Clientes (CRM)</h2>
      </div>

      <div className="bg-white border border-gray-200 p-4 rounded-2xl flex items-center gap-3">
        <Search className="text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar por nome ou e-mail..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none outline-none text-gray-900 w-full placeholder-gray-400"
        />
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-xs uppercase tracking-widest text-gray-500">
                <th className="p-4 font-bold">Cliente</th>
                <th className="p-4 font-bold">Contato</th>
                <th className="p-4 font-bold text-center">Pedidos</th>
                <th className="p-4 font-bold text-right">Total Gasto</th>
                <th className="p-4 font-bold text-right">Última Compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-500">{c.phone}</td>
                  <td className="p-4 text-sm font-bold text-center">
                    <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{c.orderCount}</span>
                  </td>
                  <td className="p-4 text-sm font-bold text-[var(--color-primary)] text-right">{formatPrice(c.totalSpent)}</td>
                  <td className="p-4 text-sm text-gray-500 text-right">{c.lastOrderDate.toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
