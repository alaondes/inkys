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
  
  // Skip urlUtils.ts to avoid circular imports or messing it up
  if (file.includes('urlUtils.ts')) return;

  let modified = false;

  // Find <img ... src={expression} ...>
  // A simple way to do it:
  // Instead of full parsing, we can replace src={...} with a wrapped version, 
  // BUT we have to be careful if it's already wrapped or if it's a string literal like src="http..."

  // Let's do a regex that finds src={...} inside <img
  const regex = /<img\s([^>]*?)src=\{([^}]+)\}([^>]*?)>/gi;
  
  let newContent = content.replace(regex, (match, before, srcContent, after) => {
    // If it's already wrapped, skip
    if (srcContent.includes('convertGoogleDriveUrl')) {
      return match;
    }
    modified = true;
    return `<img ${before}src={convertGoogleDriveUrl(${srcContent})}${after}>`;
  });

  // What about src={...} on a new line after <img ?
  // The regex /<img\s([^>]*?)src=\{([^}]+)\}([^>]*?)>/gi covers whitespace/newlines in `before` and `after` because `[^>]*?` matches any character except `>`.
  // Wait, `[^>]` matches newlines as well in JavaScript regex! 

  if (modified) {
    // We need to add the import if it's not there
    if (!newContent.includes('convertGoogleDriveUrl')) {
        // Wait, it is in newContent now. Let's check if there's an import
        if (!newContent.includes('import { convertGoogleDriveUrl }')) {
            // Figure out relative path to src/lib/urlUtils
            const depth = file.split(path.sep).length - 2; // src/ is 1
            let relPath = depth === 0 ? './lib/urlUtils' : '../'.repeat(depth) + 'lib/urlUtils';
            
            // Just insert at the top after the last import
            const importRegex = /import [^;]+;/g;
            let lastMatch = null;
            let m;
            while ((m = importRegex.exec(newContent)) !== null) {
                lastMatch = m;
            }
            if (lastMatch) {
                const insertPos = lastMatch.index + lastMatch[0].length;
                newContent = newContent.slice(0, insertPos) + `\nimport { convertGoogleDriveUrl } from '${relPath}';` + newContent.slice(insertPos);
            } else {
                newContent = `import { convertGoogleDriveUrl } from '${relPath}';\n` + newContent;
            }
        }
    }
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
