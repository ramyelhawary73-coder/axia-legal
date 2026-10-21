# AXIA Control Center D3 — isolated implementation and acceptance

Date: 2026-10-19 source acceptance, updated 2026-10-20. **Later explicitly approved hosted result:** exact source `d26e2da` was applied once as `20261020054338`; [activation report and preservation evidence](AXIA_CONTROL_CENTER_D3_ACTIVATION_2026-10-20.md) are authoritative for current database state. Earlier pre-activation observations below are historical. No office configuration, membership, real account, mail, Secrets, SMTP, Merge or Production application deployment was changed.

## Current source and hosted baseline

- Branch `feat/axia-control-center-client-readiness`, based on PR #46 head `c8c14c08964e5dbbfbba393f54c97a0e37c5d1e5`, which contains current main `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`. Preserve all D1/D2/Android work. The new Draft PR includes #46; do not merge duplicate source PRs independently.
- Read-only hosted check: 23 migration records/latest `20261019080134`, 2 offices, 2 memberships, one active Platform Owner, one verified TOTP, zero legal Storage objects. New controls and durable draft tables are absent. Production and Preview use the same Supabase project; its Development display name is not isolation.
- Earlier D2-B observations of zero factors were historical. At 11:21:50 UTC the user's private enrollment was verified through metadata: one verified own TOTP, a matching valid server `aal2` session and successful actual user registry/audit reads. Dashboard screenshots showed the correct Preview branch redeployed Ready at `c8c14c0`; stable origin stayed unchanged. New-tab session continuity, live revoke/restore and the new control workflows have not been verified on the hosted service. No QR, seed, code or identity UUID belongs in this report.
- Vercel connector team scope remains forbidden. The owner's browser is not connected to this execution context. Anonymous protection redirects do not prove an app failure or authenticated acceptance.

## Implemented boundaries

| Area | Behavior |
| --- | --- |
| Office directory | Paged office selection, metadata, real counts and separate office scope on every request |
| Manual subscription | Status, plan label, expiry, membership/storage limits and RAJIH entitlement; revision conflicts reject stale edits |
| Office membership | Office roles and per-office suspension; keeps Auth accounts/memberships; protects platform identity and the last confirmed active owner |
| New office | Existing confirmed, unbanned, unassigned owner's email only; no Auth account creation or mail |
| Support | Reason required, 15-minute office/session lease, fixed paged legal datasets, immutable actor audit; no permanent tenant membership or write impersonation |
| Durable drafts | Office/case RLS, client/matter binding, immutable save history, compare-and-set revisions, archive without deletion, HTML allowlist at DOM sinks |
| Old drafts | Explicit selection/import only; original browser data retained; tenant/client/case bindings must be reviewed, never silently imported |
| Backup | One MVCC database snapshot across 17 fixed tenant datasets plus every office Storage object, including orphans; all file bytes/hashes verified before encrypted download |
| Recovery verification | Decrypt/verify in browser; typed row/FK and exact file-byte restoration into a newly created empty disposable database, never a hosted restore endpoint |

Platform operations recheck the existing D1 root identity, current own server session, verified TOTP and AAL2. Ordinary cookies and guarded RPCs are used; no Service Role or Auth admin API exists in the new runtime. Direct private table writes are denied. Required audit insertion and mutation commit together. Already issued signed file links remain usable until their short expiry; new support file links last 30 seconds.

Suspension/expiry gates are additional restrictive policies and existing helper guards. The old invitation definers are retained behind non-callable private names with guarded original signatures, because their old bodies read memberships directly. Seat inserts and Storage finalization serialize per office. Storage's rollback-only authorization probe may lack `metadata.size`; deferred commit validation permits that probe to roll back while rejecting committed unknown sizes. Current official uploader/adapter source was inspected; actual hosted Storage HTTP finalization remains a separate activation acceptance gate.

Draft acknowledgements are the only source of a saved status. Pending edits warn on exit, can be downloaded, and stop retrying after conflict. Server save history is distinct from editable editorial checkpoints. Restoring history creates a new save and refreshes the editor state. Simultaneous first saves and existing-revision updates cannot overwrite another office/creator.

## Migration and feature switch

Source: `supabase/migrations/20261019142538_axia_control_center_office_operations.sql`, SHA256 `c8a05cb238e27730a774a6b8962e9e34b20ebe2a6648f73e6943001843e9fbbf`. **Applied once on 2026-10-20 as `20261020054338`; do not replay.** It is one explicit transaction and seeds no controls, root, account or office. Old migrations were not edited, renamed or replayed. The approved shared tenant helper/policy changes are now installed; this is not an additive UI-only activation.

`AXIA_CONTROL_CENTER_ENABLED` defaults off. It gates the new API/UI, durable drafts and application entitlement/status checks. It does **not** undo SQL policies or previously configured office suspension/expiry. D1's separately enabled flag and exact origin remain required for root operations. The existing #46 branch-only Config values will not automatically activate this new branch. Keep the new switch off until the reviewed migration and hosted acceptance are separately authorized.

## Backup and restore limits

- AES-256-GCM, random salt/IV, PBKDF2-SHA256 600,000 rounds and authenticated format/version. Password is used locally and never submitted. Wrong password/tampering fails the entire operation.
- Limits: 10,000 database rows, 3 MB database JSON, 200 files and 64 MB total file bytes. Larger, missing, changed, unknown-size or cross-office content stops export. No silent truncation or partial successful backup. This bounded browser implementation is not a scheduled/chunked enterprise backup service.
- Included: organization, memberships, current member profiles, clients, cases, case members, tasks, hearings, finances, documents, parties, powers of attorney, tenant audit, redacted invitations, RAJIH proposals, drafts/history and file bytes. Global legal knowledge is shared reference data, not office ownership. Auth passwords, sessions, MFA, private platform authority and invitation token hashes are excluded.
- Recovery verifier creates disabled local FK placeholders only, never real usable accounts. Pending invitations are revoked with fresh random hashes; actionable RAJIH proposals are quarantined. It restores file bytes into isolated staging tables and checks their hashes, **not through hosted Supabase Storage HTTP**. No real customer backup/restore, full Supabase service recovery, offsite schedule, RPO/RTO or disaster recovery drill is claimed.
- Browser verification proves artifact integrity; it is not permission to overwrite a current office. Future actual restore must reconcile real identities and restore into an isolated target before any approved replacement.

## Verification evidence

Local: Typecheck, strict Lint, 164 application tests and Next.js production Build pass; all 17 required routes exist. New SQL suite: 27 checks passed in disposable local PGlite (installed tooling version differs from CI). Coverage includes root/MFA denial, revocation, tenant/case isolation, last-owner protection, status gates, legacy invitation guards, quotas/probes, draft history/conflicts, audit rollback and encrypted typed recovery.

Local compiled browser verification passed **145 UI checks**, widths 320/390/768/1024/1440, light/dark, with zero document horizontal overflow. Initial-source [CI 39290697289](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39290697289) passed on `e651ed8`: 164 app tests, 19 staff + 21 platform + 19 operator + 27 D3 PGlite checks; 22 + 23 + 19 + 31 native PostgreSQL checks; Typecheck/Lint/Build/17 routes and 145 UI checks. Native PostgreSQL was 17.11, CI PGlite 17.5, hosted 17.6; these environments differ. The final follow-up additionally rejects ambiguous owner emails and prevents configured-but-unavailable durable mode from falling back to local data; its exact-head CI is tracked on [Draft PR #48](https://github.com/ramyelhawary73-coder/axia-legal/pull/48).

CI runs the complete existing suites plus D3 in pinned PGlite and native PostgreSQL 17. Native-only checks race configuration, existing draft saves, first saves and competing owner demotions. Browser tests use real compiled components with synthetic HTTP responses on loopback only, covering switch isolation, protected identity, support, actual WebCrypto download/decrypt, drafts/history/XSS and conflict retention, plus nine real compiled HTTP disabled-state checks. Their fixtures do not prove hosted Auth/Storage/customer acceptance.

[New branch Preview](https://axia-legal-git-feat-axia-d1c7df-ramyelhawary73-coders-projects.vercel.app/platform). Vercel reported initial source Ready on deployment `3r4VXRqPuBqNKnnRXX1tFUB7Pkpg`; exact-head deployment status is on #48. It remains protected and the new controls default off; the database migration is now installed but no new branch Config activation occurred. Initial implementation contained 54 PR files/26 D3 files; later documentation records activation. Android and all three approved migration source files are unchanged.

## Next activation and first-client scope

1. **Completed 2026-10-20:** exact-source CI/hash/prerequisites reviewed, explicit approval received, and the one shared-project transaction applied once as `20261020054338`. Do not repeat it or alter old history.
2. **Database comparison completed:** all existing public rows/security/history, memberships and selected Auth/Storage metadata preserved; new RLS/grants/guards checked and controls remain empty. Actual Storage preflight/finalization/quota testing with authorized synthetic files remains open before setting a paying office limit.
3. Configure only a reviewed branch Preview origin and switches with separate scope; reuse the developer's already enrolled private authenticator. Verify current root `aal2`, normal office login, suspension/reactivation/expiry, support isolation, save conflicts, and a real encrypted export plus isolated service restore. No automatic Production promotion.
4. Choose an owner-controlled test employee mailbox and fictitious office data. Review Supabase Auth signup/confirmation/redirect/rate-limit/email configuration read-only. Then separately authorize account creation and actual transactional mail. Prove invitation → signup → confirmation → acceptance → tasks/case access, including expired/reissued/cancelled invites, before enabling first-client staff registration. No blanket SMTP change or real mail is included here.
5. Keep the current sole office owner membership. A separate verified replacement owner and office workflow must exist before any removal. Manual subscription administration is implemented; payment collection/provider integration and recurring backups are future packages.

The client is not yet ready for unrestricted commercial handoff: hosted D3 activation, real employee onboarding/mail, Storage recovery acceptance and full authenticated business acceptance remain open.
