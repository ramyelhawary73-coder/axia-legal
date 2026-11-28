# AXIA: all mobile sections at a glance and Android notification identity

Status: bounded acceptance correction from main `b057ef11d7252b8e5ef47622352d9531c36fed5a`, on `fix/axia-mobile-menu-notification-badge-20261127`. No database/Auth/Secrets/role/configuration changes, no Push enrollment/sender activation, no business record edits. Existing control-center defaults remain disabled. This continues the owner's request to finish current UI corrections and use the main site after tested integration; final PR/main/deployment receipts determine release state.

## 27 November release and owner recheck

PR #57 merged as main `2703b0cdbc923aba888b588974a5250105236b48`; current main was read again before starting Draft #58. The owner now explicitly reports that the menu correction works and the notification displays the AXIA icon: **owner-reported PASS** for both. Earlier requests for that recheck below are historical. This does not establish real closed-app Push; the next package is [the disabled Push implementation/review](AXIA_WEB_PUSH_IMPLEMENTATION_REVIEW_2026-11-27.md). No existing hosted Auth/data/Secrets/roles were changed.

## Physical-device evidence (initial report before correction)

The owner confirmed main login/overview and opening the Android navigation drawer. The supplied screenshots show that its one-column list requires scrolling and hides several sections on first opening. The owner also reported actually receiving a test system notification, but its small icon was a plain white block. Record these separately: main login/overview and drawer opening are owner-reported PASS; complete menu visibility and badge identity are findings requiring recheck. Test-notification reception is owner-reported PASS, not an independent OS-delivery trace or proof of closed-app Push. The current package still cannot send after the app closes. Physical iPhone and natural H1 refresh/expiry remain pending.

## Menu correction

- Mobile navigation becomes a full-height, two-column destination grid, keeping all twelve full Arabic section names, existing navigation order, active state, colored icons and task/AI badges. All destinations remain real accessible buttons with their full names; none are hidden behind another submenu.
- On shorter screens, cards use a compact horizontal arrangement; landscape uses three columns. Touch controls stay at least 44px and labels at least 14px, with 16px labels on normal-height phones. No image scaling or text truncation is used to disguise overflow.
- The drawer uses the available width (up to 448px) and safe-area insets. Its native dialog retains focus containment, Escape/backdrop closing and return to the opener.
- Desktop expanded navigation is more compact when height is limited, and uses a two-column arrangement on short desktop windows. Its collapsed icon rail preserves names/accessibility.
- Normal phone sizes must show all twelve destinations in the first view with zero vertical scroll. Exceptionally short windows or enlarged accessibility text retain a real scroll fallback so content is never clipped or made unreachable. The implementation does not simply hide a scrollbar or set overflow:hidden over missing items.

## Notification correction

The previous code used `/pwa/icon-192.png` for both `icon` and `badge`. That application icon has an opaque square background. Android uses the badge as a monochrome alpha mask; an opaque tile becomes a filled block. The new `src/pwa/notification-badge.svg` reuses AXIA's A/scales symbol without a background; its rasterized 96×96 RGBA asset is `public/pwa/notification-badge-96.png`.

Both foreground `showNotification()` and the passive worker Push receiver use the new `badge`. The larger `icon` stays the existing full-color AXIA application logo. Android may keep its small status-bar symbol monochrome; the correction is the recognizable AXIA silhouette, not a promise to override OS colors or browser-specific notification rendering. The actual phone badge still needs owner confirmation after updating.

The public-only service worker precaches this sixth public asset. No legal data, APIs, login/workspace HTML, credentials or pending writes enter the cache. The same existing explicit update consent is preserved; do not automatically activate/reload a page with unsaved edits.

## Verification contract

- Pixel-level asset test: 96×96 RGBA, transparent edges, white nontransparent pixels, meaningful negative space and visible central AXIA stem. A filled square must fail. Both notification paths must use the new asset.
- Compiled mobile checks: 320×568, 390×844, 412×915, 768×1024 and 844×390. Count twelve destinations, verify zero initial scrolling, each whole button inside the visible navigation area with ≥44px targets and readable full Arabic labels, hit-test every destination, navigate to the final administration section and recheck active state. Large-text fallback retains the last destination without clipping it.
- Existing modal focus/Escape, read-only navigation, toolbar/login/pending-update, notification privacy, public-only worker/offline, permissions and business UI contracts remain. Build/types/lint/safety/security tests apply before the bounded main update.
- Browser/geometry checks do not prove actual Android/iPhone OS behavior. Owner-operated test after release: open main intentionally, update/reload after saving, view the complete menu, send one generic test notification and report its icon shape. No real tasks, cases or users are created for this test.

## Asset provenance and reference

The badge is a precise software icon asset derived from AXIA's existing A/scales vector, rasterized with the image renderer already supplied by the installed Next.js dependency tree; no new package, personal image or vendor branding was added. Reproduction: render `src/pwa/notification-badge.svg` to 96×96 RGBA PNG with the installed `sharp` renderer. Asset integrity/properties are tested rather than assuming a square application icon works as an Android mask.

Primary reference checked 27 November 2026 Cairo: [MDN Notification.badge](https://developer.mozilla.org/en-US/docs/Web/API/Notification/badge), describing the small-platform badge, Android monochrome masking and approximately 96×96 resolution. The application-specific opaque-mask diagnosis is inferred from that behavior and the inspected current asset/code; the owner did not supply a notification screenshot in this message.

## Next action

After successful checks, integrate this bounded current-acceptance correction into main under the owner's ongoing tested-main instruction, verify the matching deployment, then ask the owner to recheck the complete Android drawer and send a fresh generic notification. Keep control center and background Push off; retain data/permissions/Secrets unchanged. Continue iPhone and H1 acceptance separately; do not declare them passed.
