# AXIA Login atmosphere — delivery and acceptance

Date: 2026-10-10. Status: OWNER_TESTING (local checks passed; hosted checks and owner acceptance pending).

## Scope and live baseline

The owner requested a world-class AXIA Login background or animation and support for web, phones and tablets. The supplied screenshot was inspected. The previous composition was readable but visually flat; its global body overflow also made long Login content unreachable on small screens.

- Fresh main: `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`, unchanged and unprotected.
- Fresh P0A head: `5a8bc45f623d2c74c8354580de893cb4a7699293`; Draft PR #33 remains open/unmerged.
- Visual branch: `feat/axia-login-atmosphere-20261010`, based on that P0A head. Its PR targets the P0A branch to keep this review focused on visual changes. It must not be merged to main independently of P0A acceptance.
- Supabase Development metadata: `ACTIVE_HEALTHY`. No SQL or Auth changes are required for this package.
- Vercel exact AXIA team/project still returns 403; no authenticated CLI fallback is installed. Do not disable Deployment Protection or expose environment values.

## Implementation

- `src/components/login-atmosphere.tsx`: original brand-native vector scene; balanced A sculpture, fine orbital lines and a subtle perspective ground. Decorative elements are hidden from assistive technology and cannot intercept input.
- `src/components/login-atmosphere.module.css`: ink/teal/gold background, fine grid and arcs, opaque readable Login card, three slow transform/opacity animations, smaller-screen rules, reduced-motion support and Login-only scrolling.
- `src/components/login-experience.tsx`: scene integration and a keyboard-accessible pause/resume button. Email/password controls, form Server Action, safe return path, errors and honest pending activation/recovery flows are retained.
- `docs/AXIA_MASTER_ROADMAP.md`: scope, verified baseline, current delivery state and remaining gates.
- `.github/workflows/ci.yml`: run the existing quality job for all pull-request target branches. The original main-only filter skipped this stacked PR. Push-to-main behavior, read-only token permissions, runners and checks are unchanged; no privileged pull_request_target trigger or secrets were added.

No image/video download, new package, global CSS change, subscription/RAJIH business logic change, live database write, main edit, merge or Production deployment is part of this package. This responsive Login does not establish that every internal module or a native mobile app is complete.

## Validation

Passed on the final local code:

- Typecheck; Lint with zero warnings; all 119 existing Safety tests; Production build. Package/lockfile and global CSS remain unchanged.
- Chromium viewport checks: 1920x1080, 1440x960, 1366x768, 1024x768, 768x1024, 390x844, 320x740, 844x390 and 390x480. No horizontal overflow; submit and footer reachable by scrolling; form appears before the introduction on narrow layouts.
- Explicit pause/resume and OS reduced-motion behavior; no running decorative animations under reduced motion. Motion is applied to HTML wrappers for the two SVG layers and a CSS ambient layer; there is no JS animation loop.
- Password visibility controls; wrong credentials rejected through the real Login Server Action against an isolated localhost provider fixture, with exactly one provider call and no provider-detail leak. This is not a successful real Supabase-account test.
- Static server-rendered form visible without JavaScript; zero browser page errors and zero external asset requests. Desktop/tablet/mobile screenshots were visually inspected.

These are Chromium desktop-browser emulations, including a short viewport representing reduced keyboard space. Physical iOS/Android, mobile Safari, keyboard resizing and battery/performance behavior remain device acceptance checks; no claim of physical-device verification is made.

Draft visual [PR #34](https://github.com/ramyelhawary73-coder/axia-legal/pull/34) targets the P0A branch. Initial visual head `cd0f6c2a166a447c686cc18309a6c97d5792b48e` started a Vercel Preview but no quality run: CI only listened for PRs targeting main. The minimal trigger correction above is included in the follow-up; check its exact final head for CI and deployment results.

Hosted evidence for visual/CI code head `d021fde7e5501f4a5b03d3e9bc8e317b9f673294`:

- [Quality run 38070907965](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38070907965) completed successfully, including clean dependency install, Typecheck, Lint, Safety tests and Production build.
- Vercel commit status succeeded and its bot reported Ready. [Preview Login](https://axia-legal-git-feat-axia-73b882-ramyelhawary73-coders-projects.vercel.app/login); [deployment C3TF6qesSGykr7UM1teQJMAM6SVT](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/C3TF6qesSGykr7UM1teQJMAM6SVT).
- Anonymous Preview GET reached `vercel.com/login`, so it did not exercise the application. Exact-team connector access still returns 403. Hosted environment binding and functional acceptance remain blocked; keep Deployment Protection.
- Anonymous Production `/login` remained available (200). This package did not merge, deploy or promote Production. PRs #33 and #34 remain Draft/unmerged. The updated desktop visual poster was saved after local browser review.

This closeout changes only delivery documentation. Check CI for its final head separately; the verified Preview above refers to the preceding identical code/workflow tree. A successful build does not establish real Supabase Login or tenant isolation. Real Development account Login/logout, expiration, two-institution negative tests and environment separation remain mandatory P0A/P0C acceptance requirements.

## Owner review

1. Open the visual branch Preview while signed into the Vercel account with access to `ramyelhawary73-coders-projects`.
2. Inspect the desktop background and AXIA scene; pause/resume movement and enable the device's Reduce Motion setting.
3. Check phone/tablet in portrait and landscape. Reach the Login button and footer by scrolling; open the keyboard and confirm fields remain reachable.
4. Review RAJIH's introduction and the pending activation/recovery notices. These controls must not claim to create institutions or reset passwords yet.
5. Reconnect Vercel to the account/team that owns AXIA, so environment binding and hosted acceptance can be checked without requesting credentials in chat.

Next security package remains P0B compatible dependency patches, followed by P0C live Auth/tenant/schema verification. Approval of the visual direction does not authorize merge or Production deployment.
