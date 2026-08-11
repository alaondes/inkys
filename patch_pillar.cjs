const fs = require('fs');
let content = fs.readFileSync('src/admin/AdminApp.tsx', 'utf-8');

const target = `      items: [
        { path: '/admin', icon: LayoutDashboard, label: getLabel('/admin', 'Painel & Resumo'), permission: 'overview' },
        { path: '/admin/financial', icon: DollarSign, label: getLabel('/admin/financial', 'Fluxo de Caixa'), permission: 'financial' },
        { path: '/admin/accounting', icon: BookOpen, label: getLabel('/admin/accounting', 'Contabilidade & DRE'), permission: 'accounting' },
        { path: '/admin/documents', icon: FileText, label: getLabel('/admin/documents', 'Notas & Documentos (NFe)'), permission: 'documents' },
      ]
    }`;

const replacement = target + `,
    {
      id: 'configuracoes',
      title: getLabel('configuracoes', 'Configurações'),
      icon: Settings,
      color: 'text-slate-600 bg-slate-50 border-slate-200',
      activeBorder: 'border-slate-600',
      items: [
        { path: '/admin/settings?tab=loja', icon: Store, label: getLabel('/admin/settings?tab=loja', 'Loja & Marca'), permission: 'settings' },
        { path: '/admin/settings?tab=vitrine', icon: LayoutTemplate, label: getLabel('/admin/settings?tab=vitrine', 'Aparência'), permission: 'settings' },
        { path: '/admin/settings?tab=banners', icon: ImageIcon, label: getLabel('/admin/settings?tab=banners', 'Banners (Carrossel)'), permission: 'settings' },
        { path: '/admin/settings?tab=menu', icon: Type, label: getLabel('/admin/settings?tab=menu', 'Personalizar Menus'), permission: 'settings' },
        { path: '/admin/settings?tab=seguranca', icon: Shield, label: getLabel('/admin/settings?tab=seguranca', 'Segurança'), permission: 'settings' },
        { path: '/admin/settings?tab=footer', icon: LayoutPanelTop, label: getLabel('/admin/settings?tab=footer', 'Rodapé'), permission: 'settings' },
      ]
    }`;

content = content.replace(target, replacement);

// Also remove the old standalone settings link block
const standaloneLinkRegex = /\{\s*userPermissions\?\.settings && \(\s*<div className="mt-2">\s*<Link\s*to="\/admin\/settings"[\s\S]*?<\/Link>\s*<\/div>\s*\)\s*\}/g;
content = content.replace(standaloneLinkRegex, '');

fs.writeFileSync('src/admin/AdminApp.tsx', content);
