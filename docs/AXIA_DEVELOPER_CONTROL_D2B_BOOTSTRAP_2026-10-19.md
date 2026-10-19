# AXIA Developer Control D2-B — Audited Operator Bootstrap

Date: 2026-10-19. Status: `IN_PROGRESS`. The owner approved starting the next step with authority to execute it. A real grant is not claimed until the live evidence is appended below.

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

After exact-source CI passes, execute only the tested bootstrap with private identity inputs and capture one intended principal/event, unchanged tenant data/security/history and continued MFA-required/other-user denial. No migration replay. Do not infer user readiness from the row alone: real app TOTP/cookie acceptance still requires the user's own private authenticator flow and a reviewed Preview origin/flag. Never expose QR/seed/code in chat, screenshots or logs. App-switch off is not DB-principal revocation.

### Hosted result

Pending exact-source CI and bootstrap execution. No live role grant or real MFA/cookie acceptance is claimed by this preparation commit.
