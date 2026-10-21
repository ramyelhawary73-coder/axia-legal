# AXIA Delivery Readiness R1 — read recovery and first-client acceptance gates

Date: 2026-10-21. Base: PR #48 `50b6a155821b85c6790969ce3889c774b1110272`. Continue on the existing independent `feat/axia-control-center-client-readiness` branch so the owner's Preview Config scoping is preserved. Main remains `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`; no Merge or Production release.

## Fresh evidence and the actual delivery gap

Read-only inspection of shared Supabase at 07:20 UTC / 10:20 Cairo found 24 migration records/latest `20261020054338`, exactly one D3 application, two offices/users/memberships, one active Platform Owner and one verified factor. All public tables have RLS. No office overrides/member blocks/support grants, staff invitations, durable drafts/history or Storage objects exist. Twelve immutable control events record capabilities (3), list (3), overview (4), members (1) and audit (1), through 2026-10-21. That supports successful hosted protected reads; it does not prove actual mutation, employee mail, file bytes or recovery acceptance.

See [aggregate evidence](evidence/axia-delivery-readiness-r1-2026-10-21.json). No customer rows, emails/UUIDs, tokens, factor material or credentials were retrieved into the report.

GitHub reverified the baseline CI 39413639675 as successful. Vercel project inspection still returns 403 for team `ramyelhawary73-coders-projects`; its remediation specifically requires granting this MCP connection access to that team via Vercel consent/app installation. SSO alone does not add a missing team grant. No CLI is installed and the originating connected browser is unavailable. Use normal connected access; never request keys, copy session tokens or disable deployment protection.

## R1 changes — workflow reliability, no new authority

The original overview can stay on its loading message after a failed read. Members/audit retain the old page's rows and member edit controls while a new page fails. Support has no loading/retry state; response decoding can expose browser parser errors. These are client-state defects even though server permissions remain authoritative.

- A shared read-only query hook keys state by request/action/cursor/revision/dataset, removes stale rows immediately, aborts abandoned reads, ignores late results and reports a 15-second timeout.
- Explicit manual retry and separate loading/error/empty states for capabilities, office directory/overview, members, timed-support records and office audit.
- Malformed/non-JSON and missing-data responses have Arabic errors. Network failures have an actionable Arabic message.
- Read recovery never automatically retries configure/member/create/support/export actions. Permission/MFA denial still returns to the existing protected MFA entry; no enrollment is automatically performed.
- The existing authorization, reasons, confirmation, revision checking, support duration, encrypted backup limits, case/tenant enforcement and Android are preserved.

## Verification record

Local Typecheck, strict Lint and 164 application tests are checked during implementation; final CI/Preview status is recorded on PR #48 Checks. The browser suite retains all existing 320–1920/light-dark/date/backup/draft cases and adds Desktop 1440/light and mobile 390/dark failure/recovery scenarios: failed capabilities, disconnected directory, failed overview, malformed members pagination, failed audit pagination, hung request with accelerated browser clock, late support-dataset response and MFA-required after navigation. It asserts no stale editable rows and no configure/member/create/export calls during retry. All fixtures are synthetic, target loopback only and abort external requests.

Local Chromium is unavailable in this restored workspace; browser acceptance runs through the pinned CI browser. A restored Turbopack cache was unreadable and was moved aside without deleting it before a clean build. No dependency or application workaround is introduced.

## Ordered delivery plan — finish these gates before expanding features

| Gate | Work and exit condition | Current state / authorization boundary |
| --- | --- | --- |
| R1 — workflow reliability | Verified error/retry/timeout/stale-response behavior; green CI and Preview; updated roadmap | Current source package. No live business writes. |
| H1 — actual signed-in Preview | Restore normal Vercel team access/connected browser. Existing owner privately signs in and verifies MFA. Confirm own-office login and root directory/members/audit on Desktop/Android and session refresh. | Hosted read audit exists; fresh full browser/session acceptance is incomplete. No new approval is needed to repeat already authorized read-only checks. No QR/code sharing. |
| H2 — controlled writes/files/recovery | Agree one fictitious office and retained test records/file manifest. Verify explicit configuration, suspend/reactivate/expiry, case/draft save/conflict, support start/end/isolation, actual Storage HTTP preflight/finalization/quota, encrypted download/decrypt and recovery into a disposable isolated target with row/file hashes. | Live shared-data writes need a concrete approved fixture/change list. No live test executed by R1. Never apply migrations again or mutate a paying office to simulate a test. |
| E1 — first employee onboarding | Choose one owner-controlled test mailbox and its office/least-privilege role. Review current Auth confirmation/redirect and sender setup read-only. Prepare exact provider/flag/redirect/template scope; owner enters any credentials privately. After scoped approval, verify invitation → signup → actual confirmation mail → original-link acceptance → allowed task/case access, plus wrong email/office/expiry/reissue/revoke denial. | No eligible unassigned test identity currently exists. No account creation, real email or SMTP/Secrets/Auth configuration is authorized by R1. Keep existing sole owner membership. |
| C1 — first-client acceptance | One full client → case → task/reassignment → hearing → document → draft → audit → encrypted recovery walkthrough, light/dark/mobile, with the intended client roles; no placeholders presented as successful business operations. | Depends on H1/H2/E1. Source CI does not close these hosted gates. |
| P1 — release and handover | Final exact-head review, owner approval, Merge/Production deployment approval, verify live main/login/roles, documented support/recovery and client handover. | Explicit separate release approval. Do not enable Production flags by copying Preview settings. |

Next concrete action: finish R1 verification, restore the existing Vercel connection's team grant and originating browser context, then execute H1. Do not ask the owner to create another free cloud project. Prepare the exact H2/E1 live changes for review after access/identity evidence exists; do not ask for speculative blanket permission.

## Deferred until first delivery is stable

Payment-provider integration, scheduled/chunked enterprise backups, usable hosted service-wide restore, native Android backend/device work, new modules and broader autonomous RAJIH actions are later packages. Maintain the current bounded legal tools; never call a legal agent or backup enterprise-ready solely because a UI test passes.

## Files and unchanged boundaries

Application: `src/components/control-center.tsx`, `src/components/platform-console.tsx`, new `src/components/use-control-query.ts`, new `src/components/control-query-notice.tsx`. Tests: `scripts/verify-integration-ui.mjs`. Documentation/evidence: this file, `docs/AXIA_MASTER_ROADMAP.md`, the linked aggregate JSON.

No SQL/migration/RLS, Auth setting, role grant, membership, SMTP, Secret, account, real mail, dependency, Android or server API modification. No Service Role, Merge or Production application deployment.
