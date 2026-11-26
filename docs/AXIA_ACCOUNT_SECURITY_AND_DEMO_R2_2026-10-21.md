# AXIA Account Security and Existing Demo R2

Date: 2026-10-21. Baseline PR #48 `44fecb77eca1960140bacfe1ca0cd4adb96027e5`; same branch `feat/axia-control-center-client-readiness`. Main remains `c0fd6a6`. No merge or Production deployment.

## Current owner decision

The owner confirmed control of the existing second account's mailbox and chose that account for the demo. Reuse its existing office B, client and linked case; do not create another account/office, send mail or purge trial records. This supersedes D4's earlier proposed new-mailbox, transfer-to-A, suspend-B and fresh-seed sequence. A's sole owner membership remains unchanged until a separately reviewed handoff can preserve ownership. No customer legal contents or real credentials are included here.

## Source implementation

`/platform` now offers an explicit **أمان الحساب** panel. Its POST endpoint `/api/platform/password` uses the ordinary same-session Supabase Auth client, fresh confirmed Platform Owner identity and AAL2, plus the already configured exact HTTPS Origin. It accepts no target user, email, role or metadata. Body size is bounded to 4 KiB; passwords are 12–128 characters and confirmed. Unknown keys, oversized/malformed JSON, anonymous/unconfirmed/foreign identity and missing MFA fail closed.

The owner privately enters the password. Uncontrolled secret fields clear before submission; values are never placed in local/session storage, source, logs or response bodies. Requests are never automatically retried. A successful response requires the same provider user ID; provider errors are sanitized. An uncertain result preserves the current session and asks the owner to test another window before retrying. Existing logout remains an explicit owner action.

If the live Auth policy demands the current password or a reauthentication nonce, the UI presents that requirement without weakening settings. A nonce is requested only by the owner's explicit **إرسال رمز تأكيد إلى بريدي** button through `auth.reauthenticate()`. No email is triggered on render, failed password update or automatic retry. A provider acceptance response is labelled as a request, not proof of delivery. Actual sender delivery and unknown-current-password recovery remain unverified; do not route recovery through the signup-only confirmation handler or disable MFA/security policies.

No administrator Auth client, Service Role, direct Auth writes, password hash access, new account, security-setting/Secret/SMTP change or new migration is involved. The assistant did not change the owner's actual password or request/send real email.

## Bounded live demo preparation — completed

At **14:17:39 UTC / 17:17:39 Cairo**, an operator transaction changed only the existing three display names:

| Existing record | New display name | Count |
| --- | --- | --- |
| Office B | مكتب AXIA التجريبي | 1 |
| Its client | عميل تجريبي — بيانات وهمية | 1 |
| Its linked case | قضية تجريبية — اختبار النظام | 1 |

Exact expected IDs, previous synthetic names, slug, confirmed sole-owner mailbox, relationships and cardinalities were checked under row locks. Drift would abort the transaction. IDs/slug/relationships were retained. Before/after fingerprints inside the transaction confirmed other offices/clients/cases, all tasks/memberships, selected non-secret Auth metadata and migration history unchanged. No identity impersonation or claims were set. Existing client/case triggers appended two correctly operator-attributed audit events listing only `name`/`title`; a third explicit `operator.demo.prepared` event records the narrow scope and zero account creations/deletions. Existing audit remains intact. No SQL file/migration is added for replay.

Result: two Auth users, two offices, two memberships and 24 migrations remain. Existing Platform Owner, verified MFA and RLS are retained. This is a small authorized business-data write on the shared Preview/Production database, not a hosted login, workflow or recovery acceptance test.

## Verification

Local Typecheck, strict Lint and 174 application tests pass, including six new password endpoint security tests (27 platform tests total). Clean-cache Build passes with 18 required routes. The initial local build hit a stale Turbopack persistence cache; moving generated `.next` output aside resolved it without source/config changes.

Desktop/mobile browser fixtures cover blank/cleared private fields, mismatch without a request, policy-required nonce, explicit-only code request, success, malformed response and MFA expiry at 1440/390/320px. All fixture passwords and mail responses are synthetic on loopback; outbound hosts are blocked. Screenshot capture occurs only with empty fields. Exact-head CI/Preview results are recorded on PR #48 after the source push; no hosted password/email mutation is performed to test the source.

Independent signed-in hosted acceptance is still limited by the missing Vercel MCP grant for the existing team and unavailable originating browser. The already configured branch Preview remains the review target; no Config/Secret changes are requested or made.

## Owner's next step

1. Open the branch Preview `/platform` with the current developer session and complete existing MFA if requested.
2. Choose **أمان الحساب**, enter a fresh private password and confirmation, then save. Do not use a password previously shared in chat.
3. Follow the actual policy requirement if shown. If the current password is required but unknown, retain the open session and arrange a reviewed recovery flow; do not disable security or repeatedly submit guesses.
4. Keep this window open; verify the new password and MFA in another private window. Only the owner's successful submission changes the real password.
5. Sign into the existing confirmed demo account in a separate browser profile and open **مكتب AXIA التجريبي**. Review its one fictional client/case. Subsequent task/employee/Storage/export tests remain separately bounded H1/H2/E1 work; there are no new employee accounts or delivered invitations in R2.
