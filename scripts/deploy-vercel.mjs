import https from 'https';
import fs from 'fs';
import { execSync } from 'child_process';

const TOKEN = process.env.VERCEL_TOKEN;

const options = {
  hostname: 'api.vercel.com',
  path: '/v9/projects',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${TOKEN}`
  }
};

console.log("Buscando projeto 'inkys' no Vercel...");
const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const project = json.projects ? json.projects.find(p => p.name === 'inkys') : null;
      if (project) {
        console.log(`Projeto 'inkys' encontrado (ID: ${project.id})`);
        const orgId = project.accountId;
        fs.mkdirSync('.vercel', { recursive: true });
        fs.writeFileSync('.vercel/project.json', JSON.stringify({ orgId, projectId: project.id }));
      } else {
        console.log("Projeto 'inkys' não encontrado. O Vercel CLI criará um novo projeto.");
      }
      
      console.log("Iniciando deploy para produção com Vercel CLI...");
      // O Vercel vai fazer o upload do código atual e compilar nos servidores deles
      execSync(`npx vercel deploy --prod --token ${TOKEN} --yes`, { stdio: 'inherit' });
      console.log("✅ Deploy concluído com sucesso!");
    } catch (e) {
      console.error("❌ Erro no deploy:", e.message);
    }
  });
});

req.on('error', (e) => console.error("Erro de rede:", e));
req.end();
