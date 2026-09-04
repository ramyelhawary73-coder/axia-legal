# AXIA Legal

**AXIA Legal — Egyptian Legal Practice & Intelligence OS**  
Powered by **ASIA AURA** · Legal copilot: **RAJIH AI — راجح**

## Current phase

Phase 1A is the application foundation only.

Included:
- Next.js + React + TypeScript
- Arabic-first RTL shell, English-ready information architecture
- Tailwind CSS foundation
- AXIA navigation and placeholder legal-workspace dashboard
- safe browser-side Supabase client factory using publishable configuration only
- CI for typecheck, lint, and production build
- architecture and security-boundary documentation

Explicitly not included in Phase 1A:
- database migrations or tables
- RLS or Auth policy changes
- storage buckets
- real client/case data
- RAJIH AI provider integration
- service-role keys or secrets

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

The foundation UI builds without Supabase environment values. Supabase configuration is required only when an approved feature actually invokes the client factory.

## Quality gate

```bash
npm run check
```

## Delivery policy

Feature work must be implemented on a dedicated branch, verified in CI and Vercel Preview, reviewed, and explicitly approved before merge to `main`.
