# AXIA H1 source corrections — 2026-11-24

Status: **PREVIEW_READY** for owner review. Runtime `2675fb443bf7aeb2c32bfd5f288f2aa086480d28` passed complete CI and has a matching READY Preview. A subsequent documentation-only head receives its own checks; do not substitute it for the tested runtime evidence. Owner authorized these source corrections, tests and a review Preview on a separate branch. This does not close hosted H1 or authorize a release.

## Branch and behavior

- Branch: `fix/axia-h1-review-20261124`, based on Draft #52 at `aaed2fe6e84662cefdebe490652e8cec7c5377c3`.
- Fresh main remains `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`. All integrated candidate work is preserved. A review PR against main includes that inherited package; do not merge #52 and this branch as separate duplicate packages.
- Account pill and menu load the existing SSR/RLS-scoped, read-only `/api/administration` response. They show the saved organization name, current profile label and verified role. Empty names retain neutral fallbacks. Loading/provider/malformed-response failures retain neutral display and offer manual retry. A missing profile name remains generic; no real account is renamed and no name is inferred from an email.
- Remove the simulated Cairo/Alexandria/corporate workspace switcher and unsupported fixed license, registration/address, connection and business-count claims. This removes display simulation; no actual workspace selection or membership permission is added.
- Office administration points to the team screen for invitation links under existing permissions/service availability, and states automatic email sending is unavailable. Existing invitation APIs/flags and sender behavior are unchanged.
- Daily snapshot automation is off by default. Legacy true preferences without a new explicit consent marker cannot download on app open. New opt-in is tied to this office/account on this browser; consent from a different account or office does not authorize an automatic download. The raw old preferences/history/vault are not deleted on read. Manual export still works without automation, through the new account-menu entry. Saving settings does not immediately export; consent applies on a later page opening. Existing once-per-day and loaded-data guards remain. These local snapshots stay partial and unencrypted; this is not H2 backup/recovery.
- RAJIH uses a named section inside the workspace main landmark. Navigation grouping, 12 destinations and authorization remain unchanged.
- The missing legal-library source link is still reported unavailable. Verifying/repairing its legal source and platform activation remain separate scopes; no fabricated URL is added.

## Files and verification

Runtime changes are limited to app-shell, office-workspace, snapshot manager/hook/service/type and the administration/RAJIH views. The existing UI verification script and operational-readiness tests add regression evidence. No dependencies, lockfile, workflow, API handler, migration, RLS, Auth, membership, SMTP, Secret, feature flag or Production configuration is changed.

Local checks passed: Typecheck, strict Lint, 177 safety tests (three new snapshot regressions), production Build and all 18 required routes, and `git diff --check`.

The new behavior tests prove fresh/legacy preferences do not download, preferences are retained on read, consent is office/account-bound, automatic download occurs at most once daily, revoked consent blocks it, and manual export remains possible.

The compiled browser suite adds account identity/role rendering and fallback/retry, removal of fixed claims, invitation wording, one RAJIH main landmark, fresh/legacy no-download, explicit choice followed by next-open automatic download, no immediate download on save, one-per-day behavior and manual export. Four responsive scenarios cover 1440×900 dark, 1024×620 light, 390×844 dark and 320×568 light. These are synthetic loopback tests; they do not establish hosted mobile/MFA acceptance.

The local compiled-browser run could not launch system Chromium because the executor denied its socket operation. No browser assertion ran in that attempt. The committed CI uses the existing supported Ubuntu 24.04/Playwright setup to run the complete browser and disposable SQL suites; exact-head results and Preview must be recorded before reporting readiness. No permissions or browser protections were changed to work around the executor restriction.

## Remaining acceptance

Real owner review of the changed candidate, hosted mobile/expiry checks, and platform MFA/control reads remain open. H2 fictional-data/file manifest, E1 controlled employee/mail scope and C1 sold workflow are still required. No main merge or Production release occurred. All downloads exercised in regression tests contain synthetic fixture data only.

## Publication authorization

The owner explicitly approved publishing `fix/axia-h1-review-20261124` to `ramyelhawary73-coder/axia-legal`, opening a review PR and preparing its Vercel Preview on 2026-11-24 after automatic review requested a destination-specific instruction. That approval resolves the earlier publication gate. Merge and Production release remain outside this package. The CLI cannot obtain a GitHub username in this executor; use the existing connected GitHub account to publish the same verified source tree, without adding credentials to the checkout.

## Responsive regression correction

Initial source `b966d55` passed Typecheck/Lint, 177 tests, all disposable SQL/concurrency checks and Build on CI 45447029231, but the new profile-menu check caught an off-viewport header control at 320px. Desktop/1024px/390px H1 scenarios passed before that failure. The profile menu now uses viewport-inset positioning and bounded vertical scrolling below 640px, retaining its existing desktop anchor. The assertion and viewport matrix are unchanged; rerun exact-head CI before acceptance.

Source `69c1154` then passed complete CI 45447891421: 177 tests, isolated SQL/concurrency, Build and the compiled responsive browser suite. All four profile screenshots were produced, including 320px. Visual review also found overly wrapped snapshot-tab labels at 320px; they now use non-shrinking, single-line, 44px targets in a horizontally scrolling row, with shorter preview/history wording. The browser checks now explicitly assert readable tab whitespace and target height. Repeat current-head CI for this final visual adjustment.

## Final source verification and handoff

- Review package: [Draft PR #53](https://github.com/ramyelhawary73-coder/axia-legal/pull/53), against main. It includes the full #52 candidate plus these bounded corrections; do not merge both packages independently.
- Tested runtime head: `2675fb443bf7aeb2c32bfd5f288f2aa086480d28`, tree `fca0592b4794f1e86516c2f609cd5b08af76bfe4`. [CI 45449134465](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/45449134465): completed/success, including Typecheck, strict Lint, 177 safety tests, disposable PGlite and PostgreSQL/concurrency, Build/all 18 routes, 199 synthetic browser layout/flow records and 10 compiled HTTP safety checks.
- Matching Vercel deployment: `dpl_FE5rvXSaNZ1WwXSwg47Yt85HEFiL`, READY, same branch/SHA, Preview target. [Review Preview](https://axia-legal-git-fix-axia-h-cc8805-ramyelhawary73-coders-projects.vercel.app). No activation/configuration was copied to the new branch.
- Passing UI evidence: Actions artifact `14946693057`. The final report contains 199 records, with profile/snapshot screenshots at 1440×900, 1024×620, 390×844 and 320×568. The corrected 320/390 snapshot screenshots were visually reviewed, alongside the preceding profile images. Mobile tab text remains on one line in its own horizontal scroller, with 44px targets.
- The connected local Chrome reached the earlier candidate login page, then reported an open extension UI blocking further automation. No hosted credentials were inspected or submitted during this source-correction package. This is not a fresh hosted signed-in/mobile/MFA acceptance run.
- Final follow-up changes only this report and the canonical roadmap. Runtime, tests, workflow, migrations, dependencies and lockfile remain byte-identical to tested `2675fb4`; inspect current #53 Checks separately before any later merge decision. No new code tests are required for unchanged runtime; documentation diff checks pass.

## Connected hosted follow-up — 2026-11-25 Cairo

The browser connection recovered. [Direct hosted correction review](AXIA_H1_CORRECTIONS_HOSTED_REVIEW_2026-11-25.md) passed at deployed documentation head `c126fd6db2609a92b47aae8e77227d3d36683c1e` (same runtime as `2675fb4`): account/admin identity and copy, unchecked snapshot automation/consent, zero visible export history after reload, 320/390px menu/dialog/scrolling and RAJIH's single main landmark. Current-head CI 45450290168 completed/success and matching deployment `dpl_81zqN544WeWnpBYBZ3ydyUmcXN2d` was READY. No live export or settings save was performed. Desktop viewport overrides are not physical-mobile tests. Platform remains disabled; token expiry, real-device and privileged MFA/control gates remain open.

Owner next step: review #53 and the new Preview alongside the direct hosted report, then plan the remaining bounded H1 gates. Platform activation needs its own exact non-secret branch/origin review. No main merge, Production release or live business/configuration write accompanies this handoff.
