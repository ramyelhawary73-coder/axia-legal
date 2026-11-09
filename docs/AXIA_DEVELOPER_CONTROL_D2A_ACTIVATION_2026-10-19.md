# AXIA Developer Control D2-A — Hosted Foundation Activation

Date: 2026-10-19. Status: `VERIFIED` for the migration and checks below; actual platform-user activation remains incomplete.

Later same-day update: [D2-B](AXIA_DEVELOPER_CONTROL_D2B_BOOTSTRAP_2026-10-19.md) records the subsequently authorized, tested real bootstrap and current one-principal/one-event state. The zero-principal observations below belong to the earlier D2-A application step. Never rerun the migration to continue D2-B.

## Owner instruction and scope

The owner explicitly requested SQL execution directly on the existing Supabase project, without creating a backup. That session instruction supersedes the preflight's proposed backup/restore prerequisite for this application. The increased recovery risk was explained before execution. No backup, logical export, restore drill or second hosted project was created. Recovery remains unproved; comparison hashes cannot restore data.

Applied only the unchanged reviewed D1 foundation to shared Production/Preview project `qshgczulivsxztgrbqew`. No principal was seeded, Auth user/factor created, membership removed, existing tenant RLS changed, secret/provider/SMTP changed, email sent, PR merged or Production application deployed. Existing source branches and Android work are preserved.

## Exact source and actual hosted record

| Item | Verified value |
| --- | --- |
| Fresh main | `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d` |
| Reviewed implementation | Draft [PR #46](https://github.com/ramyelhawary73-coder/axia-legal/pull/46), head `f1e68b0f713d183b948e3dfe972c7a282d6a8bf4` |
| Source | `supabase/migrations/20261018173401_axia_platform_owner_foundation.sql` |
| Source SHA256 | `2f9a60b32b3ad1f29956953d9c06a68859742f40840bf208d08c1e107f657ce8` |
| Actual hosted version/name | `20261019080134_axia_platform_owner_foundation` |
| Hosted statement SHA256 | Exact match to the reviewed source above; one stored source statement |
| Migration count | 22 → 23, one new record |

Supabase's migration mechanism allocated the hosted version. The source filename and every older migration remain unchanged. **Do not reapply this file, rename it to the hosted version, repair history, or rerun the already-live staff invitation migration.**

The fresh preflight confirmed no platform object/type/function/trigger collisions, required Auth columns and private-schema USAGE, operator role `postgres` without a user JWT claim, and unchanged exact-head D1 [CI success](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39151943804). The reviewed CI covers 147 app tests, staff/platform disposable SQL including native locking races, 15 compiled routes and 82 browser checks. Those tests were not rerun against real hosted accounts.

## Post-application evidence

[Machine-readable evidence](evidence/axia-d2a-activation-2026-10-19.json) records metadata/count/hash results only. Before/after snapshots were taken in separate repeatable-read, read-only transactions at **08:01:19 UTC** and **08:02:12 UTC**. All compared existing values matched:

- 22 public tables, 1674 rows: counts and aggregate row hashes, including organization memberships and existing audit records.
- Existing public policies, table grants and triggers; existing public/private function definitions, ownership and ACLs (new platform functions deliberately excluded from that comparison).
- All original 22 migration records: hash `5fb7f698b4d23341994ed7cb74c93bf1` before and after, using the same version-bound selection.
- Two Auth users' selected identity metadata and existing factor metadata, bucket metadata and zero Storage object rows. No passwords, sessions, seeds, tokens or file bytes were read/exported for this comparison.

New platform objects verified on live PostgreSQL 17.6:

- Two `private` tables owned by `postgres`, RLS enabled and forced, no direct PUBLIC/anon/authenticated table grants.
- Eight functions: five private helpers and three public SECURITY INVOKER wrappers. All have empty search paths, no anon EXECUTE, explicit intended authenticated EXECUTE only. The private context/read helpers are the guarded privileged paths; trigger helpers are not client-executable.
- Five enabled triggers, five valid indexes including primary keys and one-active-owner uniqueness.
- **Zero platform principals and zero platform audit events.** Actual empty-context RPC returns `{version:1,state:forbidden}`. No real UUID/session claim was simulated and no live business test write was performed.

Advisors show no new WARN. Two INFO notices now report [RLS enabled without a policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) on the private tables. This is intentional: clients have no table privileges; access is through guarded functions. Do not add permissive policies to silence these notices. Existing WARNs remain [vector in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection); no remediation/configuration change was made.

## What this enables, and the next action

The database foundation is now present. It does not make the developer a live Platform Owner or enable the app. [D1 Preview](https://axia-legal-git-feat-axia-ad3ef0-ramyelhawary73-coders-projects.vercel.app/platform) remains the unmerged prepared implementation; no flag/origin was changed here. Main still lacks those new routes.

Next prepare and disposable-test the exact operator bootstrap/no-op/revoke/restore transactions against the [D2 contract](AXIA_DEVELOPER_CONTROL_D2_PREFLIGHT_2026-10-18.md), privately reverify the developer identity, and present the concrete role-grant scope before live bootstrap. Actual Data API exposed schemas and scoped Vercel configuration/exact Preview origin remain unverified. They must be resolved before enabling privileged user access, without fetching secrets or using broad grants.

Keep the existing sole Office Owner membership. Live role grant, own app TOTP enrollment, real cookie/RPC acceptance, revocation/restoration, employee accounts/mail, Merge and Production application rollout are separate remaining stages. The owner needs to run **no manual SQL for this completed migration**.
