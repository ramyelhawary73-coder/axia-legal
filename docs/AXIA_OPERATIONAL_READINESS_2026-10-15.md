# AXIA operational readiness — 2026-10-15

Historical source-package report for PR #40. Current combined verification and activation gate: [Integration acceptance](AXIA_STAFF_ACTIVATION_ACCEPTANCE_2026-10-15.md).

Baseline: `main` at `dfb557f2741ca521b13fd727abeb0f2c25803fd5` after owner-approved PR #39. Working branch: `feat/axia-operational-readiness-20261015`.

**Decision: not yet ready for real client onboarding.** This package fixes two misleading workflows and records the concrete delivery gates. It does not complete employee onboarding, full backups, or production isolation.

## Live read-only evidence

Supabase project `qshgczulivsxztgrbqew` is named **AXIA Legal Development** and reports `ACTIVE_HEALTHY`. No schema, data, policies, Auth settings, grants, secrets, or deployment configuration were changed during this audit.

| Check | Observed result | Limit |
|---|---|---|
| Public schema | 21 tables with RLS enabled | FORCE RLS is enabled on profiles, organizations, organization_members; not all tables |
| Exact counts | 2 Auth users, 2 organizations, 2 memberships, 2 clients, 2 matters, 1 task, 0 document metadata rows | Aggregate counts only; both memberships are owners |
| Tenant SELECT isolation | For each existing owner: 1 visible organization and 0 other-tenant organizations/clients/matters/tasks | Read-only transactions with transaction-local authenticated claims, rolled back; not real login or write tests |
| Legal corpus | 1 published, non-test document with reviewer and review timestamp | Does not establish legal accuracy, breadth, or currency |
| Document storage | Private `legal-documents` bucket, 25 MiB limit, allowed document/image MIME types | Upload/download and cross-tenant Storage flows not exercised in this audit |
| Business auditing | Six audit triggers: clients, matters, hearings, tasks, financial_records, documents | Documents INSERT only; other five INSERT/UPDATE; not full lifecycle auditing |
| Migration history | 21 live records versus 19 repository migration files, including historical timestamp differences | Reconcile explicitly; do not replay, reset, or rename history blindly |
| Security advisor | 0 ERROR, 2 WARN: vector extension in public; leaked-password protection disabled | No remediation applied |
| Performance advisor | 6 unindexed foreign keys INFO, 6 RLS initplan WARN, 53 unused-index INFO | No index or policy changes justified by counts alone |
| Deployment | Main CI run 38697796918 and GitHub Vercel status succeeded; current public login inspected | Direct Vercel project scope returned 403; runtime configuration and Production/Development database boundary unverified |

Advisor references: [extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Changes in this package

- Daily snapshots wait for successfully loaded matter/task data. A loading or failed request cannot export an empty startup snapshot as today's completed export.
- Removed simulated cloud success and local-vault writes presented as remote storage. Unsupported explicit cloud destinations fail before recording success. Legacy cloud-only preferences fall back to local download without treating the old simulated export as today's local export. Raw legacy vault data is retained.
- UI describes a partial, unencrypted local export and a browser download request, not a complete backup or confirmed disk save. It removes invented firm credentials and financial totals. CSV cells escape quotes and neutralize formula prefixes; the consistency marker includes exported content and is explicitly noncryptographic.
- Legal Library loads actual published, non-test, reviewed metadata through the existing authenticated workspace resolver and RLS. It has loading/error/empty/retry states, HTTPS-only source links, a 100-item limit, and no sample legal principles or fake successful fallback. Private storage paths/chunks are not returned.
- Team copy explains that email invitations are being prepared; corrected member initials splitting. No invitation button or capability is falsely enabled.

Existing local snapshot history/preferences are browser-wide, and browser-local editor drafts remain. Snapshots exclude closed matters, completed tasks, clients, document files, financial records and settings. They cannot be used as a complete restore plan. A real tenant-scoped backup/restore flow and persisted legal drafts require separate implementation.

## Staff email onboarding — implementation proposal

The current Team API is GET-only; invite/change-role/remove capabilities are false. There is no invitation table or membership mutation endpoint. Task creation currently assigns `workspace.userId`. An email list by itself must not grant access.

### Data and authorization contract

Proposed new `staff_invitations` records: organization ID, normalized recipient email, requested role, token hash, status, expiry, creator, acceptance identity/time, creation/update timestamps. The raw invitation token is never stored in the database, logs, analytics, or audit payloads. Pending duplicates are prevented per organization/email; resend rotates the token and invalidates the previous link. Expired/revoked links fail closed.

The owner may invite admin/lawyer/staff/trainee/viewer. Admins may invite only lawyer/staff/trainee/viewer. Inviting an owner, promoting an existing member, and transferring ownership are excluded. Lower roles cannot create invitations. These checks must run in the database transaction as well as the API, using current membership rather than cached JWT roles or user-editable metadata.

Acceptance requires an authenticated user with a confirmed Auth email matching the invitation. Membership is bound to the verified `auth.users.id`; email is used for invitation matching, never as an authorization key. Acceptance locks and consumes a valid invitation and creates membership atomically and idempotently. It must not overwrite an existing role, join another organization implicitly, or expose other tenants' invitations. Confirmation/acceptance redirects must be allowlisted, and login state must survive the flow safely. Query strings containing invitation tokens must not enter third-party telemetry or referrers.

Use a user-JWT-scoped application flow and narrowly authorized, fixed-search-path database functions with explicit execution grants and checked authorization. No Service Role in ordinary application paths. A custom invitation does not create an Auth user: new recipients still need a separately approved verified sign-up/confirmation flow. Do not assume the Auth Admin invite API can run with the publishable key.

### Delivery sequence and acceptance tests

1. **Development invitation foundation:** reconcile migration baseline; prepare reviewed additive migration/RLS/RPC, role matrix and rollback plan. Apply only after explicit DB/Auth/RLS approval. Test owner/admin/lower-role permissions, wrong tenant/email, expired/revoked/replayed links, duplicate acceptance, concurrent acceptance, and an inviter whose role was revoked after invitation creation.
2. **Invitation UI and acceptance:** create/list/revoke/resend with honest pending/sent/accepted states and rate limits. Add workspace selection before accepting a second organization. Check confirmed-email flow using controlled test accounts. Never request employee passwords.
3. **Email delivery:** verify sender domain and SPF/DKIM/DMARC, sender/provider connection, approved redirect URLs, expiry, delivery/error handling and bounce suppression. Send a test only after explicit recipient/send approval. Email contains office, role, expiry and acceptance action, without client/case data. Provider or SMTP settings/secrets require separate approval; none were inspected or changed here.
4. **Task allocation:** select active members of the current office and persist `assigned_to` as their user ID. Recheck membership, matter access and assigner role on every write. Assignment grants no additional matter access. Test removed members and cross-tenant IDs; preserve self-assignment for allowed users.
5. **Owner acceptance:** owner invites a controlled employee, employee verifies/accepts, sees only their office and permitted matters, receives an assigned task, and cannot escalate their role. Verify mobile and session-expiry behavior, then request merge and production approval.

Required owner inputs before real invitations: employee name, email, role, office, and any matter-access restrictions; approved sender identity. No employee list has been supplied and no email was sent.

Official references consulted: [passwordless email flow](https://supabase.com/docs/guides/auth/auth-email-passwordless), [SSR advanced authentication](https://supabase.com/docs/guides/auth/server-side/advanced-guide). Auth/SDK behavior must be verified again when that implementation starts.

## Ordered delivery gates

| Priority | Deliverable | Completion evidence |
|---|---|---|
| P0 | Verify Production/Development boundary and migration history | Exact project/deployment mapping reviewed; approved production data boundary and rollback procedure |
| P0 | Staff invitations and task assignment above | Role/tenant negative tests plus controlled end-to-end invitation and assignment |
| P0 | Persist and version legal editor drafts | A saved draft survives another session/device and remains tenant/case scoped |
| P0 | Operational data recovery | Approved backup scope/retention, access control, and an actual restore drill; local snapshots are insufficient |
| P0 | Complete daily workflow acceptance | Real login/logout/recovery; client → matter → hearing/task → finance → document upload/download; role, session and cross-tenant denial tests on desktop/mobile |
| P1 | Close scoped security findings | Approved Auth setting and extension remediation, with tested dependent functions |
| P1 | RAJIH and legal corpus acceptance | Correct active office/matter context, citations from reviewed material, proposal-only writes, curated sources |
| P1 | Finance/reporting and operational error handling | Reconciled totals, edit workflows, honest empty/error states, recovery from failed uploads |
| Later | PWA, notifications, billing and broader roadmap modules | Separate product scope and verified delivery; not implied complete by a visual redesign |

## Verification and publication

Local: TypeScript and lint passed, all **103 tests** passed (92 existing + 11 behavior tests), production build passed using Webpack. The local node_modules worktree symlink prevents Turbopack from resolving its root; CI/Vercel use the repository's default build. No dependencies or lockfile were changed.

New behavior tests exercise legacy preference normalization, unsupported cloud failures without side effects, actual local-download request/history, no invented credentials/totals, CSV formula handling, content-sensitive consistency markers, readiness gating, authenticated library access, published/reviewed metadata filtering, and query failure without fake fallback.

Exact-head CI and Preview links belong in the PR once available. A successful deployment status is not authenticated workflow acceptance. Protected Preview access was not bypassed. This branch is for review; no merge, production promotion, live migration, Auth/RLS change, or email send is included.
