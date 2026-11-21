# AXIA integrated review candidate - 2026-11-21

Status: **PREVIEW_READY**, owner review pending. [Draft PR #52](https://github.com/ramyelhawary73-coder/axia-legal/pull/52). This records source preparation and isolated checks, not a Production release or first-client acceptance.

## Authorization and source

The owner explicitly approved preparing this package for review/testing without merging main, deploying Production or changing the database. Branch: `review/axia-release-candidate-20261121`; target: `main`.

| Source | Pinned head | Treatment |
| --- | --- | --- |
| main | `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d` | Branch starting point; unchanged Production baseline. |
| #48 | `649d57e3d2d2891c20438a77b921b95a459df34e` | Preserve platform, account security, office workspace, drafts/history, bounded encrypted exports, read recovery and earlier incorporated work. |
| #49 | `1878c6acf2d399dc22544fc4c1afdd44db719170` | Descends from #48; one changed file against it, `src/components/app-shell.tsx`. Preserve this exact sidebar. |
| #51 | `bd8b8ae134cc2e0360c850a7a8e8150f71494ea8` | Descends from #48; one changed file against it, `.github/workflows/ci.yml`. Pin Ubuntu 24.04; no dependency upgrade. |
| #50 | `ac07ec51e5cb6f8ed6e20f584262fb74d75a4a37` | Excluded. No Client Requests runtime, schema/permissions activation or app flag is added. |

The integrated runtime equals #49's tree plus #51's workflow. Changes beyond those source heads are roadmap/intake/acceptance documentation and focused browser checks in `scripts/verify-integration-ui.mjs`. No application runtime was rewritten. The complete feature-review report was copied byte-for-byte; its recommendation describes the pre-approval review, while current candidate authorization is defined here and in the roadmap.

No historical migration source, Android file, dependency declaration or lockfile is intentionally modified by the integration delta. Existing source migrations/scripts in #48 remain present and **must not be run on hosted systems**.

## Fresh read-only baseline

- Main CI 39057754119: completed/success. Vercel Production `dpl_XKM5LcgRsNous9FxheHTZ8w18C5u`: READY, same main SHA. Direct Vercel metadata access is available; old 403 reports are historical.
- Source #48 CI 42467223500: failed at browser installation because Playwright 1.56.1 does not support Chromium headless shell on Ubuntu 26.04. #51 CI 42710679363 passed after the runner pin. Neither result alone establishes combined #49 acceptance.
- Supabase history: 25 entries/latest `20261108072737_axia_client_requests_v1`. Read-only inspection only; no application, migration, user, membership, Auth, Storage or configuration write.
- Earlier same-day catalog review: client_requests exists with RLS and closed API table grants. Its presence does not authorize stage-2 SQL or app activation. Legal draft tables exist with constrained direct grants; controlled RPC behavior must be tested separately.

## Combined verification

| Check | Current result |
| --- | --- |
| npm ci | PASS; 449 packages installed from the committed lockfile. |
| Typecheck | PASS locally. |
| Strict Lint | PASS locally. |
| Safety tests | PASS locally, 174/174. |
| Production build and required routes | PASS locally; all 18 required routes present. |
| Disposable PGlite SQL suites | PASS locally: 19 staff + 21 platform + 19 operator + 27 control checks, including isolated encrypted recovery. |
| Native PostgreSQL/concurrency | PASS on integrated-source CI 44938601064: 22 staff + 23 platform + 19 operator + 31 control checks on disposable PostgreSQL 17; no live Supabase target. |
| Compiled browser UI and HTTP safety | PASS locally: 191 layout/flow records and 10 compiled HTTP safety requests. |
| GitHub CI / Preview | Source head `67c51fd422471a39b42dbe64b470beff13a5ac37`: CI 44938601064 completed/success, deployment `dpl_2sbq2vvXgHNBuvZgx3WX55BsT6Cf` READY. Current result-documentation head must also pass its PR Checks. |

[Verified integrated-source CI](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/44938601064) and [stable branch Preview](https://axia-legal-git-review-axi-d3e774-ramyelhawary73-coders-projects.vercel.app). The source tree `340a7e31dda7691fb1781061aeb1f1b7c33295a7` matched the locally tested tree exactly. This subsequent result update changes only this Markdown and the roadmap; runtime, browser tests, workflow, dependencies and migrations stay byte-identical. Inspect the PR's actual current head and Checks rather than treating the prior SHA as the final merge candidate.

The browser runner starts a compiled loopback server with empty Supabase URL/key, activation flags disabled and synthetic browser responses. External browser hosts are blocked. SQL fixtures use an in-memory disposable PGlite target or CI's disposable local PostgreSQL 17. The runner never points to hosted Supabase or sends real mail.

Sidebar acceptance includes Arabic label size/grouping, truthful badges, current section, all navigation targets, expanded/collapsed desktop behavior, mobile drawer scrolling, Escape/focus return, viewport switching, and no horizontal overflow. Preserve the existing platform/MFA/password/draft/backup/read-recovery checks; no actual password change or MFA enrollment is performed.

Four new combined navigation scenarios cover 1440x900 dark, 1024x620 light, 390x844 dark and 320x568 light. They assert all 12 accessible destinations and three groups, at least 14px labels and 44px targets, no fixed business badges, current section in expanded/collapsed mode, contained mobile focus and Escape return, and closing the mobile drawer on a desktop resize. All four screenshots were visually reviewed. The existing 183-record suite also passed before adding these focused checks; the final 191-record run includes them. These are synthetic browser acceptance records, not 191 hosted user sessions or individual unit tests.

## Preview and live-operation boundary

Only an automatic Git Preview is in scope. Do not promote it, manually deploy Production or copy environment settings. New branch Previews do not automatically inherit activation/origin settings scoped to the earlier #48 branch. A READY build with a disabled feature is not a failed authorization and not evidence of a completed live feature. Keep deployment protection intact.

An unauthenticated read-only /login probe returned HTTP 302 to `vercel.com/sso-api`, confirming the protected access boundary. No share link/bypass token was created and no live signed-in workflow was attempted. The owner opens the Preview using their normal Vercel access. Browser/SQL acceptance above is isolated; H1 is not closed by a deployment status or a redirect.

H1 read-only owner/session acceptance remains distinct. H2 shared-data writes/files/support/recovery require a concrete separately approved fictitious-data manifest; E1 real mailbox/account/confirmation delivery also needs separate scope. The existing demo office and sole owner membership remain unchanged. No passwords, API/Service Role keys or MFA secrets are requested or included.

## Owner review and next gate

Present one Draft PR and its same-head Preview/checks. The owner reviews the preserved sidebar and current package; no source PR is merged separately. H1/H2/E1/C1 and a separate explicit release decision remain before any main/Production delivery. PDF features, vendor prices, Drive/offline/licensing decisions are not implemented by preparing this candidate. [Complete proposed feature matrix](AXIA_FEATURES_REVIEW_2026-11-21.md).
