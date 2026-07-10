const fs = require('fs');
let lines = fs.readFileSync('src/admin/views/Products.tsx', 'utf8').split('\n');

for (let i = 885; i < 895; i++) {
  console.log(i + ':', JSON.stringify(lines[i]));
}
