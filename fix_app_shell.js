const fs = require('fs');

const file = 'src/components/app-shell.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  { regex: /text-white/g, replacement: 'text-[var(--text)]' },
  { regex: /text-slate-200/g, replacement: 'text-[var(--text)]' },
  { regex: /text-slate-300/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /text-slate-400/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /text-slate-500/g, replacement: 'text-[var(--text-muted)]' },
  { regex: /bg-\[\#0d1726\]/g, replacement: 'bg-[var(--panel)]' },
  { regex: /bg-\[\#111e33\]/g, replacement: 'bg-[var(--accent-hover)]' },
  { regex: /bg-\[\#0B1120\]/g, replacement: 'bg-[var(--bg)]' },
  { regex: /bg-black\/30/g, replacement: 'bg-[var(--accent)]' },
  { regex: /bg-black\/25/g, replacement: 'bg-[var(--accent)]' },
  { regex: /bg-black\/20/g, replacement: 'bg-[var(--accent)]' },
  { regex: /bg-black\/40/g, replacement: 'bg-[var(--accent)]' },
  { regex: /bg-white\/5/g, replacement: 'bg-[var(--accent)]' },
  { regex: /bg-white\/10/g, replacement: 'bg-[var(--accent-hover)]' },
  { regex: /bg-white\/20/g, replacement: 'bg-[var(--accent-hover)]' },
  { regex: /border-white\/5/g, replacement: 'border-[var(--border)]' },
  { regex: /border-white\/10/g, replacement: 'border-[var(--border)]' },
  { regex: /border-white\/20/g, replacement: 'border-[var(--border-strong)]' },
  { regex: /border-slate-800/g, replacement: 'border-[var(--border)]' },
  { regex: /bg-slate-900\/50/g, replacement: 'bg-[var(--panel-glass)]' },
  { regex: /bg-slate-900/g, replacement: 'bg-[var(--panel)]' },
];

let originalContent = content;
for (const { regex, replacement } of replacements) {
  content = content.replace(regex, replacement);
}

if (content !== originalContent) {
  fs.writeFileSync(file, content, 'utf8');
  console.log(`Updated: ${file}`);
} else {
  console.log('No changes needed.');
}
