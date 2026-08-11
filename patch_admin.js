const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

const itemToMove = "{ path: '/admin/avulsos', icon: Layers, label: getLabel('/admin/avulsos', `Atendimento 'Atendimento & Avulsos' ${settings?.posCustomItemLabel || 'Personalizáveis'}`), permission: 'avulsos' },";
const correctedItem = "{ path: '/admin/avulsos', icon: Layers, label: getLabel('/admin/avulsos', `Atendimento & ${settings?.posCustomItemLabel || 'Personalizáveis'}`), permission: 'avulsos' },";

// Remove the line
content = content.replace(/.*path: '\/admin\/avulsos'.*\n/, '');

// Add to producao, right before custom-products
const target = "{ path: '/admin/custom-products',";
content = content.replace(target, `        ${correctedItem}\n        ${target}`);

fs.writeFileSync('src/admin/AdminApp.tsx', content);

let settingsContent = fs.readFileSync('src/admin/views/Settings.tsx', 'utf-8');

const sItemToMove = "{ key: '/admin/avulsos', defaultLabel: `Atendimento 'Atendimento & Avulsos' ${settings?.posCustomItemLabel || 'Personalizáveis'}`, path: '/admin/avulsos' },";
const sCorrectedItem = "{ key: '/admin/avulsos', defaultLabel: `Atendimento & ${settings?.posCustomItemLabel || 'Personalizáveis'}`, path: '/admin/avulsos' },";

settingsContent = settingsContent.replace(/.*key: '\/admin\/avulsos'.*\n/, '');
const sTarget = "{ key: '/admin/custom-products',";
settingsContent = settingsContent.replace(sTarget, `                    ${sCorrectedItem}\n                    ${sTarget}`);

fs.writeFileSync('src/admin/views/Settings.tsx', settingsContent);
