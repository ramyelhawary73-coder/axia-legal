# AXIA H1 hosted session acceptance — 2026-11-24

Status: **IN_PROGRESS**. Real desktop office-session checks passed; Platform Owner/MFA and real mobile acceptance remain open. This is evidence for the tested candidate, not first-client or release approval.

## Tested version and scope

- Repository: `ramyelhawary73-coder/axia-legal`, Draft PR #52.
- Tested source: `fe8aacf763e3b47ca690926401b109b408527201` on `review/axia-release-candidate-20261121`.
- Fresh GitHub main: `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`; PR still open/draft and unmerged.
- Exact tested-head CI: [44939309029](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/44939309029), completed/success.
- Exact tested-head Vercel deployment: `dpl_B1cV5ZPxSSJ8W82Jo7BPdn1MZQ7P`, READY, matching branch and SHA.
- [Tested branch Preview](https://axia-legal-git-review-axi-d3e774-ramyelhawary73-coders-projects.vercel.app).
- Browser viewport: 1363 × 936, light theme. No mobile/device or theme-change acceptance is claimed.

The owner instructed starting the next step. The originating browser connection was unavailable; the available cloud browser reached the app login directly. The owner supplied credentials privately through the secure sign-in flow. No password, token, cookie, MFA secret, identity UUID or raw legal record is included here. The actual office session and rendered reads, rather than SQL fixtures, establish the results below.

## Observed acceptance

| Check | Result and limit |
| --- | --- |
| Login | PASS: login submitted privately, then `/` rendered the authenticated office workspace with saved data. This did not establish Platform Owner/AAL2 acceptance. |
| All 12 destinations | PASS for navigation/rendered reads: overview, matters, hearings, clients, tasks, documents, finance, library, RAJIH, team, reports and office administration. RAJIH queries, invitations, exports, writes and workflows were not submitted. |
| Saved office data | Overview, matter/client/task lists and reports showed consistent visible counts: one matter, one client, one pending task; no documents or finance entries. These are scoped UI observations, not a full database inventory or tenant-isolation proof. |
| Hearings | Calendar rendered. A new hearing, reschedule, external sync and end-to-end hearing persistence were not tested. |
| Expanded/collapsed sidebar | PASS: all 12 accessible targets retained; collapsed width 64px, targets 44px tall and current destination `aria-current="page"`. Expanded and collapsed appearances were visually reviewed. |
| Horizontal overflow | PASS at the tested desktop viewport: document width equalled viewport width, 1363px. This is not a mobile result. |
| Refresh | PASS: same-origin reload retained the authenticated session and reloaded the saved overview counts. |
| New tab | PASS: a second same-origin tab opened authenticated and loaded the same visible office counts. |
| Platform route | `/platform` rendered **إدارة المنصة غير مفعلة**. No flags were changed and no MFA prompt or privileged control reads were tested. This observed application state does not identify which configuration value is missing or invalid. |
| Logout | PASS: the existing `/platform` logout button returned to `/login`; reloading the other workspace tab redirected to `/login?next=%2F`. The browser ended signed out. |

Loading placeholders were distinguished from settled reads; the initial zero-count overview during reload was not treated as saved-data loss. The tests do not prove token-expiry refresh, cross-tenant negative authorization, real employee acceptance, or every control behind each destination.

## Findings retained for source follow-up

1. **Office identity:** the account header displays a fixed Cairo-office label while the office administration view displays a different saved organization name. The account label remains generic although the membership is visible. Bind display labels to authorized workspace/profile data and retain safe fallbacks; do not rename live records to hide the mismatch.
2. **Invitation capability copy:** team view offers creating an invitation link and correctly says automatic email delivery is disabled; office administration still says invitations require a future Invitation/Auth phase. Reconcile capability wording without enabling signup or mail.
3. **Automatic local export:** immediately after login, the existing daily snapshot UI reported preparing a local JSON snapshot and requesting its browser download, containing one active matter and one pending task. No export control was clicked by the tester. File completion/content was not inspected, uploaded or published. This is an observed automatic local side effect, so this run must not be described as having no exports. Review explicit user choice for automatic downloads before wider acceptance; this partial local snapshot is not H2 backup/recovery proof.
4. **Nested main landmark:** RAJIH renders a `main` inside the workspace `main`. The page still rendered, but the duplicate landmark should be corrected in a bounded accessibility follow-up.
5. **Library source link:** the visible published-source entry reported its original link unavailable. No substantive legal research/accuracy or source verification was performed. Keep the missing link visible until an authorized source review repairs it.

## Remaining gates and next package

- H1 remains **IN_PROGRESS**: real mobile acceptance and Platform Owner/MFA/control reads are not closed. Successful office login does not stand in for privileged platform acceptance. Mobile browser fixtures remain historical synthetic evidence only.
- Prepare bounded source corrections for office/profile labels, invitation wording, explicit snapshot download choice and the nested landmark, on a dedicated follow-up branch after owner instruction. Preserve the 12-destination sidebar and existing tenant/case/session checks. The unavailable library URL requires verified source review, not an invented replacement.
- Prepare any platform activation separately: inspect only the relevant non-secret enabled/origin settings; propose the exact branch/environment changes before applying them. No copying Secrets or broadening Production settings is authorized by this session test.
- H2 still needs an approved fictional-data/file manifest; E1 needs the controlled employee/account/mail scope; C1 still needs the sold business workflow. No main merge or Production release is authorized.

Only ordinary sign-in/sign-out and existing application reads were intentionally exercised. No business create/update/delete, invitation, email, password/MFA change, upload, restore, schema, migration, membership, activation or deployment configuration action was submitted. Auth necessarily updated session state; no before/after database fingerprint was taken. The automatic local snapshot request above is explicitly retained as an observed exception to the read-only intent.

This follow-up changes acceptance documentation only. The runtime tested above stays pinned to `fe8aacf`; a later documentation head must not be described as the browser-tested SHA. Run `git diff --check` for the documentation delta; retain exact-head CI/Preview status separately.
