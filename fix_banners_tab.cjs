const fs = require('fs');
let content = fs.readFileSync('src/admin/components/BannersTab.tsx', 'utf8');

if (!content.includes('convertGoogleDriveUrl')) {
  // Add import
  content = content.replace(/(import.*lucide-react';\n)/, `$1import { convertGoogleDriveUrl } from '../../lib/urlUtils';\n`);
  
  // replace image: e.target.value
  content = content.replace(/image: e\.target\.value/g, 'image: convertGoogleDriveUrl(e.target.value)');
  
  fs.writeFileSync('src/admin/components/BannersTab.tsx', content);
  console.log("Updated BannersTab.tsx");
}
