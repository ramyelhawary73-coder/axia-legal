const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(
  'import { mockMatters } from "@/lib/mock-legal-data";\n',
  ''
);

content = content.replace(
  /let subContext.*?\}/s,
  ''
);

content = content.replace(
  '<AppShell activeTab={activeTab} onNavigate={(tab) => { setActiveTab(tab); setSelectedMatterId(null); }} subContext={subContext} onClearSubContext={() => setSelectedMatterId(null)}>',
  '<AppShell activeTab={activeTab} onNavigate={setActiveTab}>'
);

fs.writeFileSync('src/app/page.tsx', content, 'utf8');
