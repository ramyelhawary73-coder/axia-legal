# AXIA PWA foundation review

Branch: `feat/axia-pwa-foundation-20261125`, based on PR #53 head `ebfa30b82190ab2adec48f7dd1fc3dd024ef0115`. Current main remains `c0fd6a6dc969164e6717f389fa1f04b7efbc0e6d`. This candidate inherits #53/#52; never merge the same inherited source as duplicate packages.

## Implemented source

- Origin-relative `/manifest.webmanifest`: stable root ID/start/scope, standalone display, Arabic/RTL, AXIA name/colors and real PNG normal/maskable icons. Apple touch icon derives from the existing AXIA SVG; no new unrelated logo or external asset is introduced.
- Public `/install` guide for desktop/laptop, Android and iPhone/iPad, reachable from the login footer and office account menu. Native prompt appears only when the browser provides it and is triggered only by an explicit button. Unsupported/dismissed prompts retain honest manual guidance. Standalone detection does not claim an OS installation from a desktop viewport.
- Versioned `/axia-sw.js` is generated before build/dev from a tracked template and the deployment/source version. It is not committed as a stale generated artifact. No dependency or lockfile change.
- Worker install fetches exactly five public assets from its own origin: generic offline HTML and four brand PNGs. Same-origin cookies are sent normally so protected Preview assets remain accessible without weakening deployment protection; credentials are not copied into Cache Storage. Redirects, bad status and wrong MIME types fail installation. No login/workspace HTML, API result, legal record/file, Auth material or Next.js bundle enters this cache.
- Normal work navigation uses the network; only transport failure yields the public offline screen. HTTP 401/403/5xx responses remain unchanged. APIs, Auth callbacks, Next.js internals, foreign requests and all non-GET methods are never intercepted/replayed. This is not offline CRUD or synchronization.
- Worker updates wait. A save-work notice offers explicit reload or later; another tab's worker activation does not automatically reload this tab. Cache cleanup touches only obsolete AXIA public-shell caches. Installed shell does not own or delete future business-data stores.
- Web Proxy adds exact public exclusions for the install help page, manifest, worker and offline page; adjacent routes and protected work/API/Auth routes retain their existing guards. No provider Auth/session setting, role, RLS, API handler, SQL, account, mail, Storage or feature flag is changed.

## Verification and limits

Local Typecheck, strict ESLint, 187 safety tests (10 new behavioral PWA checks) and production Build/all 20 required web routes passed during implementation. The extended compiled-browser suite covers three responsive install pages, prompt consent/dismissal, standalone signal, update deferral/explicit activation, real Service Worker static-only caching, offline navigation and reconnect, plus manifest/PNG/worker headers. Exact-source CI and deployment evidence must be read from this review branch's PR before reporting readiness. Preserve failures honestly; synthetic signals are not physical OS installation.

The local compiled-browser attempt could not launch because the runtime's Playwright Chromium headless executable was absent; no assertion ran in that attempt. The existing supported CI installs its pinned Chromium shell and runs the extended suite. Read the exact-head CI result rather than treating the local attempt or a source inspection as a browser pass.

Real desktop/Android/iPhone installed-app acceptance, service-worker upgrades across actual releases, private-session continuity in an installed iOS web app, long offline eviction and H1 token-expiry remain open. No new real legal-data export is part of verification. A public fallback screen cannot establish that a pending business save succeeded. Full local server, device encryption, offline edits and synchronization are designed only in [the three-mode contract](AXIA_THREE_MODE_ARCHITECTURE_2026-11-25.md).

## Reconciled inherited H1 evidence

After the older reports, the owner separately approved two non-secret Config entries for PR #53 Preview only: platform enabled `1` and that branch's exact HTTPS origin. Source `ebfa30b` was redeployed as `dpl_CcRbKjkbgg2QEyHxNDsd7LxmHfLM`, READY, and CI 45500524735 succeeded. The owner completed existing MFA privately; real directory/audit reads, new-tab and reload continuity passed. Successful reads appended normal immutable read audit. No role/business change was submitted. Physical-mobile and natural refresh/termination acceptance remain open; no MFA material belongs in this report.

Read-only Auth Sessions UI on 2026-11-25 showed access tokens 3600 seconds, absolute session limit 0/never, inactivity 0/never, single-session off, refresh replay detection on and reuse allowance 10 seconds. On the current Free plan the absolute/inactivity controls were disabled. No settings were saved. A planned 65-minute post-idle check can examine refresh/continuity, not manufacture automatic logout under unlimited session settings. No such timed test was completed or scheduled.

These live Config values apply only to `fix/axia-h1-review-20261124`; the new PWA branch inherits source, not branch-specific activation. Do not copy the flags or Secrets. H2 backup/recovery, E1 controlled employee/mail and C1 sold workflow remain open. No merge/Production release is authorized.
