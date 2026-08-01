const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

if (!content.includes('import { Avulsos }')) {
  content = content.replace(
    "import { Pos } from './views/Pos';",
    "import { Pos } from './views/Pos';\nimport { Avulsos } from './views/Avulsos';"
  );
  
  content = content.replace(
    "import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles, Calculator } from 'lucide-react';",
    "import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, ExternalLink, Users, Ticket, FileText, X, Sparkles, Calculator, Layers } from 'lucide-react';"
  );

  content = content.replace(
    "{ path: '/admin/pos', icon: Calculator, label: 'Orçamentos / PDV' },",
    "{ path: '/admin/pos', icon: Calculator, label: 'Orçamentos / PDV' },\n    { path: '/admin/avulsos', icon: Layers, label: 'Avulsos' },"
  );

  content = content.replace(
    '<Route path="/pos" element={<Pos />} />',
    '<Route path="/pos" element={<Pos />} />\n            <Route path="/avulsos" element={<Avulsos />} />'
  );

  fs.writeFileSync('src/admin/AdminApp.tsx', content);
}
