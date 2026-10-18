# AXIA Developer Control & Isolated Staff Acceptance

Status: `READY_FOR_SCOPE` — architecture review, not an implemented permission system.

Reviewed: 2026-10-18. Baseline: `main` at `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`.

## Recommendation

نفصل حساب المطوّر عن فريق المكتب بدور `Platform Owner` مستقل مرتبط بهوية المستخدم الفعلية. نثبت دخوله وحمايته أولًا، ثم ننقل ملكية المكتب إلى حساب مالك مناسب قبل إزالة العضوية الحالية. حساب موظف التجربة يكون منفصلًا وببيانات وهمية؛ لا يصبح مالك المكتب بدلًا من العميل.

This review changes documentation only. It does not assign a platform role, create accounts, send email, prepare executable migration SQL, change Auth/RLS/Secrets/SMTP, merge or deploy Production. The previous permission to apply the staff invitation migration does not authorize a new platform migration.

## Verified baseline

| Area | Evidence on 2026-10-18 |
| --- | --- |
| GitHub | PRs #42/#43/#44 merged; main remains `c0fd6a6` |
| Main CI | [Run 39057754119](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39057754119): completed/success |
| Vercel | Same-SHA GitHub Vercel status reports success; [deployment record](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/XKM5LcgRsNous9FxheHTZ8w18C5u) |
| Direct Vercel access | Team-scoped inspection returns 403; no Vercel CLI is available. Runtime settings, canonical Production URL and a real signed-in flow remain unverified |
| Shared Supabase | `qshgczulivsxztgrbqew`: 2 Auth users, 2 offices, 2 memberships, 0 staff invitations; 22 migration records; latest `20261016083929` |
| RLS | All 22 public tables have RLS enabled; this does not by itself prove every policy or business flow |
| Developer identity | Owner-selected email resolves to one confirmed user; sole `owner` of its current office; no second office owner. No identity IDs are embedded in this document or application rules |
| MFA | That app user has 0 verified MFA factors. Supabase dashboard/account MFA is a different identity and is not a substitute |
| Current authorization | No platform/developer table. `resolveWorkspace()` requires real `organization_members` membership. Membership grants are SELECT-only for `authenticated`; only the same-office SELECT policy exists |
| Existing owner trigger | `private.add_organization_owner()` runs after organization INSERT, inserting `new.created_by` as owner. It is a trigger, not an ownership-transfer API; clients cannot execute it |
| Existing audit | Core writes and invitations are audited. Ordinary audit INSERT is restricted to a narrow RAJIH action; do not widen it for platform events |
| Advisors | Existing WARNs: vector extension in public; leaked-password protection disabled. Neither setting was changed |

The baseline CI previously recorded 130 application tests, 19 PGlite checks, 22 native PostgreSQL checks, 55 browser checks and 10 compiled routes. Those results verify the current application, not the future platform-role design. Live PostgreSQL is 17.6; native CI was 17.11, so a disposable suite is not an exact live-version reproduction.

## Root cause and identity boundaries

Removing the developer membership now makes tenant APIs return `WORKSPACE_MISSING`. Hiding the account in the team list would only change display; it would not separate authority. Matching the developer email in application code would create an authorization bypass.

There are three distinct responsibilities:

1. **Platform Owner:** the owner's existing confirmed developer identity; manages the platform through explicitly implemented administrative commands.
2. **Office Owner:** the customer/office authority; retains office membership and legal workflow access. An actual replacement must exist and be tested before developer departure.
3. **Test Employee:** a separate least-privilege staff identity in a designated test office, using fictitious legal/business data.

The first package establishes protected platform identity and a small read-only console. It does not claim complete platform operations or automatic access to every office's legal content. Customer provisioning, ownership transfer and support access are separately bounded operations, not a blanket RLS override.

## Permission contract

| Capability | Platform Owner in D1 | Office owner/admin | Staff/viewer/anonymous |
| --- | --- | --- | --- |
| Read own platform authorization | Fresh role/session check | Denied as platform authority | Denied |
| Read bounded office registry / platform audit | Allowed with MFA; registry limited to office ID, name, slug, creation time | Denied outside existing office APIs | Denied |
| Read or change legal/business records | Existing tenant membership and case ACL only | Existing role and case ACL | Existing role and case ACL; anonymous denied |
| Assign/change platform role | No application endpoint; operator-only bootstrap/recovery | Denied | Denied |
| Create office, transfer office ownership, remove developer membership | Deferred from D1; separate checked operation/review | Existing behavior unchanged | Denied |
| Send mail, manage Auth users, change Secrets/SMTP | No capability added | No capability added | No capability added |

Office staff never gain platform control through an invitation, profile edit, `user_metadata`, localStorage, custom header or an office `owner` role. A platform role is not an extra value in `public.app_role`.

## D1 — proposed isolated implementation

Risk: low for this documentation review; **high for eventual live authorization/schema activation**. D1 code and a new migration source require owner approval of this contract. Execution targets disposable local databases only.

### Additive database design

- New `private.platform_principals`: verified `auth.users` UUID, fixed role `platform_owner`, enabled/revoked state and timestamps. An active-root uniqueness constraint permits one active initial root. No email-based runtime authorization or automatically seeded real principal.
- New `private.platform_audit_events`: append-only event ID, actor UUID, optional office UUID, bounded action/result codes, timestamp and correlation ID. No credentials, invitation tokens, legal content or free-form sensitive payloads. Preserve historical actor IDs without cascading audit deletion.
- Enable RLS as defense in depth and revoke table privileges from PUBLIC/anon/authenticated. Do not expose private tables or add the private schema to Data API exposure. Verify actual exposure settings at activation; schema naming alone is not protection.
- Narrow privileged helpers stay in `private`, use `search_path = ''`, fully qualified names and explicit authorization checks. Revoke default PUBLIC function execution and grant only required callable functions. Public RPC wrappers use SECURITY INVOKER; private implementation functions guard every invocation, including direct calls where executable.
- Proposed RPCs: `axia_platform_context()` and a bounded `axia_platform_offices(limit, after_id)` plus paginated platform audit access. Fixed output fields; no arbitrary SQL, table name, actor UUID or role argument. No generic role-management RPC.
- Check confirmed/non-anonymous/non-banned user, a current enabled principal row, a valid current session belonging to `auth.uid()`, `not_after` where present, verified app MFA factor and `aal2`. Missing/malformed session ID, stale/revoked session, downgraded MFA or missing schema fails closed. Do not add paid session-management settings as a free-plan dependency.
- Role revocation is checked in the database on each privileged call, independent of cached JWT role claims. Serialize later privileged writes against principal revocation and office ownership with explicit lock ordering; test races before adding writes.
- Commit audit for successful privileged operations with their operation transaction. An audit INSERT followed by a raised SQL exception rolls back too: denied attempts must be recorded through sanitized server security logging, not falsely claimed as persisted database audit. Bound any read-access logging; no unbounded polling log flood.
- No changes to existing tenant helpers/policies, staff invitation RPCs, task trigger, old migrations, public role enum or existing audit INSERT permissions. Capture object/data fingerprints to prove that boundary before any live activation.

### Application design

- A separate `resolvePlatformContext()` uses configured ordinary SSR client, fresh `getUser()` and the checked RPC. It must not reuse the mock client as platform authority or fall back from a failed tenant lookup into cross-office access.
- `/platform` is a protected administrative destination independent of office membership. Server/API checks protect the route even when its link is hidden. No cache shared between users; private/no-store responses; sanitized 401/403/503 outcomes.
- Prepare app MFA enrollment/challenge views using normal Supabase APIs, with live use gated off. Never log or screenshot TOTP secrets/QRs. Test existing owner password login, pending MFA, signed-out and no-membership developer landing separately. Recovery is an explicit operator process; never disable MFA globally to bypass a failed test.
- Keep `/` and existing office APIs unchanged in their authority. Provide an intentional, tested post-login route to `/platform` for the developer; no user can select their own platform role through `next` or another redirect parameter. Missing migration/configuration must not break ordinary owner login.
- No new production dependency, Auth provider/config changes, real signup, account deletion, SMTP configuration, outbound email, commercial billing or native Android expansion.

### Expected files for D1 (proposal, not changed in this review)

| Area | Expected paths |
| --- | --- |
| New migration source | One CLI-generated `supabase/migrations/<timestamp>_axia_platform_owner_foundation.sql`; no invented timestamp or history repair |
| Server authorization | `src/lib/api/platform.ts`, `src/lib/api/errors.ts` |
| Protected console/API | `src/app/platform/page.tsx`, `src/app/api/platform/context/route.ts`, `src/app/api/platform/offices/route.ts`, bounded audit route |
| Entry/MFA UI | `src/app/page.tsx`, separate platform/MFA components, `src/components/app-shell.tsx`; exact landing/proxy changes reviewed before coding |
| Verification | Platform behavioral tests, disposable SQL fixture/runner, UI verification and required route build guard; `.github/workflows/ci.yml` |
| Documentation | This review, activation acceptance report and `docs/AXIA_MASTER_ROADMAP.md` |

### Required acceptance cases

1. Confirmed active Platform Owner with valid `aal2` session reaches console without office membership; owner office login still works.
2. Office owner/admin/lawyer/staff/trainee/viewer and anonymous users cannot call platform RPCs/APIs or read/write private tables.
3. Same email string, changed email, forged `user_metadata`, header, localStorage and client-supplied UUID never grant root authority.
4. Missing schema/config, mock fallback, RPC errors, banned/anonymous/unconfirmed users, malformed or absent session IDs fail closed.
5. Revoked/expired session, removed principal and removed verified MFA factor deny access even with a previously issued token; concurrent future revocation/write tests must serialize.
6. Root cannot use unchanged tenant APIs/RLS to read another office's clients, matters, tasks, finances or Storage without explicit existing access.
7. Direct private function calls cannot skip guards; invoker/definer grants and fixed search paths match the contract.
8. Bootstrap repeated with the same UUID is safe/idempotent; a different UUID, second active root, unconfirmed or missing account aborts. No real identity is seeded by migration or tests.
9. Successful platform events are immutable and correctly attributed; forbidden attempts produce sanitized security logs. No audit metadata contains email/token/legal field values.
10. Desktop 1440px and mobile 390/320px light/dark: console, login landing, denied/MFA/error states, keyboard focus and no horizontal overflow. No QR/secret in CI artifacts.
11. Keep all current application/SQL/UI suites, Typecheck, Lint, Build and required-route guard green on the exact final head. No test runner accepts a hosted Supabase URL.

## D2 — future controlled activation, separate approval

1. Review exact D1 head, new migration SHA256, advisor findings, object fingerprint diff and disposable SQL/concurrency results. Prove a usable recovery procedure before live privilege activation; historical fingerprints are not a restorable backup.
2. Because Preview shares Production's database, apply only that explicitly approved additive migration; no blanket push/replay. The staff migration `20261015081218_axia_staff_email_invitations.sql` is already live as `20261016083929` and must not run again.
3. Privately select the verified developer UUID at execution time. A one-time operator transaction asserts the approved account's existence, confirmation and identity, inserts the principal and immutable bootstrap audit, and refuses unexpected existing roots. No browser bootstrap endpoint, committed real UUID/email, Service Role or email-triggered promotion.
4. With separate approval, complete app-user MFA enrollment/challenge through the product UI. Secret/QR stays in the user's own authenticator flow. Verify a real `aal2` session, loss/recovery path and fresh-role revocation before relying on platform access.
5. Merge/Production code deployment and any non-secret activation flag changes remain distinct approved steps after final-head CI/Preview. A role alone does not prove the customer delivery workflow.

## D3 — office handoff and staff acceptance, separate bounded package

- Select the actual office-owner account and a different controlled test-employee mailbox. `staff.demo@example.invalid` is only an offline fixture, not a deliverable mailbox. Do not create a mailbox or use another existing owner's account by assumption.
- Preserve current developer membership until a replacement confirmed Office Owner has signed in and demonstrated access. Current staff invitation RPC intentionally refuses the `owner` role and does not promote existing members; leave that behavior intact.
- Prepare an explicitly checked ownership-transfer command: lock office and affected memberships, validate confirmed target/account/tenant and actor, ensure an owner remains, append before/after role audit, commit atomically. Test two concurrent transfers, rollback and last-owner protection. The existing organization-insert trigger must remain unchanged; future office creation must explicitly set the customer as intended owner rather than automatically adding the developer.
- Only then perform the specifically approved membership removal. Do not hide an active membership and call it a completed separation; do not delete the Auth user or historical legal/audit rows. Review historical `created_by`, case ACL and task associations rather than rewriting them automatically.
- Test an isolated fictitious office with owner, employee and outsider identities locally first. A hosted test office is tenant isolation inside the shared live project, not a separate Development database. Its creation, new accounts, mail and membership writes need their own approved scope.
- Sender/provider selection, confirmation redirect/template review, SMTP/Secrets, real account confirmation, expired/revoked invitations and task assignment acceptance remain in the staff activation plan. No live mail is sent as a test without approval.

## Delivery priority and deferred scope

D1 is deliberately a protected identity/console foundation. D2 is explicit live activation. D3 provides ownership continuity and proves staff onboarding. Platform-wide impersonation, automatic legal-data access, subscription billing and broad developer dashboards are deferred until after the first stable client delivery. Recovery, persisted legal drafts and the full first-client business workflow remain delivery gates.

## Documentation reviewed

- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security): grants and row policies are distinct; user-editable metadata is not authority; JWT role changes may be stale.
- [Database functions](https://supabase.com/docs/guides/database/functions): explicit execution privileges and safe definer configuration.
- [Sessions](https://supabase.com/docs/guides/auth/sessions): session ID correlates with `auth.sessions`; sign-out does not immediately erase an issued JWT.
- [App MFA](https://supabase.com/docs/guides/auth/auth-mfa): verify and enforce AAL at server/database boundaries, not UI alone.
- Changelog index fetched 2026-10-18. [TLS cipher retirement](https://supabase.com/changelog/cbc-tls-ciphers-deprecated) and [Postgres minor security changes](https://supabase.com/changelog/postgres-15-19-17-11-breaking-changes) reviewed. No SDK upgrade or maintenance SQL is included in this permission review.
