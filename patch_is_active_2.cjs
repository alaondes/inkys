const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

// Replace the previous isActive replacement with a better one
content = content.replace(
  "const isActive = (location.pathname + location.search) === item.path || (item.path.includes('?') ? location.pathname === item.path.split('?')[0] && location.search === '?' + item.path.split('?')[1] : location.pathname === item.path) || (item.path === '/admin' && location.pathname === '/admin/');",
  `const isActive = location.pathname === item.path.split('?')[0] && (
    (location.search === '' && item.path.includes('tab=loja')) || 
    (location.search === '?' + item.path.split('?')[1]) ||
    (!item.path.includes('?') && location.search === '')
  ) || (item.path === '/admin' && location.pathname === '/admin/');`
);

fs.writeFileSync('src/admin/AdminApp.tsx', content);
