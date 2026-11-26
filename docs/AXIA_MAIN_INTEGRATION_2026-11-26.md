# AXIA main integration — 26 November 2026

## Authorization and bounded release

The owner explicitly requested finishing the current changes, merging into main and testing through main after Android login buttons appeared unresponsive. This supersedes the previous no-main-merge restriction for the current integrated source/UI/PWA package and its review documents. Main is connected to the current Vercel Production deployment; the automatic update of the existing site was explained before merge. This is not permission to change Secrets, Auth/MFA/session settings, hosted SQL, memberships, legal records, deployment protection or domain access. Control center remains disabled; background Push, local server and offline legal-data synchronization remain unimplemented/review-only.

PR #56 is retargeted from its former docs-only base to main, carrying #55 and the earlier inherited #54/#53/#52 packages once. Do not merge those ancestors again as independent feature packages. PR #56's final GitHub merge/check metadata and Vercel deployment-source receipt determine whether integration has actually completed; this source report is not a fabricated future merge SHA or a claim of physical acceptance.

## Reproduced login obstruction

The owner reported Android installation and then login buttons not responding. In connected Chrome at 390×844, on the pinned #55 Preview login, a real pending worker update displayed the fixed “تحديث جديد جاهز” panel. Password visibility and portal tabs reacted correctly, with no captured browser errors. The login submit button was inside the viewport at y=711–760, but its center hit the update panel rather than the button. This directly reproduces a blocking overlay in a mobile-sized browser. It does not prove that every reported physical-device symptom has the same cause.

The provider now gives update consent its own row in the application layout. Login and workspace occupy the remaining height and scroll independently. The update message never activates/reloads without the existing explicit user action. Defer/recheck behavior remains. Modal UI can take priority over the update row while open. No form credentials, legal records or OS permissions were entered/changed in the live diagnostic.

## Regression verification

New compiled-browser scenarios keep an update waiting while exercising touch login at 320×568, 390×844 and 390×400: switch license/login tabs, toggle password visibility, scroll to and hit-test submit above the update row, tap an empty required-field form without contacting Auth, and defer without sending an activation message. A workspace fixture verifies the resized canvas and read-only drawer navigation with a waiting update. Existing install/update/offline/worker/notification/security/business UI tests remain in the suite. Test data is synthetic and loopback-only, never real credentials or live business writes.

The previous #55 baseline passed 199 safety tests, 232 compiled browser records, isolated PostgreSQL/PGlite checks and 20 required build routes. Fresh exact-head results for the corrected integrated package must be read on PR #56, not inferred from that earlier receipt. No SQL files are executed by the Vercel build; prebuild prepares the public-only worker.

## Pre-merge observed state

- Main before integration: `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`.
- Previous Production: READY `dpl_XKM5LcgRsNous9FxheHTZ8w18C5u`, git main at that same SHA, alias `https://axia-legal-psi.vercel.app`.
- Production configuration metadata includes Supabase public-config entries. No AXIA platform/control enable/origin entry targets Production; those existing flags are branch-scoped to other Preview branches. Defaults leave platform/control off. Only encrypted-variable metadata was inspected; no Secret values were decrypted or copied.
- Vercel protection remains enabled as configured. This package does not disable it or bypass a sign-in wall. A mobile sign-in/protection problem, if encountered separately, must be reported rather than treated as a reason to weaken it.

## Integration and post-merge checks

1. Run exact-head type/lint/safety/build/compiled touch regression and existing SQL security checks. Review screenshots including pending-update login.
2. Confirm PR #56's main base and expected head, mark ready and merge once using a SHA lease. Preserve all branches; no deletion required.
3. Verify the resulting main SHA, matching READY Production deployment and existing aliases. Verify its worker/manifest/assets/install/login and public interactions; do not test by creating legal records or changing accounts/roles.
4. On the existing main site, owner privately enters login/MFA if needed. Recheck Android login controls with/without update notice; iPhone physical acceptance remains pending. An old Preview installation stays tied to that separate origin. To test main, the owner must open/install the main origin intentionally; do not delete or silently migrate the old app, credentials or caches.
5. Read-only authenticated business acceptance needs the owner session. Do not claim H1 refresh/expiry, physical iPhone, commercial C1, backup H2 or closed-app Push passed from source integration alone.

## Rollback boundary

If the new deployment introduces a material availability regression, preserve the previous deployment/source reference above and use an authorized deployment rollback or ordinary revert PR of this bounded merge after checking any later commits. Do not force-push main, replay migrations, reset Auth, disable protection or restore an entire database for a UI regression. Current installation/consent remains user-operated; no forced worker activation or automatic unsaved-page reload.

## Next execution command

> افتح AXIA من رابط main الحالي على أندرويد، واختبر أزرار صفحة الدخول فقط، ثم سجّل الدخول وMFA بنفسك عند الحاجة، واستكمل القبول بالقراءة فقط. لا تفعّل مركز التحكم أو Push ولا تغيّر بيانات أو صلاحيات.
