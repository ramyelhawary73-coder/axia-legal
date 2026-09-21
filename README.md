# AXIA Legal

**AXIA Legal — Egyptian Legal Practice & Intelligence OS**  
Powered by **ASIA AURA** · Legal copilot: **RAJIH AI — راجح**

## Canonical project status

The live project state, completed phases, planned roadmap, audit findings, risk register, architectural decisions, owner requirements, and exact next action are maintained in:

**[`docs/AXIA_MASTER_ROADMAP.md`](docs/AXIA_MASTER_ROADMAP.md)**

> The Master Roadmap is the authoritative handoff for continuing AXIA work. Always verify the latest `main` first, then read the roadmap before starting a new implementation phase.

This README is intentionally not used as a phase-by-phase status tracker.

## Technical foundation

AXIA currently uses:

- Next.js + React + TypeScript
- Arabic-first RTL product shell
- Supabase Auth / PostgreSQL / RLS / Storage
- Vercel deployment
- GitHub CI
- RAJIH AI legal copilot architecture

For current implementation maturity and known gaps, use the Master Roadmap rather than this summary.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Never commit secrets or Service Role credentials.

## Quality gate

```bash
npm run check
```

Feature work may require additional RLS, safety, integration, Preview, and workflow verification beyond the base check.

## Delivery policy

Feature work must be implemented on a dedicated branch, verified in CI and Vercel Preview where applicable, reviewed, and explicitly approved before merge to `main`.

Every implementation PR must also update `docs/AXIA_MASTER_ROADMAP.md` when it changes project state, architecture, risks, phase status, or the next action.
