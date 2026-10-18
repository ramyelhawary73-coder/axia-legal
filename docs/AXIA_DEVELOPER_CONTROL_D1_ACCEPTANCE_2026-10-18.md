# AXIA Developer Control D1 — Isolated Foundation Acceptance

Date: 2026-10-18. Baseline: `main` at `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`.
Branch: `feat/axia-developer-control-foundation`.

The owner approved D1 according to [review PR #45](https://github.com/ramyelhawary73-coder/axia-legal/pull/45). That review's two documentation files are included here; do not merge the review branch separately as another implementation. D1 is application/source preparation and disposable tests only. No hosted SQL, role grant, account creation, email, Auth/provider configuration, Secrets/SMTP, membership removal, Merge or Production deployment is included.

## Implemented behavior

- `/platform` provides a separate destination for platform administration. The page checks the server context and the client revalidates it on entry/after MFA. Every data/MFA endpoint independently repeats fresh identity and database authorization checks; browser state/link visibility is never authority.
- The console reads only a paginated office registry (`id`, `name`, `slug`, `createdAt`) and a bounded platform audit projection. It has no role grants, office/member mutations, legal-data access, mail or Auth-user management commands.
- `resolvePlatformContext()` requires the reviewed server switch/origin and real public configuration before constructing a client, then fresh `getUser()` and a versioned RPC. The RPC's own user UUID must match that verified identity. No mock fallback or email/user_metadata/client-header privilege exists.
- A root without an office membership can reach this console in disposable tests. All existing office APIs, case ACL and tenant RLS helpers remain unchanged. Current developer office membership remains live and unchanged.
- App MFA enrollment is an explicit button; verification accepts a six-digit code for that user's own TOTP factor. The SSR client shares the existing login cookie session and writes upgraded cookies in the route handler. Before returning success, both fresh user identity and the ready database context must still match. No Auth token/session/seed field is returned to the browser; the enrollment QR necessarily contains its private seed and is returned only to the gated same-origin account flow.
- MFA/authorization responses are private/no-store, no-referrer, noindex and non-embeddable. MFA POST requires the configured HTTPS Origin and a bounded 4096-byte JSON stream. Existing verified/pending factors are not deleted/replaced; a lost pending enrollment needs operator recovery review.
- UI stores the QR/factor/code only in transient component memory; clears the code on submission and QR after verification, and does not persist them. CI screenshots are taken before enrollment, never while a QR is displayed. Wrong-code, forbidden, missing-schema and disabled states are explicit.
- The platform API prefix gets existing JSON-handler behavior in Proxy; `/platform` remains protected. Existing login actions, SSR client, legacy browser client, memberships, dependencies, Android source and old migration files are unchanged.

## New migration source — not applied

File: `supabase/migrations/20261018173401_axia_platform_owner_foundation.sql`.
Generated with temporary Supabase CLI `2.121.0` using `migration new`; no dependency/lockfile change.

SHA256: `2f9a60b32b3ad1f29956953d9c06a68859742f40840bf208d08c1e107f657ce8`.

- Adds `private.platform_principals` and `private.platform_audit_events` with RLS enabled/forced and no direct PUBLIC/anon/authenticated table privileges. One active root is permitted; the role is separate from the office role enum. No principal row is seeded.
- Active principal insertion requires a confirmed, non-anonymous, non-banned existing UUID. Identity/history rewriting, principal deletion/truncation and audit update/delete/truncation are rejected. Role state changes append their audit automatically; operator bootstrap has `actorType=operator`, a null actor UUID and the subject UUID, rather than pretending the target user performed the operator action.
- Privileged helpers stay in `private` with empty search paths and explicit execution ACLs. Public RPC wrappers are SECURITY INVOKER. Direct private read calls enforce the same authorization and a fixed allowlist of query kinds.
- Each privileged read requires a current enabled principal, confirmed/non-banned user, a real non-expired session belonging to that UUID, both JWT/server session `aal2` and the current verified TOTP factor linked to that session. Missing/malformed/foreign/deleted sessions and stale factor/role claims deny access. No paid-plan session feature is required.
- A share lock on the principal serializes a permitted read against revocation until that transaction ends. This package adds no legal/business write command. Native tests cover concurrent read/revocation and competing operator bootstrap.
- Successful registry/audit reads append immutable audit with a 120-read/minute bound per actor. Context checks do not create polling audit. Denied SQL transactions cannot persist their own rolled-back audit inserts; API denial logging contains fixed codes only, never credentials, office names, QR/code or legal values.
- No existing public table, tenant helper/policy, old migration, staff invitation RPC or task trigger is changed. Private schema exposure must be checked again before live activation; schema naming alone is not an access boundary.

## Configuration kept disabled

| Server setting | D1 default | Gate for a future activation |
| --- | --- | --- |
| `AXIA_PLATFORM_CONTROL_ENABLED` | `0` / absent | Explicit approved environment/branch activation |
| `AXIA_PLATFORM_CONTROL_ORIGIN` | empty | Exact reviewed HTTPS origin, no credentials/path/query/fragment |

No hosted values were changed. A prepared Preview intentionally shows the disabled page and APIs return 503. Enabling a flag alone cannot assign a principal. Hosted schema activation and a reviewed operator bootstrap remain separate approvals. The staff signup flags also remain off.

## Verification and limits

Local passes:

- Typecheck, Lint, application suite (147 tests after the platform Proxy regression case).
- Production Build with all 15 required compiled routes. An old generated Turbopack persistence cache initially failed to open; it was archived and a clean Build passed. Source/data were not repaired or replaced.
- 21 platform PGlite checks on disposable PostgreSQL 17.5: zero initial principals, confirmed-identity bootstrap guards, uniqueness/idempotency, metadata/role spoof denial, direct grants, MFA/session changes, tenant boundaries, pagination, audit, rate bound and object/data preservation.
- 82 browser checks at 1440/390/320px light/dark, including the no-office developer entry, registry/audit, explicit enrollment, wrong-code then successful verification, disabled/forbidden/missing states, no persistent MFA material and no horizontal overflow. Mobile screenshots were inspected.
- 7 actual compiled HTTP safety checks: existing default-off registration/callback plus all four platform GET endpoints and default-off MFA POST. These make no provider/Auth mutation calls. The runner removes hosted public configuration and forces activation off on loopback.

CI retains existing 19 staff PGlite and 22 staff native PostgreSQL checks, and adds this platform suite on both runtimes. The native platform run targets 23 checks including two real multi-session races in its own loopback test database. Exact final-head CI, native results and Vercel readiness must be read from the implementation PR; they are not assumed from local PGlite or a previous head.

The SQL tenant fixture is representative, not a recreation of every live case/Storage policy. It fingerprints its pre-existing policies/grants/helper/memberships around the migration. The real tenant source files are unchanged; live RLS/Auth/MFA/cookie acceptance is not established by synthetic tests. Browser API fixtures and SDK-stub tests never enroll a real factor, create a hosted account or validate real cross-device MFA. Live PostgreSQL was 17.6; CI native is a separate 17.x runtime.

Vercel team-scoped API inspection previously returned 403; exact-commit GitHub Vercel status/Preview can confirm deployment readiness, not live configuration or privileged runtime acceptance. No production-ready/first-client delivery claim follows from D1 alone.

## D2 review before any live action

1. Re-read latest main, final PR head, exact CI/Preview and this migration hash. Inspect hosted Data API exposure and object/data fingerprint differences read-only. Prove usable recovery, not just comparison hashes.
2. Present an explicit plan for applying this **new migration only** to shared project `qshgczulivsxztgrbqew`; do not blanket push or replay history. The staff migration is already live as `20261016083929` and must not run again.
3. Prepare a one-time operator bootstrap for the privately verified developer UUID; assert confirmation/identity, current root state and idempotency. The source migration seeds nobody. No email-based runtime grant or browser bootstrap endpoint. The database trigger records bootstrap audit automatically; do not duplicate it with a fabricated user actor.
4. With separate approval, enable only the intended Preview switch/origin, complete the user's own private app TOTP flow, and prove real cookie upgrade, protected reads, revocation and recovery without exposing QR/seed in chat/logs/screenshots. No global Auth/SMTP setting change is implicit.
5. Keep the current office owner membership until the separate D3 ownership handoff proves a real replacement Office Owner and task/case access. A fictitious test employee is not that replacement. Real accounts/mail/test-office writes, Merge and Production deployment remain separately approved actions.
