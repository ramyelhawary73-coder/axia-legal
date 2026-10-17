# AXIA Invite-Guided Staff Registration — 2026-10-17

**Status: application implementation; hosted activation remains disabled.** No new Auth account, hosted signUp/verification call, actual mail, SQL mutation, SMTP/Secret/configuration change, merge or Production deployment was performed. A built UI or synthetic acceptance is not live employee onboarding proof.

## Baseline and branch

Fresh read-only verification found main `558245314e156ea856347cd7ea5aae6d4f7202e9` and Draft PR #42 at `f46f705681a3d9fb329fd9704782c583c7857a7b`, both unchanged. The owner authorized starting the previously proposed isolated registration package. Branch `feat/axia-invite-guided-staff-registration` starts at that tested PR head, retaining the complete invitation/assignment, operational-readiness and Android compatibility work. Its Draft PR targets the PR #42 branch so reviewers see this package separately. Neither PR is merged by this work.

Supabase was inspected read-only: `qshgczulivsxztgrbqew`, latest migration `20261016083929`, 2 Auth users, 2 memberships, 0 invitations. The actual `public.handle_new_user()` trigger inserts only a profile (id/full_name), not an organization or role. No migration was replayed or authored. Auth signup/confirmation/redirect/SMTP configuration is not independently verified; no credential retrieval was attempted.

## Resulting employee flow

1. Open the original staff invitation. Its raw token stays in page memory and is removed from the URL; it is not added to signup requests, query strings, cookies or persistent browser storage.
2. Existing confirmed accounts use the existing invitation login. When registration is activated, new employees can choose signup, use the invited email and privately set a 12–128-character password with confirmation.
3. The bounded same-origin signup endpoint sends only normalized email/password and a fixed approved email callback to the existing Supabase SSR client. It sends no role, office, metadata or staff token, and creates no membership.
4. Confirmation supports a PKCE code or an email/signup OTP hash. It does not handle recovery/invite actions or arbitrary redirects. It checks the current session before exchanging credentials, so clicking another account's confirmation cannot silently replace a signed-in owner. HEAD cannot consume a credential. After successful verification, a fresh `getUser()` must be confirmed and non-anonymous.
5. The employee reopens the original invitation and accepts explicitly through the unchanged `axia_staff_accept` RPC. The original database checks remain authoritative: matching verified email, pending/non-expired/non-revoked link, inviter privileges, one office, idempotency and no promotion of existing members. Confirmation alone is not membership.

Reopening the original link in the same tab can be a fragment-only navigation. Browser verification reproduced a missing acceptance button in that case; the page now handles hash/popstate events, scrubs the URL again and reloads session metadata. An earlier acceptance response cannot mark a newly opened, different token as accepted.

## Application and security boundaries

- `POST /api/staff-registration` is off by default. Both activation and a configured HTTPS application origin are required before any Auth client call. The request's Origin must equal that reviewed origin; no request-supplied redirect, forwarded-host value, role or organization is trusted.
- The JSON stream is capped at 4096 bytes, including requests without Content-Length. Invalid email, empty/short/overlong/mismatched passwords, wrong Origin, active sessions and identity-service errors fail closed.
- Existing email responses and eligible new email responses share a generic check-email result. The UI never claims inbox delivery. Rate-limit/provider errors are sanitized. Unexpected auto-confirm sessions are signed out locally and rejected; this cannot undo an already created Auth account, so verified confirmation settings are a prerequisite before activation.
- The callback returns only to the configured internal invitation landing with a status value; Auth credentials are stripped from that redirect. Headers use private/no-store, no-referrer and noindex. A wrong callback Host is rejected. Standard Auth callback credentials still arrive in the callback query; hosting/provider log handling must be reviewed before live activation. Staff invitation tokens never use that query.
- Proxy exceptions are limited to the exact `/auth/confirm` and `/api/staff-registration` paths. Neighboring routes stay protected. Existing owner login actions and SSR client/session implementation are unchanged.
- The current foundation has no anonymous invite lookup. This is invitation-guided signup, not a claim that non-invited Auth accounts are impossible. Access to an office still requires the checked invitation RPC. Strict pre-signup admission or extra CAPTCHA/rate-limit infrastructure needs a separately reviewed scope.
- SQL, RLS, roles, package/dependency versions, Android files and existing login actions are unchanged. No Service Role or Auth Admin path is used.

## Verification and evidence limits

Local verification passed: Typecheck, Lint, **130 application tests**, **19 PGlite SQL checks**, production Build and **10 required compiled routes**, **55 browser layout/flow checks**, and **2 actual compiled HTTP checks** proving disabled registration/confirmation. Screenshots were inspected at 390px light and 320px dark. Exact-head CI additionally runs the native PostgreSQL concurrency suite.

The package includes behavioral route/SDK-stub tests for activation, body bounds, Origin validation, generic existing-email responses, owner-session protection, auto-confirm rejection, OTP/PKCE validation, safe redirects, no membership side effects and exact Proxy exceptions. These stubs never call hosted Auth.

The production build must include all 10 required web routes. The first local build encountered an unreadable old Turbopack persistence cache; the generated `.next` directory was archived and a clean build passed. No application database was repaired or changed.

Browser verification runs the built application on loopback, forces hosted registration off, blocks external browser requests, and checks the real compiled disabled signup/callback HTTP handlers before using fixtures. Synthetic signup/session/confirmation API responses exercise the UI flow at 1440/390/320px in light/dark, including reopening the original link in the same tab, explicit acceptance, empty persistent token storage and the disabled-registration state. They do not prove actual email delivery, PKCE cookies or real Auth sessions across browsers/devices. Real cross-device confirmation remains a controlled-live acceptance case; the UI explains reopening the original invitation and signing in when confirmation happened elsewhere.

The existing isolated SQL suites remain required: 19 PGlite checks and 22 native PostgreSQL checks including concurrent acceptance/rotation/office conflict. They never target the shared Supabase database. Exact final-head test counts, CI and Preview links are attached to this package's Draft PR; no earlier-head result substitutes for them.

CI's pull_request base-branch filter now also includes `feat/axia-staff-activation-acceptance` for this stacked PR. Job permissions, disposable PostgreSQL service, test-only dependencies and all existing steps are retained; no secret-bearing deployment job was added.

## Controlled activation plan — next package, not executed here

Keep these non-secret server settings disabled until the concrete configuration review and controlled-live scope are approved:

| Setting | Prepared default | Activation requirement |
| --- | --- | --- |
| `AXIA_STAFF_REGISTRATION_ENABLED` | `0` / absent | Set `1` only for the reviewed environment/branch after Auth/mail checks |
| `AXIA_STAFF_REGISTRATION_ORIGIN` | empty | Exact approved HTTPS origin, with no extra path, query or fragment |

1. Inspect hosted email signup, email confirmation, signup trigger, Site URL, redirect allowlist, session/cookie behavior and current SMTP sender/provider read-only. Confirm email verification remains enabled. Do not disable it to make a test pass. Do not create a second cloud database or replay the invitation migration.
2. Select the project's sender domain/address and transactional provider using actual ownership/configuration evidence. Prepare exact redirect/template/SMTP/non-secret flag changes for review. Any credentials are entered privately in the provider/Vercel dashboard, never chat or source. No sender domain or cost is assumed authorized.
3. Name one controlled employee test email not already joined to another office, its intended office/role and the exact authorized create/confirm/send/accept actions. Current users are already owners. Do not use arbitrary real staff as test recipients.
4. Apply only the approved configuration to the intended Preview first. Because Preview and Production share a database, account creation and membership are live data changes even on Preview. A normal `signUp` may send mail; there is no harmless hosted-signup dry run.
5. Verify one real employee: invitation → signup → confirmation → original invitation → acceptance → eligible task, plus denied wrong-email/office/role and expired/revoked links. Check owner login remains usable, email delivery status, PKCE in the original browser and confirmation on another device. Do not auto-delete live test accounts, memberships or audit rows afterward; agree on retention/cleanup separately.
6. Present exact configuration/results and final-head evidence before any merge or Production code deployment. PR #42 is still a prerequisite; this package does not silently merge it or retarget itself. Persistent legal drafts, a proven data/Auth/Storage recovery procedure and the full first-client business workflow remain separate delivery gates.

References reviewed: [Supabase signup](https://supabase.com/docs/reference/javascript/auth-signup), [Next.js SSR user management](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs), [Auth email templates](https://supabase.com/docs/guides/auth/auth-email-templates), installed Next.js 16.3.3 route-handler documentation, and transactional-email guidance. No email template/provider was changed.
