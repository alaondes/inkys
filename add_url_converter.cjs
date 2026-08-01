const fs = require('fs');

const files = [
  'src/admin/views/Products.tsx',
  'src/admin/views/Settings.tsx',
  'src/admin/views/CustomProducts.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    if (!content.includes('convertGoogleDriveUrl')) {
      // Add import
      content = content.replace(/(import.*lucide-react';\n)/, `$1import { convertGoogleDriveUrl } from '../../lib/urlUtils';\n`);
      modified = true;
    }

    const replacements = [
      { from: /image: val, link/g, to: 'image: convertGoogleDriveUrl(val), link' },
      { from: /image: e\.target\.value/g, to: 'image: convertGoogleDriveUrl(e.target.value)' },
      { from: /newProds\[idx\]\.image = e\.target\.value;/g, to: 'newProds[idx].image = convertGoogleDriveUrl(e.target.value);' }
    ];

    replacements.forEach(r => {
      if (content.match(r.from)) {
        content = content.replace(r.from, r.to);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`Updated ${file}`);
    }
  }
});
