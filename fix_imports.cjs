const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (file.includes('urlUtils.ts')) return;

  if (content.includes('convertGoogleDriveUrl') && !content.includes('import { convertGoogleDriveUrl }')) {
      const depth = file.split(path.sep).length - 2; 
      let relPath = depth === 0 ? './lib/urlUtils' : '../'.repeat(depth) + 'lib/urlUtils';
      
      // We can just put it at the very top of the file
      content = `import { convertGoogleDriveUrl } from '${relPath}';\n` + content;
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed import in ${file}`);
  }
});
