const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

// Remove the line
content = content.replace(/.*path: '\/admin\/avulsos'.*\n/, '');

const correctedItem = "{ path: '/admin/avulsos', icon: Layers, label: getLabel('/admin/avulsos', `Atendimento & ${settings?.posCustomItemLabel || 'Personalizáveis'}`), permission: 'avulsos' },";
// Add to producao, right before custom-products
const target = "{ path: '/admin/custom-products',";
content = content.replace(target, `        ${correctedItem}\n        ${target}`);

fs.writeFileSync('src/admin/AdminApp.tsx', content);

let settingsContent = fs.readFileSync('src/admin/views/Settings.tsx', 'utf-8');

settingsContent = settingsContent.replace(/.*key: '\/admin\/avulsos'.*\n/, '');

const sCorrectedItem = "{ key: '/admin/avulsos', defaultLabel: `Atendimento & ${settings?.posCustomItemLabel || 'Personalizáveis'}`, path: '/admin/avulsos' },";
const sTarget = "{ key: '/admin/custom-products',";
settingsContent = settingsContent.replace(sTarget, `                    ${sCorrectedItem}\n                    ${sTarget}`);

fs.writeFileSync('src/admin/views/Settings.tsx', settingsContent);
