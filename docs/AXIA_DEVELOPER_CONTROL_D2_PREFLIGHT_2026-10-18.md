# AXIA Developer Control D2 — Read-only Preflight

Date: 2026-10-18. Review status: `VERIFIED` for the observations below. Live activation: `BLOCKED` pending the recovery/configuration evidence and separate approvals below.

This package reviews the isolated D1 foundation. It does not activate it. No hosted SQL mutation, principal grant, Auth/MFA change, account creation, email, Secrets/SMTP change, merge or Production deployment was performed. The developer's existing sole-owner membership is preserved.

## Source and deployment evidence

| Item | Fresh observation |
| --- | --- |
| Latest `main` | `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`; tree `449246ec4e57debc830a655d99bda8fac57a7fb2` |
| D1 implementation | [PR #46](https://github.com/ramyelhawary73-coder/axia-legal/pull/46), open Draft, mergeable, 27 files; head `f1e68b0f713d183b948e3dfe972c7a282d6a8bf4` |
| D1 CI | [Run 39151943804](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39151943804), completed/success on that exact head; job logs re-read |
| D1 checks | Typecheck/Lint/Build; 147 application tests; 19 staff + 21 platform PGlite checks; 22 staff + 23 platform native PostgreSQL checks; 15 required compiled routes; 82 browser checks |
| Concurrency | Native logs show both read/revocation serialization and competing-bootstrap checks passing |
| D1 Vercel | Same-head GitHub `Vercel` status success, [deployment](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/Q2dzzHRdWjfYBZFy8mvfAckvkxVA) |
| D1 Preview | [Prepared `/platform`](https://axia-legal-git-feat-axia-ad3ef0-ramyelhawary73-coders-projects.vercel.app/platform); deployment readiness is not privileged runtime acceptance |

[Pinned D1 acceptance](https://github.com/ramyelhawary73-coder/axia-legal/blob/f1e68b0f713d183b948e3dfe972c7a282d6a8bf4/docs/AXIA_DEVELOPER_CONTROL_D1_ACCEPTANCE_2026-10-18.md) records the additional seven compiled HTTP safety checks and synthetic-test limits. These are D1 results, not tests of a live principal or hosted MFA enrollment.

This documentation branch starts from current `main`, not from the unmerged implementation. Its own CI/Preview run the current main application without `/platform`; they must not be presented as another D1 implementation or merged activation. PR #45 is the incorporated review, not another runtime prerequisite. Preserve all existing branches and Android source.

## Hosted read-only findings

The target remains the shared Production/Preview project `qshgczulivsxztgrbqew`. Its display name does not make it isolated Development. Reads used explicit read-only transactions; the data snapshot also used repeatable-read isolation. [Machine-readable comparison evidence](evidence/axia-d2-readonly-2026-10-18.json) contains counts and hashes, not business row values, real identity values, passwords, tokens or factor secrets.

| Check | Observation / limit |
| --- | --- |
| PostgreSQL | 17.6, ARM64; disposable CI native 17.11 / PGlite 17.5 are different runtimes |
| Current records | 2 Auth users, 2 offices, 2 memberships, 0 invitations |
| Public data snapshot | 22 tables, 1674 rows; per-table comparison hashes captured at 18:51:18 UTC |
| Public RLS | Enabled on all 22 tables; FORCE on 4; this is not an assertion that every policy/Storage path passed live acceptance |
| Platform name collisions | No matching relations/types, `axia_platform_*` functions or `platform_*` triggers in inspected schemas |
| Migration history | 22 records; latest `20261016083929`; D1 not applied |
| Prerequisite types/columns | Existing organization membership plus required Auth user/session/factor columns and `totp`, `verified`, `aal2` enum values present |
| Private schema | `postgres` owns CREATE/USAGE; `authenticated` has USAGE; no matching global/private default ACL entries observed |
| Operator context | Current SQL connector role `postgres`; `auth.uid()` null; no credentials retrieved |
| Developer identity | Exactly one owner-selected identity, confirmed, non-anonymous, non-banned; sole owner of one office; 0 verified and 0 pending TOTP factors |
| Storage | 1 bucket, 0 object metadata rows at this inspection; recheck before backup because new uploads can change coverage |
| Data API exposure | `pgrst.db_schemas` absent on this SQL connection and in inspected database/role settings. This does **not** prove the actual exposed-schema list |
| Vercel settings | Fresh project read returned team-scoped 403. No CLI available; no unchanged retry, credential retrieval or environment change |
| Recovery | No usable hosted backup, private logical export or restore drill was established by the available read capabilities |

The fresh 1674-row snapshot uses a newly recorded method. A second read-only snapshot after preparing this review matched all 22 public data counts/hashes, policy/grant/trigger hashes, public/private function definition/ACL/ownership hash and migration-history hash; the evidence file records both times. This does not cover Auth internals/provider configuration/Storage bytes, revalidate the older 1673-row/21-table snapshot, or establish recovery. Historical rollback-test results remain dated 2026-10-16. MD5 here only compares snapshots; it is neither a restorable backup nor tamper-proof evidence.

Security advisors retain two existing WARNs: [vector extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No remediation/settings change was made under this preflight.

## Exact proposed migration boundary

Reviewed source: [20261018173401_axia_platform_owner_foundation.sql](https://github.com/ramyelhawary73-coder/axia-legal/blob/f1e68b0f713d183b948e3dfe972c7a282d6a8bf4/supabase/migrations/20261018173401_axia_platform_owner_foundation.sql).

SHA256: `2f9a60b32b3ad1f29956953d9c06a68859742f40840bf208d08c1e107f657ce8`.

The reviewed file adds only:

- Two private tables, three explicit indexes, five triggers, five private functions and three public SECURITY INVOKER wrappers.
- Forced RLS and revoked direct client table privileges; explicit authenticated EXECUTE for guarded context/read functions and wrappers, empty search paths.
- One-active-root uniqueness, confirmed identity requirements, immutable identity/history guards, trigger-generated role audit and fresh UID/session/TOTP checks. It seeds no principal.

It changes no existing public table or tenant policy/helper/role enum, staff invitation RPC, task trigger, old migration or membership. Static source review and disposable tests establish that intended diff; a live post-application diff is still required. Recheck all exact names, indexes and helper signatures immediately before any separately approved application.

Future application must submit only this exact reviewed source through the migration mechanism. Capture the actual new hosted history version/name and unchanged older-record hash; do not presume the mechanism will reuse the source timestamp. Stop on partial objects, an unexpected history row, changed source, permission errors or any tenant-security difference. No blanket `db push`, history repair, timestamp rename or replay. The staff source `20261015081218_axia_staff_email_invitations.sql` is already live as `20261016083929` and must never run again.

## Recovery and configuration gates before any live grant

1. Confirm that the owner can independently access Supabase Dashboard/SQL as an operator, without relying on the new `/platform` role or this connector. A logged-in account or fingerprint alone is not proof of a usable recovery path.
2. Establish a private, fresh backup covering custom schema/data/roles/grants/RLS/functions/triggers, existing migration history and the required Auth schema/data, with a coverage manifest. Never commit the export or post its credentials, Auth rows, tokens, factor material or encryption keys to chat/CI. CLI filtering must be checked; a default custom-schema dump cannot simply be assumed to include every managed Auth object.
3. Prove the selected backup can restore in a disposable local environment compatible with Postgres 17 and the relevant Auth schema/extensions. Record backup time/hash/coverage, restore result, row counts and security-object comparisons only. No second hosted project or paid upgrade is required by this plan. Restoring live Production is a separate incident action with downtime/data-loss review, not a preflight test.
4. Current Supabase guidance recommends private CLI exports for free-tier projects; do not assume paid-plan Dashboard backup/PITR access. Database backups do not cover Storage file bytes. Currently observed object count is zero; recheck and preserve separate Storage coverage if that changes. Vault/configuration recovery needs separate private handling; do not fetch encryption secrets during this review.
5. Read the target Dashboard's **Data API → Exposed schemas** list. `public` must support the wrappers; `private` and `auth` must not be exposed for this design. Report names only. Do not copy the broad example GRANT ALL instructions from the general custom-schema guide. An unexpected exposure requires a separate reviewed remediation, not automatic grants or silent configuration changes.
6. Independently verify Vercel Production/Preview project refs, feature-switch values and the exact Preview HTTPS origin without exposing credentials. The connector's 403 leaves these unverified. Use a branch-specific Preview override, not a broad All Preview activation against the shared database. Both the switch and origin must match the deployment actually tested.

Primary references checked 2026-10-18: [Database backups](https://supabase.com/docs/guides/platform/backups), [CLI backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), [custom schema exposure](https://supabase.com/docs/guides/api/using-custom-schemas). None of their examples authorize a live restore, password reset, key export or broad grants here.

## Operator bootstrap contract — review only

No live bootstrap script was executed or real UUID embedded in source. Before requesting a grant approval, prepare the exact transaction and validate it in the disposable harness against this contract:

1. Bind a privately reverified target UUID and privately compare its current email to the owner's selected account. Email is an operator identity check only; runtime authority remains UUID-based. Assert exactly one confirmed, non-anonymous, non-banned identity and preserve the existing owner membership snapshot.
2. Assert the approved migration/source identity, exact object ownership/ACLs, expected root state, operator role and null user claim. Use bounded statement/lock timeouts and a transaction that locks principal state before deciding. Do not set fake user JWT claims to make an operator action look user-initiated.
3. With no principal history and no active root, insert exactly one `user_id` into `private.platform_principals`; never insert Auth users or office memberships. The database trigger appends exactly one `platform.owner.bootstrap` event with `actorType=operator`, null actor ID and the subject UUID. Do not add a second audit row manually.
4. An exact same active principal with expected role/history is a verified no-op, not a second bootstrap. An existing revoked principal, foreign root, unexpected prior history or malformed row is a hard stop. Do not silently restore, switch identities, ignore a conflict or promote by email/metadata.
5. Before commit, assert exactly one intended active root, one corresponding expected bootstrap event, no direct client grants and unchanged tenant membership/security fingerprints. Do not call privileged registry/audit reads with simulated live user claims as a substitute for real MFA.

The D1 fixture already tests confirmed-identity guards, same-identity conflict/no-op, second-root rejection, trigger attribution and real native competing inserts. It does not yet test the complete future operator transaction with private execution parameters. That transaction requires its own disposable checks and concrete approval before hosted use.

## Emergency stop and MFA recovery contract — review only

| Failure | Bounded response after explicit approval |
| --- | --- |
| Application problem before a grant | Keep activation off, preserve additive schema/history and existing office owner access; investigate the diff |
| Active platform authority must stop | Operator transaction targets exactly the privately verified UUID; locks/rechecks state; sets `enabled=false, revoked_at=clock_timestamp()` only when currently enabled; verifies one active-to-revoked transition and its automatic event |
| Repeated stop | Verify already-revoked state and perform no write/event; never delete/truncate principals or audit |
| Lost pending QR | Stop; do not keep enrolling, auto-delete a factor, expose the seed or bypass MFA. Review the user's own pending-factor recovery privately with separate Auth approval |
| Lost verified authenticator | First revoke platform authority through the independent operator path; preserve office membership. A restored principal still requires valid TOTP/session; role restoration alone cannot repair a lost factor |
| Restore role after a resolved incident | Separate identity/recovery approval; revalidate confirmation, factors, current root uniqueness and session acceptance; one operator revoked-to-active transition generates `platform.owner.restored` automatically |

Changing the Vercel switch only gates the app UI/API. It does **not** revoke an enabled database principal's access to public RPCs with a valid session/MFA. Revocation takes effect for subsequent guarded reads after its transaction commits; an already-running read may finish before the principal lock releases. In an emergency, do not wait indefinitely on a lock or claim data already returned can be recalled.

No ordinary endpoint grants/revokes roles, transfers office ownership, deletes factors or impersonates a user. No recovery step removes the current sole office owner, resets a password, disables MFA globally, rewrites old migration history, drops the new tables, or erases audit under this preflight.

## Controlled activation sequence after the gates pass

| Stage | Proposed action and acceptance | Approval boundary |
| --- | --- | --- |
| D2-A | Fresh source/hash/collision/data/security/history check; recovery proof; apply only the reviewed new migration; confirm zero principals/events and unchanged existing objects/data | Explicit shared-Production database SQL approval; no bootstrap implied |
| D2-B | Prepare and disposable-test the exact bootstrap/no-op/revoke/restore transactions; privately bind the account; grant only that UUID after assertions | Explicit real platform-role grant/recovery approval |
| D2-C | Activate only the reviewed D1 branch Preview with `AXIA_PLATFORM_CONTROL_ENABLED=1` and exact `AXIA_PLATFORM_CONTROL_ORIGIN`; user enrolls/verifies TOTP privately in their own UI | Explicit Preview configuration and own app MFA approval; enrollment changes the shared Auth account |
| D2-D | Real cookie `aal2` upgrade and ready context; bounded registry/audit reads with one audit each; prove other user/anonymous denial and existing office login; approved revoke denies existing-session API/direct RPC, then separately approved restoration and fresh MFA/session acceptance | Controlled live test/revocation/restoration approval; no new accounts or mail implied |
| D3 | Select an owner-controlled employee mailbox and fictitious-data office; prove new account/invitation/task/case access; establish a real replacement Office Owner before considering developer membership removal | Separate accounts/mail/office-data/ownership approvals |

D2-D evidence must omit cookie values, tokens, codes, QR, seeds, emails and legal data. Browser fixtures cannot substitute for this acceptance. An owner-controlled existing second user may be used only with explicit test authorization; the current two owners are not new employee fixtures. Do not create a hidden test account or membership.

## Immediate next action

Complete the **recovery and exposed-schema evidence**, then prepare/test the exact operator transaction before asking for any live activation approval. The owner can privately open:

- [Data API settings](https://supabase.com/dashboard/project/qshgczulivsxztgrbqew/settings/api): provide only the Exposed schemas names.
- [Database Backups](https://supabase.com/dashboard/project/qshgczulivsxztgrbqew/database/backups): establish whether a usable backup exists. On the free plan, use a private logical export and local restore drill when hosted restore is unavailable; do not create a second hosted project or post a database URL/password.

This is a preflight handoff, not a request to paste/run SQL now. No Merge or Production deployment is approved. The developer platform identity is prepared but has no live authority yet; first-client readiness remains blocked by the documented staff, recovery and business-workflow acceptance gates.
