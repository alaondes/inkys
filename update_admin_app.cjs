const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

// Import Calculator
content = content.replace(
  "import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles } from 'lucide-react';",
  "import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles, Calculator } from 'lucide-react';"
);

// Import Pos
content = content.replace(
  "import { Coupons } from './views/Coupons';",
  "import { Coupons } from './views/Coupons';\nimport { Pos } from './views/Pos';"
);

// Add to navItems
content = content.replace(
  "{ path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos' },",
  "{ path: '/admin/orders', icon: ShoppingBag, label: 'Pedidos' },\n    { path: '/admin/pos', icon: Calculator, label: 'Orçamentos / PDV' },"
);

// Add to Routes
content = content.replace(
  '<Route path="/orders" element={<Orders />} />',
  '<Route path="/orders" element={<Orders />} />\n            <Route path="/pos" element={<Pos />} />'
);

fs.writeFileSync('src/admin/AdminApp.tsx', content);
