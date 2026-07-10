const fs = require('fs');
let lines = fs.readFileSync('src/admin/views/Products.tsx', 'utf8').split('\n');

// start from end
for (let i = lines.length - 1; i >= 0; i--) {
  if (lines[i].includes('))}')) {
    // Check if it's the last one by looking ahead
    lines[i] = '        );\n      })}\n    </React.Fragment>\n  ))}';
    break;
  }
}
fs.writeFileSync('src/admin/views/Products.tsx', lines.join('\n'));
console.log('fixed mobile 3');
