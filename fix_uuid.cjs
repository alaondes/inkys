const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Pos.tsx', 'utf8');

content = content.replace("import { v4 as uuidv4 } from 'uuid';", "");
content = content.replace(
  "id: uuidv4()", 
  "id: Date.now().toString() + Math.random().toString().substring(2, 6)"
);

fs.writeFileSync('src/admin/views/Pos.tsx', content);
