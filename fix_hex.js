const fs = require('fs');

const files = [
  'src/components/views/tasks-view.tsx',
  'src/components/views/rajih-ai-view.tsx',
  'src/components/views/library-view.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-\[\#1a141b\]\/90/g, 'bg-[var(--accent-hover)]');
  content = content.replace(/from-\[\#0d1726\] via-\[\#152338\] to-\[\#0d1726\]/g, 'from-[var(--panel)] via-[var(--bg)] to-[var(--panel)]');
  content = content.replace(/bg-\[\#111d30\]/g, 'bg-[var(--accent-hover)]');
  content = content.replace(/hover:bg-\[\#101c2e\]/g, 'hover:bg-[var(--accent-hover)]');
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Fixed hex colors');
