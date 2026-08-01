const https = require('https');
https.get('https://lh3.googleusercontent.com/d/1B638AMwcC_ugR7ZT5Z--lOsjrdkMAxp8', (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);
});
