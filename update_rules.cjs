const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

if (!content.includes('match /avulso_products')) {
  content = content.replace(
    "match /products/{productId} {",
    "match /avulso_products/{productId} {\n      allow read: if true;\n      allow write: if isAdmin();\n    }\n\n    // Products Collection\n    match /products/{productId} {"
  );
  fs.writeFileSync('firestore.rules', content);
}
