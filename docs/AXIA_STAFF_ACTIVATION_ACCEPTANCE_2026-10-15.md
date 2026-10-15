# AXIA Staff Activation & Integration Verification — 2026-10-15

**حالة التسليم:** الحزمتان مجمّعتان على فرع مستقل للمراجعة. SQL الحي لم يُطبّق، وإرسال البريد وإنشاء حسابات الموظفين الجديدة غير مفعّلين.

## Verified baseline and integration

- Main: `dfb557f2741ca521b13fd727abeb0f2c25803fd5`.
- PR #40: `2a189f0bbde7141f43160dc3b714861eb6684c10`, open/draft.
- PR #41: `576bf1fcdf39d78fc3a6d6e5fb908b112eecf05f`, open/draft.
- Integration branch: `feat/axia-staff-activation-acceptance`, created from latest main. Neither source PR was merged, closed, reset, or rewritten.
- Combined both complete patches. Conflicts were limited to roadmap state and Team heading copy. Kept the newer invitation heading, corrected initials splitting, snapshot readiness guard, local-only export, real legal library, invitation APIs/UI and assignment/reassignment controls.
- Added accessible labels to the existing mobile navigation controls so keyboard/screen-reader and automated navigation can use them.
- No application dependency, package.json, lockfile, live database, SMTP, Auth setting, secret or Production configuration was changed.

## Activation decision: HOLD

Read-only live checks confirmed 21 migration history records, no `public.staff_invitations` table and no `public.axia_staff_accept(text)` RPC. The new migration has not been applied.

Vercel project inspection still returned **403** for `ramyelhawary73-coders-projects`. No usable authenticated CLI was available. The Production/Preview Supabase mapping remains unverified; the requested two non-secret `NEXT_PUBLIC_SUPABASE_URL` values were not provided. A Development label is not proof of a separate data boundary.

The owner explicitly authorized only a proven isolated Development target. Therefore no migration or live permission test was run against `qshgczulivsxztgrbqew`. Development authorization persists and does not need to be repeated once the target is proven. If Production shares that project, stop for a changed scope or establish an independent Development target; do not infer Production permission.

### Exact migration identity

File: `supabase/migrations/20261015081218_axia_staff_email_invitations.sql`.

SHA-256: `1e2a29f97c109689cf2a9abacc5f970e87920bae418116cbb3b12f828646ad2b`.

Byte-for-byte equal to PR #41. No SQL correction or historical migration repair was introduced. Live history remains 21 records versus 19 baseline source files; do not replay, rename, reset, or blanket-push those migrations. Revalidate the prerequisite tables/helpers/grants and reviewed fingerprint immediately before any future activation.

## Verification story and evidence limits

Story: office management creates an email-bound invitation → an existing confirmed account accepts it → a tenant membership is created atomically → an eligible employee receives a task only if they already have case access.

| Boundary | Evidence | Limit |
|---|---|---|
| Combined application contracts | 113 application tests pass locally: original 92 plus both packages' 21 behavior tests | Handler tests use controlled doubles; not real Auth sessions |
| SQL authorization/state | 19 isolated PostgreSQL 17.5/PGlite checks pass locally | Scaffold matches verified live prerequisite contracts; not full historical replay |
| Multi-session SQL | Added a disposable PostgreSQL 17 service and three concurrent checks to CI | Exact-head CI result is authoritative; no Supabase host is used |
| Desktop/mobile rendering | Added browser contract automation for light/dark login at 1440/390/320px and Team/Library/Tasks/acceptance at 1440/390px | Uses synthetic API responses on loopback; never claims real login, email or live tenant acceptance |
| Actual Preview/build | Exact-head default build, CI and Vercel deployment status attached to PR | Deployment success alone is not live acceptance |
| Live SQL/Auth/SMTP | No mutation; activation held | Needs proven Development mapping and authorized test identities |

### Browser verification design

Pinned test-only Playwright 1.56.1 and Chromium headless shell are installed outside application dependencies. The runner starts the app and browser in the same loopback context, waits for the server's TCP listener, runs the checks, and stops its own server. This avoids the earlier cross-session network failure and does not cancel initial page compilation with repeated short HTTP probes.

Checks exercise actual application components and browser events: mobile menu navigation, creating a link without claiming delivery, rendering reviewed metadata, saving task assignment, accepting a fixture invitation and removing its token from the address bar, plus document-width overflow checks. Screenshots and JSON evidence are uploaded as a seven-day CI artifact. All identities are `example.invalid` fixtures; external requests are blocked. No real account, recipient or provider is contacted.

This is UI contract verification, not a substitute for real Supabase/Auth acceptance. Local development compilation was too slow in the execution environment; CI uses the production build and the same checked-in automation. Do not report unmeasured browser results as successful.

### Concurrent SQL checks

The same 19 security checks can run against either PGlite or a real PostgreSQL driver. Native CI adds:

1. Two creates for the same pending email produce one invitation; simultaneous accepts produce one membership and one acceptance audit event.
2. Rotation racing acceptance cannot overwrite an accepted invitation or grant membership twice.
3. Two offices inviting the same recipient concurrently cannot silently join that recipient to both offices.

The native test adapter has a fixed loopback host and fixed disposable database name. It does not accept a live connection URL. The service is loopback-bound and contains only synthetic data; it is destroyed with the job. No Service Role or application secret is used.

## Controlled Development acceptance after the gate clears

1. Refresh main/PR heads, project mapping, prerequisite object definitions and migration history; compare the exact SHA-256 above. Apply this one migration only if all checks agree and Development is separate.
2. Inspect new table RLS/FORCE RLS, column grants, invoker wrappers, private function execution, assignee guard and security advisors. Confirm original policies and memberships were not rewritten.
3. Use explicitly authorized test identities with confirmed email. Verify owner/admin role restrictions; wrong/expired/revoked/rotated links; repeat acceptance; inviter demotion; existing-member non-promotion; case and tenant denials; create/reassign/refresh persistence.
4. Verify actual login, inline account switching, session expiry and mobile behavior in Preview. Test email delivery only in the later approved sender scope; fixtures are not delivery proof.
5. Keep audit records and business data. On pre-commit SQL failure, the migration transaction rolls back. After activation, prefer code rollback with tables/memberships/audit retained; do not automatically drop tables or delete memberships.
6. Present exact-head results and remaining risks; require separate merge/Production approval.

## Next delivery package: sender delivery and new employee accounts

**Recommendation:** retain the existing email/password login and add invitation-guided self-registration with confirmed email, then bind membership only through the checked acceptance RPC. Use one approved transactional sender domain for invitation and Auth confirmation messages. This avoids a privileged Auth Admin/Service Role onboarding path and minimizes changes to existing owners' login.

Concrete sequence:

1. Owner supplies the sender domain/address and the available transactional provider, plus controlled test recipients. Check current Auth signup/confirmation and redirect settings without exposing credentials.
2. Review a separate scope for SMTP/provider secrets and any additional delivery-state fields/RPCs. No key is pasted into chat or source. No provider cost or domain change is assumed authorized.
3. Add invite-guided signup: validate the invitation, let the employee set their password privately in the product, send confirmation, then require the confirmed Auth email to match the invitation. Possessing an Auth account alone grants no office membership. Restrict redirects and keep invitation tokens out of query strings/logs.
4. Send invitation mail server-side only after the database authorizes create/rotation. Distinguish pending, provider-accepted, delivery-failed and accepted states. Never equate an API acknowledgement with inbox delivery. Use idempotency and controlled resend/rotation; no client/case details in email.
5. Test an approved employee from invitation → confirmation → membership → assigned task. Verify failure/bounce, duplicate submission and expired/revoked links. Keep an honest manual-link fallback on delivery failure.
6. Request separate approval for real sender/Secret/SMTP activation, actual email sends, merge and Production rollout. No such action is included in this integration package.

After employee onboarding, the remaining first-client gates are persisted/versioned legal drafts, a proven recovery procedure, and the full client → matter → hearing/task → finance → document workflow. PWA, broader modules and optional refinements remain later scope.
