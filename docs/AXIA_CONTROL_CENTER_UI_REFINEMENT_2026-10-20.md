# AXIA Control Center — interface and Arabic date refinement

Date: 2026-10-20. Base: PR #48 `24bc325b2336bfc99c95dcc1d83fb6ed1b6dba1d`. Work remains on `feat/axia-control-center-client-readiness`, whose branch Preview already has the owner's Config settings. No Merge or Production application release.

## Observed state and root cause

The owner's screenshots show Config/Preview scoping, a Ready Preview at `24bc325`, then the developer console listing both existing demo offices and one office overview. This establishes owner-observed console entry/list/overview only; it does not establish business mutations, per-office data isolation, file upload quota/finalization or real export/recovery acceptance. The independent Vercel connector remains team-scope 403, and the originating browser is unavailable.

The original route constrained every screen to `max-w-6xl` (1152 px), used undefined `--background`, and relied on a page whose global body has locked overflow. Its combined native `datetime-local` field inherited Arabic RTL, mixing browser-native date segments with right-to-left text. The screenshot shows separated/reordered native date/time tokens. Styling and field composition are corrected locally at this route; there is no global CSS or authorization workaround.

## Resulting interface

- Up to 1600 px of usable workspace; one explicit route scroll container, naturally flowing forms and responsive office navigation. No new global style override or production dependency.
- A consistent scoped CSS Module for surfaces, contrast, inputs, keyboard focus, minimum 44 px actions, selected office/status, icon navigation and summary counts. The sidebar stops stretching to the entire form height.
- Clearly labelled office search limited to the current fetched page; pagination still determines which offices are fetched. No claim of server-wide search or total counts.
- Separate native date/time controls with Arabic labels, explicit LTR/en-GB presentation, isolated Arabic human-readable date, visible device timezone and an explicit open-ended checkbox. Finite selections still convert the device-local instant to UTC for the unchanged guarded endpoint; open-ended sends null. Stored values reload back to the same local date/time.
- Explicit guidance for the audit reason and unconfigured office defaults; saving still requires a reason, confirmation, current revision and server permission checks.
- Theme switching, isolated audit timestamp/action text and consistent encrypted-backup styling. Existing protected memberships, support duration, backup bounds/encryption, RPC shapes and all security checks are retained.

## Verification

Runtime/test head `fdbed8f400bc026a074fbda862b716c5c0e0f90a` passed [CI 39412941041](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/39412941041): Typecheck, strict Lint, all 164 application tests, PGlite 19+21+19+27 and native PostgreSQL 22+23+19+31 checks, Build/17 required routes, 165 browser layout checks and nine compiled HTTP handler checks. The same-head Vercel status is success. No live business mutation is implied by these isolated fixtures. Local browser execution is blocked: the runtime Playwright 1.62.1 browser executable is absent and the download returned an incomplete/non-ZIP response. CI uses the repository-pinned Playwright 1.56.1. Typecheck, strict Lint, 164 application tests and production Build/17 route checks have passed locally. An old Turbopack persistence cache could not load after workspace restoration; moving the generated `.next` directory aside (without deleting it) and rebuilding cleanly succeeded. No application workaround or dependency change was needed.

The expanded browser suite uses synthetic API responses on loopback only, with external requests aborted. It checks light/dark layouts at 320, 390, 768, 1024, 1280, 1440 and 1920 px, short desktop height, explicit date/time direction and sizing, Cairo local-to-UTC conversion/reload, null expiry, reason gating, local search, theme switching and preserved member/support/encrypted-backup behavior. Native browser widget appearance can differ on Windows, Android and iOS; the owner's actual device check remains required after Preview deploys.

## CI lifecycle correction

Initial run 39412452118 passed all 164 application tests, PGlite suites and all native PostgreSQL security/concurrency checks (including 31 control checks), then raised 57P01 on an idle pool during forced database teardown. The disposable control/restore test already awaits pool shutdown; removing unnecessary DROP DATABASE FORCE allows normal backend exit and lets any real leaked connection fail visibly. This changes only the isolated test harness, never hosted SQL or migration history. Build/UI steps had been skipped by that initial teardown failure; Follow-up CI 39412941041 passed the same native suite and teardown, then the production Build and complete browser suite.

## Visual review and files

CI artifact `12260247758` (`axia-integration-ui`, runtime/test head `fdbed8f`) has digest `sha256:66870910a443eea9c93c9963315f3caadd68e99371c0414f75e15b7e2a45e304`, available through the linked run until 2026-10-27. Four generated screenshots were downloaded and visually inspected: `control-settings-1920-light.png`, `control-settings-1440-dark.png`, `control-settings-390-light.png` and `control-settings-320-dark.png`. Native date/time values and the connected Arabic date summary are readable; fields and actions fit narrow screens. Browser-native day/month order and picker appearance still depend on device locale; the explicit Arabic date summary identifies the actual selected date. Screenshots show the lower form after scrolling to Save, not the initial top-of-page view.

Changed relative paths from the owner's reviewed Preview head `24bc325`:

- `src/app/platform/page.tsx`
- `src/components/control-center.tsx`
- `src/components/office-backup-panel.tsx`
- `src/components/platform-theme-toggle.tsx`
- `src/components/platform-workspace.module.css`
- `src/components/subscription-expiry.tsx`
- `src/lib/control-presentation.ts`
- `scripts/verify-integration-ui.mjs`
- `scripts/test-control-center-db.mjs`
- `docs/AXIA_MASTER_ROADMAP.md`
- `docs/AXIA_CONTROL_CENTER_UI_REFINEMENT_2026-10-20.md`

## Preserved scope and next acceptance

No changes to SQL/migrations/RLS, Auth configuration/credentials/MFA, server APIs, memberships, Android, SMTP, Secrets or dependencies. No real office subscription, block, support grant, audit event, account, file or mail was written by these local tests. The already-applied SQL is never replayed.

Next: owner reviews the automatically updated branch Preview and the split date/time controls on Windows/Android. Then run separately controlled hosted office/root/support/draft/Storage and encrypted recovery acceptance with authorized synthetic data. Do not treat the visual refresh or synthetic browser results as first-client readiness or a successful real backup.
