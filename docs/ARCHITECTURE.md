# AXIA Legal — Foundation Architecture

## Product boundary

AXIA Legal is an independent legal-practice product. It must not share database state, migrations, tenant data, or production runtime with the separate general AXIA ERP system.

## Foundation stack

- Next.js App Router
- React + TypeScript strict mode
- Tailwind CSS
- Supabase planned for Postgres/Auth/Storage/RLS
- Vercel for development previews
- GitHub pull-request delivery

## Information architecture

Primary navigation is reserved for:
Overview, Clients, Matters, Hearings & Calendar, Tasks, Documents, Finance, Team, Junior & Trainees, Legal Library, RAJIH AI, Reports, Administration.

## Planned data boundary

Future tenant-owned records must carry organization scope and be protected at the database layer. Matter-sensitive records additionally require matter-level authorization. This phase intentionally creates no schema.

## RAJIH boundary

RAJIH is represented only as a product surface in this phase. No model provider, prompt transport, vector search, or confidential document processing exists yet.
