const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

// Update isPillarActive
content = content.replace(
  "const isPillarActive = filteredItems.some(i => location.pathname === i.path || (i.path === '/admin' && location.pathname === '/admin/'));",
  "const isPillarActive = filteredItems.some(i => location.pathname === i.path.split('?')[0] || (i.path === '/admin' && location.pathname === '/admin/'));"
);

// Update isActive for individual items
content = content.replace(
  "const isActive = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/');",
  "const isActive = (location.pathname + location.search) === item.path || (item.path.includes('?') ? location.pathname === item.path.split('?')[0] && location.search === '?' + item.path.split('?')[1] : location.pathname === item.path) || (item.path === '/admin' && location.pathname === '/admin/');"
);

fs.writeFileSync('src/admin/AdminApp.tsx', content);
