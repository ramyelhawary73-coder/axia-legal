# AXIA Developer Control D2-B — Audited Operator Bootstrap

Date: 2026-10-19. Bootstrap status: `VERIFIED`. **Later same-day update:** the user completed private TOTP enrollment and protected app reads. Metadata checked at 11:21:50 UTC confirmed one verified own TOTP, a matching valid server `aal2` session and actual registry/audit user events. Owner Dashboard screenshots showed the correct branch redeployed Ready at `c8c14c0`. New-tab continuity and live revoke/restore remain unverified. The sections below preserve the earlier bootstrap observations, including its then-zero factors; they are not current factor counts. See [D3 acceptance](AXIA_CONTROL_CENTER_D3_ACCEPTANCE_2026-10-19.md) for the current scope and activation limits.

## Scope and current observations

- Preserve the existing office owner membership, tenant RLS, old migration history and all D1/Android work. No new account, email, provider/SMTP/Secret change, Merge or Production application deployment is included.
- The reviewed D1 migration is already live as `20261019080134`; source SHA256 `2f9a60b32b3ad1f29956953d9c06a68859742f40840bf208d08c1e107f657ce8`. Never reapply it. Before this operation the project had zero platform principals/events.
- The owner-selected developer identity was privately reverified: exactly one confirmed, non-anonymous, non-banned user, sole owner of its office, zero verified/pending TOTP factors. No actual identity UUID/email is committed in this report or the operator source.
- A public REST profile-validation probe returned HTTP 406 / `PGRST106` and the actual exposed list `public, graphql_public`. It requested a nonexistent table with `limit=0` and an invalid profile, returned no business records, and used only an enabled public publishable key held transiently, never printed or committed. `private` and `auth` are not exposed. The root OpenAPI endpoint required a secret key; it was not pursued and no secret/Service Role key was fetched.
- Vercel's scoped connector was previously forbidden; no CLI credentials are available. The Browser extension reports that the originating browser context is unavailable. Preview configuration and user TOTP enrollment remain separate acceptance work; no automatic browser/login/session fallback was used.
- The owner's prior instruction to proceed without a backup remains recorded. Recovery is unproved, and this operation does not create a backup/export or a second cloud project.

## Reviewable operator transaction

`scripts/sql/platform-owner-operation.sql` is an operator-only transaction template, not a migration or installed RPC. `scripts/platform-owner-operation.mjs` only validates/renders private inputs; it does not connect to a database, read credentials, execute a CLI or run inside application routes.

- Fixed actions: `bootstrap`, `revoke`, `restore`; fixed role `platform_owner`. No arbitrary table/SQL/role argument, automatic login bypass or membership write.
- Binds the privately verified UUID and checks its current email only as an operator identity confirmation. Runtime authorization is still UUID/session/MFA-based.
- Requires operator `postgres` with no user/session claim. Checks the exact stored migration source SHA256, a function-definition comparison manifest matching both the disposable fixture and live database, explicit ACLs/owners/RLS, trigger bindings and unique-index state. Refuses drift before writing.
- Uses one repeatable-read transaction with 5s lock / 15s statement limits, an operator table lock and a target row lock. Checks current identity/confirmation and existing root/history before writing. It does not auto-retry a stale/concurrent/conflicting operation.
- Initial bootstrap requires no previous principal/history and inserts one principal. The existing trigger creates its one operator/null-actor/subject audit event. A verified repeated initial bootstrap is a no-op. A foreign root, revoked initial root, changed identity, unexpected role history or unsupported operation stops the transaction.
- Revoke and restore are explicit operations; repeated valid operations are no-ops. Restore rechecks confirmed/non-banned identity and never silently replaces a factor or grants another identity. Audit insertion failure rolls back the principal change in the same transaction.
- Postconditions verify one intended principal/state, the expected audit delta/attribution and unchanged office memberships. No real email, UUID, token, code or seed is stored in source/CI.

Comparison manifest for the eight D1 function definitions: `fa47e6f2ac221d0d6286a93d1d26fe77`. This is drift detection, not a backup or protection against a malicious database superuser.

## Verification before any hosted grant

- Local PGlite PostgreSQL 17.5: **19 operator checks passed**, including identity/action/literal validation, source/ACL/function/trigger drift, duplicate/foreign/bootstrap-restore restrictions, non-operator/user-claim denial, atomic rollback when audit insertion fails, exact audit attribution, revoke/restore idempotency, stale claim denial and tenant/Auth metadata preservation.
- Existing 147 application tests passed; local Typecheck/Lint and final exact-head CI are recorded on PR #46. CI runs the new operator suite on both disposable PGlite and native loopback PostgreSQL, alongside all existing staff/platform security and browser suites.
- Native mode accepts no hosted URL or credential. It creates and drops only its own newly named local test database. Real hosted grant waits for the source's native CI result; synthetic MFA states are not actual hosted MFA acceptance.

## Documentation integration and remaining action

This branch starts from the reviewed D1 head and incorporates the five current documentation files from PR #47 at `2c9b811e9193b25067293cecaa1c79e673e1f92a`. D1 code, acceptance and review files are retained. The current Roadmap is reconciled here, so PR #45/#47 must not be merged separately as duplicate implementations.

The tested bootstrap has now been executed with private identity inputs after exact-source native CI passed. No migration replay. Do not infer user readiness from the row alone: real app TOTP/cookie acceptance still requires the user's own private authenticator flow and the reviewed Preview origin/flag. Never expose QR/seed/code in chat, screenshots or logs. App-switch off is not DB-principal revocation.

### Hosted result

Source commit `e8290ccac235ce14a5ad3c98d611f0d0542273a9`; operator SQL SHA256 `47b5c5e69c613074dc47cae479675981893a7e0e0e1ca1550f9ecd07f16950b6`. [Source CI 39222494572](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39222494572) completed/success: 147 app tests; 19 staff + 21 platform + 19 operator PGlite checks; 22 staff + 23 platform + 19 operator native PostgreSQL checks; Typecheck/Lint/Build with 15 required routes and 82 browser checks. Native version 17.11; hosted 17.6; PGlite 17.5. These runtimes differ.

[Hosted metadata/hash evidence](evidence/axia-d2b-bootstrap-2026-10-19.json) confirms:

- One active `platform_owner`, bound to exactly the privately verified developer identity; one automatic `platform.owner.bootstrap` event with operator attribution/null actor and the intended subject. No manual second event, foreign principal, new account or factor.
- Existing 22 public tables / 1674 rows, public policies/grants/triggers, existing function definitions/ACLs/ownership, original history and selected Auth/factor/bucket metadata match before/after snapshots at 08:25:46 and 08:28:23 UTC. Migration count remains 23/latest `20261019080134`; no history repair/replay. Current office memberships are unchanged.
- Transaction-local database acceptance used `SET LOCAL ROLE authenticated` and temporary claims with the developer's existing own session identifier. The context required MFA; registry/audit and direct private-table reads were denied. The existing other identity/metadata was forbidden and its registry read denied. The test transaction rolled back; principal/event counts remain 1/1. This is **database claim simulation, not a real signed-in browser/SDK/cookie acceptance test**; no token was minted/read, no factor enrolled and no successful privileged read recorded.
- Verified/pending TOTP remain 0/0. Live revoke/restore were not performed; those exact transactions passed disposable tests. Security advisors have the same two WARNs and two expected private-table/no-policy INFO notices. Recovery remains unproved; no backup was created under the owner's instruction.

### Exact owner action to finish Preview activation

The Vercel connector is forbidden for the intended team, the extension lacks an originating browser context, and no local CLI/token/OIDC credentials are available. An anonymous request reached `https://vercel.com/login`, not the app API. No protection was disabled or bypass secret fetched. This is an access limitation, not missing owner authorization.

1. Open [AXIA Vercel environment settings](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/settings/environment-variables) in the owner's signed-in browser.
2. Add/update only these non-secret **Config** values with **Preview** selected and Git branch **`feat/axia-developer-control-foundation`**. Do not apply them to Production or all Preview branches, and preserve every existing variable.

| Key | Exact value |
| --- | --- |
| `AXIA_PLATFORM_CONTROL_ENABLED` | `1` |
| `AXIA_PLATFORM_CONTROL_ORIGIN` | `https://axia-legal-git-feat-axia-ad3ef0-ramyelhawary73-coders-projects.vercel.app` |

3. Redeploy the latest **Preview** for that same branch. Environment changes apply to new deployments, not an already-built one; [Vercel environment guidance](https://vercel.com/docs/environment-variables) confirms branch overrides and this behavior. No Merge or Production promotion is needed.
4. Open the [exact branch-origin platform URL](https://axia-legal-git-feat-axia-ad3ef0-ramyelhawary73-coders-projects.vercel.app/platform), sign into the developer's existing app account and complete its private authenticator flow. Use this origin rather than a different deployment hostname because MFA POST validates the exact Origin. Do not send the QR, seed or six-digit code to chat or screenshots. Report success/error text without credentials.

After the owner's private interaction, recheck actual factor/session `aal2`, app context and protected reads/cookie behavior, then perform separately bounded live revocation/restoration acceptance if needed. The console currently provides protected office registry/audit reads, not a blanket bypass of tenant legal data or every future administrative command. Preserve the sole Office Owner until the separate D3 handoff.
