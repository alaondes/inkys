const fs = require('fs');
let code = fs.readFileSync('src/lib/urlUtils.ts', 'utf8');

code = code.replace(
  'export function convertGoogleDriveUrl(url: string): string {',
  'export function convertGoogleDriveUrl(url: string | undefined | null): string {\\n  if (!url) return url as any;'
);

fs.writeFileSync('src/lib/urlUtils.ts', code);
