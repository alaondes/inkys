const fs = require('fs');
const ts = require('typescript');
const code = fs.readFileSync('src/admin/views/Settings-new.tsx', 'utf8');

const sourceFile = ts.createSourceFile(
  'Settings.tsx',
  code,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX
);

let hasError = false;
sourceFile.parseDiagnostics.forEach(d => {
    hasError = true;
    const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
    console.log(`Error at line ${pos.line + 1}: ${d.messageText}`);
});
if (!hasError) console.log("Parsed OK");
