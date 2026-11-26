# AXIA: native-inspired UI and notification delivery review

Status: source changes for Preview review, based on PR #54 head c9e3467. No main merge, Production deploy, database migration, Auth configuration, role change or Secret operation. Control center stays disabled. This package does not activate #53's branch-specific flags on another branch.

## User requirement and origin

Use an iOS-inspired mobile and macOS-inspired desktop language while preserving AXIA branding: readable Arabic navigation, consistent icon tiles, safe-area-aware headers, native scrolling, soft surfaces, large touch controls, light/dark modes and reduced motion. The screenshots supplied on 26 November show `axia-legal-psi.vercel.app`; Vercel metadata identifies that origin as Production main c0fd6a6, not PR #54. Its Android appearance is not acceptance evidence for this new source. Use the new branch Preview, without replacing Production or moving an existing installation silently to another origin.

## Implemented source scope

- Login header no longer splits AXIA Legal into separate lines on compact widths; brand/controls fit 320px and up. License application remains available in the existing form.
- Shared workspace header, navigation and canvas get larger 16px navigation labels, 44px minimum controls, consistent Lucide icon tiles, responsive mobile drawer, native scrolling and restrained blur with fallbacks. Shared styling reaches all workspace sections; individual business view layouts retain their existing functions.
- Visible install invitation on login/workspace and an always discoverable install guide link. A native install prompt is offered only when the browser supplies `beforeinstallprompt`; other browsers get truthful instructions. Installed/standalone mode hides this promotion. Dismissal lasts only for the current mounted visit.
- No Apple proprietary assets or platform-identical UI claim. Fonts use available system fonts; AXIA gold and legal brand remain.

## Notification source and privacy

The previous popover used mock hearings, a fixed date and desktop-only Notification construction. The new center uses only loaded, authorized workspace tasks/hearings; errors remain errors, separate from an empty list. No invented travel times. Device permission requires an explicit user action. Mobile-compatible delivery uses the registered same-origin AXIA service worker, never `new Notification()`.

Foreground opt-in is held only in memory and bound to the current user/office. Before each automatic delivery, ordinary authenticated SSR/RLS GET requests recheck the same user/office and current eligible record. Failed/expired/foreign authorization suppresses delivery. A generic external message carries no client names, case numbers, legal title or record IDs. Click focuses an existing AXIA window without navigating an unsaved editor, or opens a fixed same-origin workspace URL.

Reminders list overdue tasks and the coming seven days using Cairo dates. Automatic foreground reminders are limited to explicit future times within one hour (urgent tasks and scheduled/postponed hearings), with in-session deduplication. Date-only tasks do not acquire an invented native delivery time. Invalid, nonexistent and ambiguous Cairo DST times do not trigger automatic delivery. This does not replace the separate legal deadline calculation engine in other views.

**Background sending remains OFF.** A passive generic `push` receiver is ready in the worker, but this change creates no Push subscription, backend sender, scheduler, table, key or Secret. Foreground timers are not reliable background scheduling. OS Focus, browser policy, network and user permission can suppress notification display; a successful API call is not proof of OS delivery.

## Proposed background Push changes — review required before implementation/application

The following is a design proposal, not an executable migration or an approved Auth/Secret change.

| Component | Proposed fields/behavior | Authorization and retention proposal |
| --- | --- | --- |
| notification_devices | UUID, organization_id, user_id, installation_id, endpoint_hash, encrypted endpoint/p256dh/auth envelope, consent_at, enabled, session binding, created_at, expires_at, revoked_at | Own-device enrollment/revocation only through ordinary authenticated SSR; RLS checks active membership. No client enumeration of other devices. Delete revoked/expired endpoint secrets within 30 days. Subscription endpoint is sensitive even though it is not a password. |
| notification_preferences | user/organization/category, enabled, timezone, lead interval, quiet hours | Own preferences only; organization cannot silently grant OS permission. Cairo default for current office workflow; explicit intervals and DST policy reviewed before activation. |
| notification_outbox | opaque event/device ids, idempotency key, scheduled_at, expires_at, attempt_count, next_attempt_at, state | Server-only queue. Unique event/device/deadline dedupe. Generic payload only. Expire reminders at their actual event time; no overdue burst. Bounded retries, immediate endpoint removal on 404/410. Proposed terminal metadata retention 30 days, no legal text. |
| delivery audit | opaque request/outcome/time/reason, no endpoint/keys/legal text | Narrow operator visibility; proposed 30-day retention. Records delivery API outcomes, not a guarantee the person saw it. |
| narrow sender/scheduler | dedicated server process with minimal queue/device grants, membership + case access + session validity recheck immediately before sending | No Service Role in ordinary user runtime, no fabricated user actor. Exact operator grants and session validation must be reviewed as SQL/handler manifest before provisioning. Restrict outbound HTTPS push endpoints to reviewed browser vendors; block private-network/redirect SSRF. |
| new configuration | VAPID public identity, private signing key, encrypted subscription storage key, scheduler authentication and allowed Preview origin | Private values require separately approved Secrets. Public VAPID identity is not enough to send. No existing Secrets read, rotated or written by this package. Preview-only enrollment separated from Production. |

Logout/account switch/device revocation must disable the server binding; expiry and current server authorization must be checked even if a tab never executed logout cleanup. Enrollment has CSRF/origin validation, rate limits and an unsubscribe endpoint. Re-enrollment requires explicit consent; session renewal does not silently create devices. Never trust the client-provided organization, audience, payload URL or legal permissions. Final table names, foreign keys, RLS/ACL matrices, crypto rotation, indexes, down migration, rate/retry limits and narrow operator identity require a reviewed implementation manifest before any database or Auth operation. No session duration changes are proposed.

## Acceptance and evidence boundaries

| Platform | Intended path | Remaining physical evidence |
| --- | --- | --- |
| Windows / macOS | Browser or installed PWA; install help plus permission from notification center | Correct new Preview origin, actual native installation/window, OS delivery, update and recovery |
| Android | Chrome/compatible browser install event when available, otherwise menu guide; open installed icon | New Preview installation, compact header/sidebar, explicit OS permission, visible test notification, offline recovery/update |
| iPhone / iPad | Safari share → Add to Home Screen; installed web app on iOS/iPadOS 16.4+ for Web Push | Actual device installation, safe areas/keyboard/scroll, private login/MFA, OS permission/delivery and update |

Native install prompts are browser-controlled, not guaranteed to appear on page load. iPhone Web Push requires a Home Screen web app and user interaction for permission. Older/unsupported browsers retain the in-app reminder center. Background/closed-app delivery cannot pass until the proposed sender is separately approved and deployed to Preview.

Automated verification includes pure reminder/permission/worker/auth-refresh tests, existing safety tests, typecheck, lint, production build, and compiled responsive browser checks with synthetic authorized fixtures. Browser fixtures do not prove real OS notification delivery or physical Android/iPhone acceptance. Hosted data is not modified for tests.

Owner-reported Windows evidence from this conversation: installation/opening, offline generic shell screenshot, then reconnect/retry returning to workspace. This supports the reported scenario only; screenshots do not expose an independently pinned origin/SHA. PR #54 direct browser update defer/recheck/reload evidence remains separate. Android screenshots are old Production; iPhone acceptance remains pending. P2 local server and offline data synchronization stay design-only.

## Exact next action

Review the new Preview on actual Android and iPhone (read-only, owner enters login/MFA). Approve or amend this background Push design, then prepare the exact Preview-only SQL/RLS/operator/Secrets manifest for review **without applying it**. Do not merge main, publish Production, enable control center or change hosted business data/authority.

Primary references: [MDN install event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event), [WebKit iOS Web Push](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/), [MDN service worker notification API](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification).
