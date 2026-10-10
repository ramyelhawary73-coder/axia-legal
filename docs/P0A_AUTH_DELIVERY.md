# P0A — Auth recovery and enterprise Login

Status: **IN_PROGRESS** — branch `fix/axia-p0a-real-auth-20261010`, unmerged.

Verified base: `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c` (2026-10-10).

## Problem and behavior

The previous public Login waited and navigated to `/dashboard` without authenticating; registration also claimed success without provisioning an account. Missing Supabase public config selected a shared in-memory mock client and bypassed the proxy outside Production.

Login now submits email/password to the existing Supabase SSR Server Action. Only a returned user and session allow a same-origin redirect. Missing config fails closed on protected routes in every environment; Login renders an explanatory, disabled form. Workspace failures return the existing unavailable code. Public fake registration, fabricated legal demos and unverified success/security claims have been replaced with a focused enterprise Login and an original AXIA vector mark.

No SQL migration, business-record write, membership/role grant, production deployment, dependency upgrade or paid resource is included. Supabase accepted restoration of the existing paused Development project; fresh health was confirmed `ACTIVE_HEALTHY`. Cleanup Batches 1–2 remain closed.

## Evidence

| Check | Result | Limit |
| --- | --- | --- |
| Exact source download | All 136 blobs verified against GitHub blob SHA | Snapshot is from the recorded commit; head must be checked before merge |
| Dependency install | npm 10.9.2 `npm ci --ignore-scripts` passed, 449 packages | Host npm 11.9.0 refused incomplete optional-platform lock entries; lockfile unchanged; CI uses Node 22 |
| Typecheck | PASS | Does not establish live Auth/RLS |
| Lint | PASS, no warnings | Does not establish live Auth/RLS |
| Safety | PASS, 119/119 | 87 existing source contracts + 32 executable isolated auth/workspace fixture tests; fixtures are test-only |
| Production build | PASS | Local compilation, no deployment; missing config intentionally allowed during build but blocked at runtime |
| Desktop/tablet/mobile browser | PASS | Chromium: 1440, 768, 390 and 320 px; no horizontal overflow or JS page errors; unsafe next sanitized; missing-config form disabled; activation notice and password toggle tested; protected root/tasks/RAJIH returned 503 with no-store; configured form called the real Server Action once against a local isolated Auth fixture and rejected wrong credentials without exposing provider text; mobile form precedes hero |
| Exact-head GitHub CI | Pending PR | Must pass on the submitted head |
| Hosted Vercel Preview | BLOCKED until verified | Vercel team access currently returns 403; GitHub statuses may expose deployment evidence |
| Real Auth/login/logout and two-tenant RLS | BLOCKED until verified | Development restored healthy; catalog confirms RLS and private Storage; direct session/isolation behavior and Vercel environment binding remain unverified |
| Production | Unchanged by this branch | Active alias-to-commit and Development/Production separation still require correct team access |

## Live Development reconciliation

The existing project was restored and confirmed healthy. Read-only catalog checks found 21 public tables, all RLS enabled, 45 policies, private legal-document Storage, and both private membership helpers with an empty search path. The live migration ledger contains 21 entries including the missing-from-source September 4 security foundation; source and live migration timestamps differ for historical RAJIH and the audit foundation. This package does not replay, rename or apply migrations.

Security advisors report [vector in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Review dependency/function references and plan availability before any change. Catalog presence does not replace direct two-tenant negative tests.

## Owner Preview acceptance

Use test accounts and records, never real client information:

1. Open the exact PR Preview URL on desktop and mobile. Check the logo, Arabic/RTL reading, form, focus and absence of horizontal overflow.
2. With a deliberately wrong password, verify a bounded error and no workspace access. No email/password or provider internals should appear in logs/errors.
3. Sign in using a real Development test account. Confirm the requested local destination is restored and cookie session persists on refresh.
4. Sign out; refresh a protected page. Verify it returns to Login. Check expired-session handling.
5. Using two organizations' test accounts, verify each can only read/write its own legal records and download its own documents. A forged organization selector must be denied.
6. For an account with zero organizations or multiple organizations, verify the explicit missing/ambiguous workspace state; there must be no automatic owner/admin grant.
7. Confirm recovery/activation controls explain current limitations and do not claim to send an email or create an organization.

Merge requires exact-head CI, the real Preview checks above and separate owner approval. Production launch remains a separate decision.

## Next package

P0B patches known security advisories with the smallest compatible changes; P0C reconciles live schema/migrations/RLS/Storage and environment separation. Remaining design, legal/admin workflows, RAJIH, operator control, subscriptions, PWA and commercial release follow section 26 of the Master Roadmap.
