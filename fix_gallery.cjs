const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Products.tsx', 'utf8');

content = content.replace(/gallery: \[\.\.\.\(prev\.gallery \|\| \[\]\), \.\.\.urls\]/g, 'gallery: [...(prev.gallery || []), ...urls.map(convertGoogleDriveUrl)]');

fs.writeFileSync('src/admin/views/Products.tsx', content);
