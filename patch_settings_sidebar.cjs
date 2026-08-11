const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf-8');

// The internal sidebar starts around "w-full lg:w-64" and ends before "flex-1 min-w-0"
// We will hide it using 'hidden lg:block' or just remove it.
// The user asked to put it in the lateral menu "like the others", implying the main sidebar.
// Let's just hide the internal sidebar completely, since they are now in the main menu!
content = content.replace(
  'className="w-full lg:w-64 shrink-0 space-y-2"',
  'className="hidden"'
);

fs.writeFileSync('src/admin/views/Settings.tsx', content);
