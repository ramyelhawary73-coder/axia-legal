# AXIA Developer Separation D4 — app entry and reviewed test reset

Date: 2026-10-21. Baseline: PR #48 `31147d2c3699a33044484e041bdb63590eeb51ff`. Same independent branch `feat/axia-control-center-client-readiness`; main remains `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`.

## Owner objective and recommendation

Keep the existing verified developer identity as Platform Owner only, separate from office ownership; use one controlled test owner and one active synthetic office. Preserve protected support/export access and audit. Finish cloud SaaS delivery first; local installation and full offline synchronization are subsequent architecture packages, not current capabilities.

The owner requested identity separation, a new test account and removal of trial data. This package implements reviewable app-entry preparation and inventories the concrete data/reset boundary. It does not execute a live destructive or account operation while the new mailbox/confirmed identity and owner handoff are unresolved.

## Fresh read-only result — 11:00 Cairo / 08:00 UTC

See [aggregate evidence](evidence/axia-developer-separation-preflight-2026-10-21.json). The intended confirmed developer already has one enabled Platform Owner principal and one verified MFA factor. It also holds the sole owner membership of `RAJIH Demo Firm A`. There are two Auth users, two offices and no confirmed unassigned user suitable for the existing create-office action. All public tables have RLS; migration history remains 24/latest `20261020054338`.

| Current office | Members / owners | Clients | Matters | Tasks | Matter links | Business audit | Office control events |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RAJIH Demo Firm A | 1 / 1, developer owns it | 1 | 1 | 1 | 1 | 3 | 9 |
| RAJIH Demo Firm B | 1 / 1 | 1 | 1 | 0 | 1 | 0 | 1 |

No hearings, finance records, documents/files, parties/powers, invitations, durable drafts/history or RAJIH action requests were found in these offices. Total control events were 20 at the first snapshot; read requests can add later events. No customer record contents, other users' addresses, credentials, sessions or factor material are included in this evidence.

Live foreign keys from `private.control_events` retain organization references; its immutable trigger rejects deletion. Do not disable these constraints/triggers, truncate audit, cascade across unknown tables or delete Auth users to obtain a blank screen. The other existing account has not been identified/approved as an account-deletion target.

GitHub/main/PR were freshly inspected. Vercel still denies this connection's target-team grant with 403; the CLI is unavailable. Branch Preview configuration is owner-observed from the earlier package. Hosted private browser/session acceptance remains open.

## Source implementation — navigation, no role or permission change

- `/` is a server entry that uses the existing fresh `resolvePlatformContext(true)` check. A verified Platform Owner goes directly to `/platform`, including its MFA-required entry. No email allowlist, user metadata, browser claim or office membership grants platform access.
- The existing entire client workspace is preserved byte-for-byte in `src/components/office-workspace.tsx`. An explicit `/?workspace=1` opens only the current user's existing office workspace. It accepts no foreign office ID, changes no role and leaves tenant/case APIs and RLS authoritative.
- Platform header offers the office link only after a successful own-workspace resolution. An absent/suspended/unavailable workspace hides the link; it does not prevent platform rendering. Existing logout is available as an explicit form action so the owner can switch accounts normally.
- Login credentials, password hashing/session implementation, Auth settings/providers, principal/MFA records, RLS, SQL, Storage and Android are unchanged. No live identity or membership was modified. The source is on Preview, not released on main.

## Concrete next reset proposal — not executed

Prefer reusing office A as the fresh demo rather than deleting organization identities referenced by immutable audit. Name it `AXIA Demo Office` after the reviewed handoff; keep office B suspended as historical metadata. The result is one active test workspace, with developer administration independent of office membership.

1. Owner supplies one real mailbox they control and can open. Creating an application account does not create a Gmail mailbox. Do not invent an address or use `example.invalid` for hosted signup. The owner privately chooses a unique password; do not store or reuse the password disclosed in chat.
2. Prepare the exact account creation/confirmation/email scope against actual Auth/sender settings. No normal hosted-signup dry run: signup may create an account and send real mail. Owner enters credentials privately. Do not write Auth tables/password hashes, auto-confirm a fictitious identity or use Service Role.
3. Verify actual developer `/platform` MFA/session access on the configured Preview and verify the new test identity is confirmed, non-anonymous and unassigned. Lock/recheck the exact identities and affected office before a transfer. Preserve the active developer principal, factors and sessions.
4. Prepare/test one bounded audited operator handoff for A: insert the new valid office owner, verify it, then remove only the developer's office membership. Public control actions intentionally protect developer identities and the last owner; do not weaken those guards. The handoff needs an explicit operator transaction with drift checks and rollback on failed ownership/audit postconditions, not a new general bypass RPC. No office may be left active without a valid owner.
5. Review exact row IDs and fingerprints immediately before reset. The current candidate business scope is **two clients, two matters, one task and two matter-member links** in A/B only. This is an inventory, not evidence that unknown future rows are disposable. Refuse any new/unlisted dependent record, file, draft or invitation. Keep **three business audit rows, all control/platform audit and all legal knowledge/source data**. No organization/Auth/profile deletion or migration-history change. Agree the permanent-reset list with the owner before execution; do not interpret “all trials” as all database tables.
6. Separately review suspension of B and the one explicit configuration for A. Retain B's historical identity/ownership; its existing account is not silently banned or deleted. A new operator record must describe any approved transfer/reset; preserving old audit means keeping its actual history, not rewriting actors to the new owner. No live cleanup SQL has been generated or executed by D4.
7. Seed the reviewed fresh demo using the normal tenant APIs with the test identity: one explicitly fictional client, one case, two tasks, one future synthetic hearing and one draft. Verify ownership, case access, reassignment and isolation; add a listed small fake file only as part of Storage/backup acceptance. Send no customer notifications or real legal documents. Keep test IDs distinct from legal corpus data.

Selecting the mailbox is the first missing input. It makes account/confirmation scope concrete; it is not authorization to send messages, mutate memberships, delete data, merge or release unreviewed changes. No second cloud project is required.

## Developer access and backups

Current code provides reasoned 15-minute support reads and guarded per-office exports with fresh Platform Owner/MFA/session checks and audit. It does not log in as the client's identity or grant permanent memberships to every office. Keep support visibly attributable to the developer; do not add hidden impersonation.

Encrypted office snapshots cover 17 fixed tenant datasets plus listed file bytes, with completeness/hash checks and bounded limits: 10,000 rows, 3 MB database JSON, 200 files and 64 MB file bytes. Exports fail instead of silently truncating. This is not an unlimited enterprise archive or usable hosted restore service. Actual hosted file download, encrypted recovery and restore-service acceptance remain H2 work; successful CI fixtures are not customer recovery proof. Retention, authorized purpose and access to customer copies must be agreed with each office before operating real customer backups. Never include Auth passwords, MFA material or invitation token hashes.

## SaaS / local / offline delivery decision

| Mode | Current evidence | Delivery decision |
| --- | --- | --- |
| Cloud SaaS | Next.js/Vercel with shared Supabase and tenant guards | Primary first-client delivery after H1/H2/E1/C1 acceptance |
| Local development | Source build/test workspace only | Does not establish a supported customer installation or local database recovery |
| Customer local installation | No tested installer, local Auth/Storage stack, update/recovery policy or device sizing | Later isolated package with controlled data import; do not point it at hosted data as an offline substitute |
| Full offline/hybrid | No tested durable sync queue, conflict handling, encrypted device data, revoked-access enforcement or multi-device reconciliation | Later explicit architecture scope; localStorage/browser cache is not an authoritative legal database |

Priorities: D4 source CI/Preview → controlled identity/password setup → actual signed-in Preview → reviewed owner handoff/reset → synthetic office/employee/Storage/recovery walkthrough → first-client release review. Scheduled/chunked backups, payment automation, broad new modules, local/offline and more autonomous RAJIH actions remain deferred.

## Validation and unchanged boundaries

Local Typecheck, strict Lint, 168 application tests and Build/17 routes pass. Four new server-component behavior tests exercise real existing context guards for owner/MFA-required routing, denied/unconfigured/unconfirmed/provider-error states, display-only office navigation and conditional office-link/logout behavior. Earlier workspace tests follow the preserved component; their assertions are retained. Browser fixtures additionally check the absent office link and explicit logout at desktop/mobile/light/dark sizes. Exact-head CI/Preview and visual evidence are recorded on PR #48.

No live SQL/write, role/membership grant/removal, Auth account/password/setting change, data/file deletion, Secret/SMTP edit, email, Merge or Production deployment. No Service Role, new production dependency, second project or migration replay. Tests are isolated; the disclosed password is not saved in artifacts or source.
