const fs = require('fs');
let content = fs.readFileSync('src/admin/views/Settings.tsx', 'utf-8');

// Replace activeTab state with reading from URL
content = content.replace(
  "const [activeTab, setActiveTab] = useState('loja');",
  "const [searchParams, setSearchParams] = useSearchParams();\n  const activeTab = searchParams.get('tab') || 'loja';\n  const setActiveTab = (tab: string) => setSearchParams({ tab });"
);

fs.writeFileSync('src/admin/views/Settings.tsx', content);
