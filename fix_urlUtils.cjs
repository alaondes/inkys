const fs = require('fs');
let content = fs.readFileSync('src/lib/urlUtils.ts', 'utf8');

// Replace regex to be more forgiving
content = content.replace(
  /const driveRegex1.*/g,
  "const driveRegex1 = /https?:\\/\\/(?:drive|docs)\\.google\\.com\\/(?:file\\/d\\/|open\\?id=|uc\\?id=)([_a-zA-Z0-9-]+)/;"
);
content = content.replace(/const driveRegex2.*/g, "");
content = content.replace(/const driveRegex3.*/g, "");
content = content.replace(
  "const match = url.match(driveRegex1) || url.match(driveRegex2) || url.match(driveRegex3);",
  "const match = url.match(driveRegex1);"
);

fs.writeFileSync('src/lib/urlUtils.ts', content);
