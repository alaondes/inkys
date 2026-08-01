import https from 'https';

const TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = 'prj_wjpzkXXTlYOwou1zMKCe0ich2iV6'; 

const envVars = [
  {
    key: 'GMAIL_USER',
    value: process.env.GMAIL_USER,
    target: ['production', 'preview', 'development'],
    type: 'encrypted'
  },
  {
    key: 'GMAIL_PASS',
    value: process.env.GMAIL_PASS,
    target: ['production', 'preview', 'development'],
    type: 'encrypted'
  }
];

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${PROJECT_ID}/env`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log("Status da resposta:", res.statusCode);
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log("Variáveis de ambiente GMAIL_USER e GMAIL_PASS adicionadas com sucesso!");
    } else {
      console.error("Erro ao adicionar variável:", data);
    }
  });
});

req.on('error', (e) => console.error("Erro de rede:", e));
req.write(JSON.stringify(envVars));
req.end();
