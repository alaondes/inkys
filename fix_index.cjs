const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');
content = content.replace('<head>', '<head>\n    <meta name="referrer" content="no-referrer" />');
fs.writeFileSync('index.html', content);
