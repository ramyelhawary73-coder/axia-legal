# AXIA Staff Activation & Integration Verification — integration refreshed 2026-10-17

**حالة التسليم:** طُبّقت Migration الدعوات وحدها على مشروع Supabase المشترك بموافقة صريحة. فحوص قاعدة البيانات نجحت دون تغيير البيانات الحالية. PR #42 ما زال Draft؛ لا Merge أو نشر كود Production أو بريد حقيقي أو إنشاء حسابات جديدة.

## Verified baseline and integration

- Initial integration main: `dfb557f2741ca521b13fd727abeb0f2c25803fd5`; refreshed main: `558245314e156ea856347cd7ea5aae6d4f7202e9`.
- PR #40: `2a189f0bbde7141f43160dc3b714861eb6684c10`, open/draft.
- PR #41: `576bf1fcdf39d78fc3a6d6e5fb908b112eecf05f`, open/draft.
- Integration branch: `feat/axia-staff-activation-acceptance`, created from latest main. Neither source PR was merged, closed, reset, or rewritten.
- Combined both complete patches. Conflicts were limited to roadmap state and Team heading copy. Kept the newer invitation heading, corrected initials splitting, snapshot readiness guard, local-only export, real legal library, invitation APIs/UI and assignment/reassignment controls.
- Added accessible labels to the existing mobile navigation controls so keyboard/screen-reader and automated navigation can use them.
- Screenshot review caught clipped header controls at phone width despite a passing document-width check. The phone toolbar now uses a separate wrapping row, the account control is compact and named, and its popover is viewport-bounded. Browser checks now assert visible header-button bounds and cover Team/Library/Tasks/acceptance at 320px too (30 layout checks in total).
- Browser inspection exposed a pre-existing hydration mismatch in speech-support detection. Switched that capability read to an SSR-safe external-store snapshot; voice behavior is preserved and hydration errors are checked in browser automation.
- Integration preserved application dependencies, package.json and lockfile. The separately approved database activation below is the only live change; SMTP, Auth settings, secrets and Production code deployment were not changed.

## 2026-10-17 main refresh and compatibility repair

The owner authorized updating the existing PR branch, preserving Android and all existing work, resolving integration issues, running verification, updating the roadmap and presenting employee registration scope. Main and PR #42 were re-read first. Main had advanced by `bcd88dfb8002bb6b0677c4654170187b8118e99a` and `558245314e156ea856347cd7ea5aae6d4f7202e9`; the PR head was `38b3a7698e0af99ba5e84352fc2664ceca56d54c`. Neither source PR #40/#41 nor PR #42 was merged to main.

### Reproduced failure and minimal correction

Git combined the branches without textual conflicts. A functional path collision remained: Android's root `app/` takes precedence over Next.js `src/app/`. The installed Next.js 16.3.3 `find-pages-dir.js` and bundled `src-folder.md` confirm this rule. The initial production build exited successfully but listed only `/404`; its app manifest lacked all eight critical web entry points. This reproduces a source-tree defect, not a direct observation of the current Production deployment.

All **44 native Android files** moved to `android/app/` with byte-identical Git blob hashes. Root Gradle configuration remains in place and `settings.gradle.kts` maps the existing `:app` module to `android/app/`. No native screen, Kotlin model, asset or behavior was changed. The Android ViewModel uses `MockLegalDataSource` and in-memory state; no native release build/device test or live Android integration is claimed. The checkout has no Gradle wrapper; no Android tooling/provisioning was added.

`package.json` appends `scripts/check-web-build.mjs` to the existing production build. The guard rejected the broken output, then passed for all eight required routes after relocation. The repaired build contains the real pages, API handlers and Proxy. `tsconfig.json` includes the development types path requested automatically by this Next.js version, with no formatter-only rewrite.

The updated main lockfile initially failed `npm ci` with npm 11.9.0 due to missing optional-platform package records; npm 10.9.4 could install it. The lock metadata was completed with 79 missing optional/transitive records; all 450 existing main lock entries keep their versions and production dependency declarations are unchanged. A fresh npm 11.9.0 `npm ci` then passed. This preserves main's resolved dependency updates instead of reverting them. Native-platform/optional transitive metadata is not a new application capability.

### Verification and limits for this refresh

- Local Typecheck/Lint, 113 application tests, 19 disposable PGlite checks, production build and 30 browser layout/flow checks passed. The route guard has a demonstrated negative case on the broken build and a positive case after the correction.
- Browser checks cover login, Team, Tasks, Library and invitation acceptance at 1440/390/320px in light/dark. No document overflow or clipped visible header control was observed. API responses use synthetic loopback fixtures with external requests blocked; they do not establish real employee login/acceptance.
- Native PostgreSQL concurrency is executed by the existing disposable CI service, not against Supabase. Final exact-head CI and Vercel status/Preview are attached to PR #42 after publishing this refresh; historical checks below are not substituted for final-head results.
- Direct Vercel inspection again returned 403 for the specified team/project. No authenticated Vercel CLI is installed. Use the exact-commit GitHub Vercel status for readiness, and report direct deployment/runtime inspection as unavailable. No credentials, protection bypass or Vercel configuration change was used.
- Read-only live Supabase check on 2026-10-17 confirms latest version `20261016083929`, 22 migration records, acceptance RPC present, 0 invitations, 2 Auth users and 2 memberships. No live SQL write, migration replay, account creation or email occurred. Complete security/data fingerprints and 18 rollback permission checks below are dated 2026-10-16 and were not rerun.

## Activation result: APPLIED — explicitly approved shared Production target

The owner supplied Vercel Dashboard screenshots showing Production and All Pre-Production Environments using `https://qshgczulivsxztgrbqew.supabase.co`, then declined a second cloud project and chose one database. Direct Vercel project inspection remains unavailable (403); dashboard configuration does not independently prove the build-time configuration of every deployed build. Treat this shared target as Production.

The earlier migration attempt was blocked before execution because its original authorization was Development-only. The owner subsequently explicitly approved this exact file, project and table/RLS/functions/task-trigger scope, while forbidding historical migration edits, Secrets/SMTP, actual email, Merge and Production code deployment. That approval cleared the previous authorization blocker. No second project, plan upgrade, environment-variable change or alternate execution route was used.

The exact reviewed file was applied once on 2026-10-16 through the migration tool. Supabase allocated live version **`20261016083929`**, name **`axia_staff_email_invitations`**, at 08:39:29 UTC / 11:39:29 Cairo. The source filename remains `20261015081218_axia_staff_email_invitations.sql`; do not rename it or repair old history to match the execution timestamp.

### Verified database results

- History increased from 21 to 22 records. All 21 original version/name/statement-hash records are identical.
- All 21 original public-table row counts and SHA-256 data fingerprints match before application, after application and after rolled-back smoke tests: **1,673 original rows unchanged**.
- All **207 existing table-security/function/grant/policy/trigger fingerprints** match. Nine new tracked security objects were added as expected: table, policy, six functions and task trigger.
- **22/22 public tables have RLS**. `staff_invitations` also has FORCE RLS. Its metadata columns are readable only through manager RLS; `authenticated` cannot SELECT `token_hash`, INSERT invitations directly or INSERT memberships directly.
- Public RPC wrappers are SECURITY INVOKER; privileged implementations remain in private with empty search paths. `anon` has no execution; `authenticated` cannot directly execute the task trigger function.
- The task-assignee BEFORE INSERT/UPDATE trigger exists. Preflight found zero incompatible current tasks; authenticated legacy task update and new task creation passed the live rollback test.
- Final persisted state: **0 invitations, 2 users, 2 memberships, 1 task**. No test record, test audit event, new account or membership was retained.
- Security advisors found no new warning. The two pre-existing findings remain unchanged: [vector extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [disabled leaked-password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). No setting was changed to address them in this scope.

### Live permission smoke tests: 18 passed, every test write rolled back

These use the two existing confirmed owner identities by transaction-local database role/claim simulation, not a browser login or an actual JWT/session. No Auth user/setting was changed and no message was sent.

Coverage: own-office versus other-office capabilities; cross-office management denial; forbidden owner grant; create/list invitation; token-hash SELECT and direct mutation denial; renewal cooldown; cross-office invitation RLS; rejecting acceptance into a second office; expired link denial; token renewal; old-token rejection; revoked-link rejection; existing task update; task creation; cross-office assignee denial; audit events/redaction; anonymous execution denial. Capability assertions and audit assertions are grouped into 18 checks.

The test transaction ended in ROLLBACK. Repeated data fingerprints and explicit table counts proved that all temporary invitation/task/audit writes were discarded. Initial test-script alias ambiguity was corrected before the successful run; no application SQL correction or second migration was needed.

### Evidence limits and recovery

All local/CI suites passed on `53fd12c4cef33f3920df2b287ff4212a36bbe069`: [CI 38791472975](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38791472975), with 113 application tests, 19 PGlite checks, 22 native SQL checks, 30 browser layout checks, Typecheck/Lint/Build. Follow-up changes in this activation report are documentation only; final PR-head evidence is linked in PR #42.

Successful **new employee acceptance through real browser/Auth sessions remains unverified**: both currently available accounts are owners already attached to offices. Lower-role and concurrent acceptance behavior passed isolated native PostgreSQL tests; do not label those as live employee login proof. Invite-guided new-account registration and sender delivery are not implemented by this migration.

The row/hash/schema checkpoint is **not a restorable full database/Auth/Storage backup**. Recovery verification remains a first-client gate. The migration transaction protects pre-commit execution, but reverting frontend code does not undo committed database state. Preserve invitation rows, memberships and audit logs; investigate before a narrowly scoped repair. Do not automatically drop the table, delete memberships, weaken RLS or restore an old database over newer work.

### Exact migration identity

File: `supabase/migrations/20261015081218_axia_staff_email_invitations.sql`.

SHA-256: `1e2a29f97c109689cf2a9abacc5f970e87920bae418116cbb3b12f828646ad2b`.

Byte-for-byte equal to PR #41. No SQL correction or historical migration repair was introduced. Live history is now 22 records versus 20 source migration files (19 baseline plus this one). The new live version was allocated at execution time; the historical mismatch predates this change. Do not replay, rename, reset, repair or blanket-push migration history. This file is already applied and must not be applied again.

## Verification story and evidence limits

Story: office management creates an email-bound invitation → an existing confirmed account accepts it → a tenant membership is created atomically → an eligible employee receives a task only if they already have case access.

| Boundary | Evidence | Limit |
|---|---|---|
| Combined application contracts | 113 application tests pass locally: original 92 plus both packages' 21 behavior tests | Handler tests use controlled doubles; not real Auth sessions |
| SQL authorization/state | 19 isolated PostgreSQL 17.5/PGlite checks pass locally | Scaffold matches verified live prerequisite contracts; not full historical replay |
| Multi-session SQL | Added a disposable PostgreSQL 17 service and three concurrent checks to CI | Exact-head CI result is authoritative; no Supabase host is used |
| Desktop/mobile rendering | Browser contract automation for light/dark login and Team/Library/Tasks/acceptance at 1440/390/320px | Uses synthetic API responses on loopback; never claims real login, email or live tenant acceptance |
| Actual Preview/build | Exact-head default build, CI and Vercel deployment status attached to PR | Deployment success alone is not live acceptance |
| Live SQL/Auth/SMTP | Exact migration applied; data/security/history checks and 18 rollback permission checks passed | Browser/Auth employee acceptance remains unverified; no SMTP, actual email or new account provisioning |

### Initial integrated CI result

[Run 38787119284](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38787119284) passed on `fd8f41e1c081d7024b42b5ed2f4d5e4faaf9f85a`: Typecheck, Lint, all 113 application tests, 19 PGlite checks, 22 native PostgreSQL 17.11 checks including all three concurrency cases, production build and 22 browser layout checks with complete invitation/assignment flows at desktop and mobile widths. All measured document widths equalled their viewports. [UI evidence artifact](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38787119284/artifacts/11998133054) contains screenshots and the JSON report.

[Preview](https://axia-legal-git-feat-axia-8d7ae8-ramyelhawary73-coders-projects.vercel.app) was Ready for that commit. Its readiness is a deployment status, not an authenticated live acceptance test. Follow-up commits correct the speech hydration warning and clipped phone header, add progress output, extend the isolated runner timeout and raise browser coverage to 30 layout checks. Final exact-head status is recorded in [PR #42](https://github.com/ramyelhawary73-coder/axia-legal/pull/42).

### Browser verification design

Pinned test-only Playwright 1.56.1 and Chromium headless shell are installed outside application dependencies. The runner starts the app and browser in the same loopback context, waits for the server's TCP listener, runs the checks, and stops its own server. This avoids the earlier cross-session network failure and does not cancel initial page compilation with repeated short HTTP probes.

Checks exercise actual application components and browser events: mobile menu navigation, creating a link without claiming delivery, rendering reviewed metadata, saving task assignment, accepting a fixture invitation and removing its token from the address bar, plus document-width overflow checks. Screenshots and JSON evidence are uploaded as a seven-day CI artifact. All identities are `example.invalid` fixtures; external requests are blocked. No real account, recipient or provider is contacted.

This is UI contract verification, not a substitute for real Supabase/Auth acceptance. The first local development run exceeded its overall timeout during repeated acceptance-page navigation. A subsequent local run passed all original 22 layout checks after increasing the timeout. CI also passed those checks using the production build. The extended 30-check suite and header bounds are verified on the final PR head; do not treat a timed-out run as a pass.

### Concurrent SQL checks

The same 19 security checks can run against either PGlite or a real PostgreSQL driver. Native CI adds:

1. Two creates for the same pending email produce one invitation; simultaneous accepts produce one membership and one acceptance audit event.
2. Rotation racing acceptance cannot overwrite an accepted invitation or grant membership twice.
3. Two offices inviting the same recipient concurrently cannot silently join that recipient to both offices.

The native test adapter has a fixed loopback host and fixed disposable database name. It does not accept a live connection URL. The service is loopback-bound and contains only synthetic data; it is destroyed with the job. No Service Role or application secret is used.

## Remaining acceptance before merge and first-client delivery

1. Do not reapply this migration. Current main `5582453` is incorporated into the refreshed branch. Check final exact-head PR/CI/Preview and confirm main has not advanced again before any future code rollout.
2. Review the actual Team and Tasks UI in Preview with the owner's current login; fixture screenshots do not establish a live browser session.
3. Prepare invite-guided registration and approved test identities not already joined to another office. Verify confirmation, correct membership, duplicate/expired/revoked/renewed links and case/task access through real Auth sessions. No arbitrary account creation or outbound email is authorized by this activation.
4. Keep sender/SMTP/Secrets and actual delivery tests in the separately approved sender scope. Retain truthful manual-link/no-email UI until delivery is enabled.
5. Prove an appropriate data recovery procedure before first-client handoff. Data fingerprints are comparison evidence, not a restoration method.
6. Present exact-head evidence and residual risks for separate Merge/Production code-deployment approval. These actions have not occurred.

## Next delivery package: sender delivery and new employee accounts

**Recommendation:** retain the existing email/password login and add invitation-guided self-registration with confirmed email, then bind membership only through the checked acceptance RPC. Use one approved transactional sender domain for invitation and Auth confirmation messages. This avoids a privileged Auth Admin/Service Role onboarding path and minimizes changes to existing owners' login.

Concrete sequence:

1. Owner supplies the sender domain/address and the available transactional provider, plus controlled test recipients. Check current Auth signup/confirmation and redirect settings without exposing credentials.
   Read-only inspection found one `auth.users` insertion trigger, `public.handle_new_user()`, which creates only a profile. It does not automatically create an office or owner membership. Recheck this contract before implementing signup; current signup/confirmation configuration has not been verified.
2. Review a separate scope for SMTP/provider secrets and any additional delivery-state fields/RPCs. No key is pasted into chat or source. No provider cost or domain change is assumed authorized.
3. Add invite-guided signup: validate the invitation, let the employee set their password privately in the product, send confirmation, then require the confirmed Auth email to match the invitation. Possessing an Auth account alone grants no office membership. Restrict redirects and keep invitation tokens out of query strings/logs.
4. Send invitation mail server-side only after the database authorizes create/rotation. Distinguish pending, provider-accepted, delivery-failed and accepted states. Never equate an API acknowledgement with inbox delivery. Use idempotency and controlled resend/rotation; no client/case details in email.
5. Test an approved employee from invitation → confirmation → membership → assigned task. Verify failure/bounce, duplicate submission and expired/revoked links. Keep an honest manual-link fallback on delivery failure.
6. Request separate approval for real sender/Secret/SMTP activation, actual email sends, merge and Production rollout. No such action is included in this integration package.

After employee onboarding, the remaining first-client gates are persisted/versioned legal drafts, a proven recovery procedure, and the full client → matter → hearing/task → finance → document workflow. PWA, broader modules and optional refinements remain later scope.


## Proposed next scope — AXIA Invite-Guided Staff Registration

**Planning only; not implemented by this refresh.** Recommend a separate branch after approval for Auth application-code changes, before sender activation. Keep the current owner's email/password login and all existing authorization rules.

1. Add an employee signup choice within the invitation page. The employee privately enters their own password; existing account holders continue to sign in. Use the existing publishable-key/SSR client, never Auth Admin or Service Role. Do not create an organization or assign a role during signup.
2. Implement confirmation return handling using the current Supabase SSR contract, fixed internal redirects and generic responses for existing emails. Inspect live signup/confirmation/redirect settings read-only first. If settings or templates require changes, prepare them for separate approval; do not disable email confirmation.
3. Resume via the original invitation after confirmation; the raw staff token must remain out of query strings, server logs, analytics and durable browser storage. Email confirmation and invitation acceptance are separate steps. Opening a confirmation URL or creating an Auth account alone grants no office access.
4. Call existing `axia_staff_accept` only after the authenticated, confirmed email matches the invitation. The database remains the authority for office/role, expiry, revocation, duplicate acceptance, inviter demotion and single-office conflict. The current public API does not offer anonymous invite lookup; do not describe a signup screen as preventing all non-invited Auth account creation. A strict pre-signup admission gate needs a separate security design/approval.
5. Expected app files: `src/app/invitations/accept/page.tsx`, its `actions.ts`, a proposed `src/app/auth/confirm/route.ts`, narrowly scoped public-route matching in `src/lib/supabase/proxy.ts`, and invitation/Auth tests. Any new path is proposed, not claimed to exist. No migration/RLS or role change is planned; if review finds one necessary, stop and present it separately.
6. Verify existing owner login, new and existing employees, unconfirmed/wrong email, expired/revoked/rotated links, repeat submits, confirmation in another tab/device, safe redirects, tenant/task/case denial and mobile layout using synthetic Auth fixtures or a disposable local Auth/mail-capture environment. No hosted `signUp`, `resend` or real account creation during isolated checks: those calls can emit real confirmation email.
7. Then request one separate controlled-live activation scope covering the approved sender/domain, SMTP/Secrets/redirect/template changes if needed, exact test recipient and account creation/confirmation/delivery. The owner enters any credentials directly in the provider dashboard. Present exact results before requesting merge or Production code deployment.

**Risk:** medium for the future Auth-code package; the security boundary is membership acceptance, not the visibility of the registration form. Current blockers are unverified Auth/email configuration and lack of an approved new employee test identity. Sender selection/delivery remains separate; no Android expansion is required to deliver the first web client.

References reviewed for this plan: [Supabase Next.js user management](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs), [Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates), and [changelog](https://supabase.com/changelog.md), including the upcoming TLS cipher deprecation (not a reason to change this app's Auth settings).
