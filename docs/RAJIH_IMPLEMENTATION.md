# RAJIH implementation status

## Current milestone

This branch establishes the first safe foundation for RAJIH. The agent is treated as a legal research assistant and never as a substitute for a qualified lawyer. The server endpoint fails closed when there are no approved, published sources; it does not fabricate an answer or fall back to the demo responses.

## Implemented

- A dedicated branch for RAJIH work.
- An independent commit synchronizing `package.json` and `package-lock.json`.
- Supabase migration for organizations, memberships, clients, matters, matter members, documents, audit logs, legal sources, versioned legal knowledge documents, and knowledge chunks.
- RLS policies and helper functions for organization and matter-level access.
- Version, effective-date, approval-status, source-authority, and content-hash fields for legal knowledge.
- Server-side `/api/rajih` endpoint with an explicit abstention response when approved retrieval is unavailable.
- Provider configuration is server-only through `RAJIH_AI_BASE_URL`, `RAJIH_AI_API_KEY`, and `RAJIH_AI_MODEL`.
- The RAJIH UI no longer uses the hard-coded legal answers; it calls the server endpoint and displays returned citations.

## Not yet enabled by design

The retrieval function is intentionally empty until Supabase Auth, RLS, and the approved ingestion workflow are connected to a staging project. This prevents an unscoped search or a public AI answer from being mistaken for a trustworthy legal result.

The next implementation step is to add authenticated server-side Supabase access, an approved-document ingestion job, full-text search, and vector retrieval. Only documents with `published` status should be returned to RAJIH. Matter retrieval must always require both organization membership and matter access.

## Required review before production

- Review and apply the migration in a disposable Supabase staging project.
- Verify RLS with at least two organizations and two matters.
- Configure a provider without exposing its key to browser code.
- Add citation validation, audit events, rate limits, retention rules, and red-team tests.
- Establish a legal editorial process for source approval and supersession.
- Run the complete CI gate with `npm ci` after this lockfile commit.
