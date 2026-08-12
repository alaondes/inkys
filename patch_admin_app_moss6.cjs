const fs = require('fs');
let code = fs.readFileSync('src/admin/AdminApp.tsx', 'utf8');

const regex = /<\/main>\s*<\/div>\s*\);\s*\}/;
const newEnd = `      </main>
      </div>
    </div>
  );
}`;

code = code.replace(regex, newEnd);
fs.writeFileSync('src/admin/AdminApp.tsx', code);
