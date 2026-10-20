# AXIA Control Center D3 — verified hosted migration

Date: 2026-10-20. Status: **DATABASE MIGRATION VERIFIED; PREVIEW ACTIVATION AND HOSTED WORKFLOWS PENDING.**

## Approved source and actual application

The owner explicitly approved only `20261019142538_axia_control_center_office_operations.sql` from PR #48 head `d26e2da420b3034fa6be1a18415c5cadbe65d945` on the existing shared Production/Preview Supabase project. Source SHA256: `c8a05cb238e27730a774a6b8962e9e34b20ebe2a6648f73e6943001843e9fbbf`.

Fresh checks confirmed that head, successful [source CI 39291506517](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39291506517), exact remote/local source hash, 23 old migration records, all prerequisites and absence of new-object collisions. Storage policy management is permitted by the project's existing `supautils` allowlist and TRIGGER privilege, even though `postgres` is not the Storage table owner. No role membership/privilege escalation was used to obtain that permission.

The exact, unedited SQL was applied **once**, as hosted version **`20261020054338_axia_control_center_office_operations`**. The stored statement count is one and its SHA256 matches the approved source exactly. History is now 24 records. The source timestamp differs from the hosted application timestamp: **do not rename/replay the source or repair old history**. Do not run a blanket `supabase db push` against the unmatched historical source timestamps.

## Before/after preservation

[Aggregate-only evidence](evidence/axia-control-center-d3-activation-2026-10-20.json) records snapshots at **05:43:20.790470 UTC** and **05:44:07.920344 UTC** (08:43/08:44 Cairo).

- All **1,674 rows across the 22 existing public tables** have unchanged counts and row fingerprints, including the two office memberships. Existing table ownership/ACL/RLS settings, all old policies and triggers are unchanged. These fingerprints are comparison evidence, not a backup or recovery proof.
- All **23 old migration records** are unchanged; exactly one new record was added. Both previously applied staff/platform migration statement hashes still match their historical approved source.
- Selected Auth user/factor metadata, two user accounts, one verified factor, one Platform Owner, platform audit, bucket metadata and zero Storage objects are unchanged. No account, factor, email, Secret, SMTP or Auth setting was created or changed. No credential, JWT, session token, factor seed or customer row is included in the evidence.
- Exactly five existing functions changed as approved: three tenant/case helpers gained office access gates; two old private invitation implementations were renamed and their client execution revoked, with their bodies unchanged. Every other existing non-extension public/private function is unchanged.

## Installed security and read-only checks

- Six new tables: four private control/lease/audit tables with forced RLS and no direct anon/authenticated access; two public draft/history tables with RLS, no anonymous access and authenticated SELECT only. Writes remain behind guarded RPCs.
- Eighteen new policies and seventeen enabled triggers match the reviewed source. Both Storage capacity triggers exist; the commit trigger is deferrable and initially deferred. The two old invitation implementations cannot be executed directly by authenticated clients. Public RPC wrappers are SECURITY INVOKER, all reviewed function search paths are empty, and no reviewed function grants anonymous execution.
- All new controls, member blocks, support leases, control events, drafts and versions remain **empty**. No office was suspended/configured and no permanent tenant bypass or real permission grant was seeded. All 24 public tables have RLS enabled.
- An explicit **READ ONLY** transaction under `authenticated` without user claims verified empty own-workspace metadata, empty draft/history reads, `CONTROL_FORBIDDEN` for root control and denial of direct private-table SELECT; it rolled back. This is database negative-path verification, not an actual signed-in browser, MFA, employee, upload or customer acceptance test.
- Security advisors show the same two existing WARNs: [vector extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No new WARN/ERROR category appeared. RLS/no-policy INFO count grew from two to six because four new private tables intentionally deny direct client access; [linter reference](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). No broad policies were added to suppress those notices.

## Git, application and remaining scope

Runtime/migration source remains the approved `d26e2da` implementation; follow-up changes record this result in documentation/evidence only. PR #48 remains Draft, main stays `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`, and Android is preserved. No Merge, Production application deployment or Vercel environment change occurred. Source CI passed 164 app tests, 27 D3 PGlite checks, 31 D3 native PostgreSQL checks, all existing staff/platform/operator suites, Build/17 routes and 145 UI checks plus nine compiled HTTP checks.

The [branch Preview](https://axia-legal-git-feat-axia-d1c7df-ramyelhawary73-coders-projects.vercel.app/platform) is prepared, but D3 controls were not activated by this SQL operation. `AXIA_CONTROL_CENTER_ENABLED` remains default-off; no live flag value was changed or independently verified inside Vercel. The scoped Vercel connector still returns 403 and the user's browser context is unavailable. Deployment build success does not establish active flags or hosted workflow acceptance.

**Next:** separately scoped activation of the three non-secret app Config values on Preview + `feat/axia-control-center-client-readiness` only: `AXIA_PLATFORM_CONTROL_ENABLED=1`, `AXIA_PLATFORM_CONTROL_ORIGIN=https://axia-legal-git-feat-axia-d1c7df-ramyelhawary73-coders-projects.vercel.app`, `AXIA_CONTROL_CENTER_ENABLED=1`. Redeploy only that Preview, reuse the existing private authenticator and verify normal office login plus root/support/drafts/Storage workflows with authorized synthetic data. Actual Storage HTTP quota/finalization, real encrypted export and isolated service recovery remain unverified. Do not repeat SQL, create accounts or send email as a shortcut. Keep the existing sole office owner membership. Real employee account/mail onboarding, Merge and Production promotion remain separate gates.
