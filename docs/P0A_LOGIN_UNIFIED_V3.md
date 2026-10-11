# AXIA Legal — Unified Login composition

Date: 2026-10-11. Status: OWNER_TESTING; final local checks passed, exact-head hosted checks and owner visual review pending. This is an owner-requested replacement of the rejected PR #35 visual proposal, preserving the existing Auth/CI foundation.

## Fresh baseline and scope

- Main: `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`.
- PR #35: Draft/open/unmerged, head `ebf71d33f9f273e7862bafc4190e6fb45982359d`, exact local base tree matched GitHub `c62d4dda33460cb65f63d9b9af095671b8ad81f0`.
- Revision branch: `feat/axia-login-unified-20261011`, stacked on PR #35 to preserve all preceding real-auth and CI work.
- Supabase Development `qshgczulivsxztgrbqew`: ACTIVE_HEALTHY metadata. No SQL/Auth/RLS/role/Secrets changes.
- Exact AXIA Vercel team deployment inspection still returns 403; no installed CLI fallback. CI and Vercel's commit-status/bot evidence can verify builds, but do not prove environment binding or authenticated hosted runtime.

## Root cause and design

The owner's current screenshot shows a hard ivory/dark split, a large cover-cropped render confined to its panel, and detached branding/form/marketing composition. Passing layout checks did not constitute owner acceptance.

The replacement is a continuous ink canvas, subtle deterministic native vector contours spanning the viewport, a bounded paper form, and a shared header/footer. There is no photographic panel or remote visual asset request. The original image is preserved in Git; Login no longer requests it. SVG path geometry remains static; one HTML-wrapper transform has a 24-second cycle, pause/resume and OS reduced-motion support. No canvas, timer, pointer-tracking effect or new dependency.

The custom geometric AX monogram and serif AXIA wordmark share one horizontal brand lockup. The wordmark is outlined from the already installed DejaVu Serif typeface; the geometric symbol is drawn in code. This is a new identity arrangement, not a claim that the underlying typeface was designed for AXIA. No font software or font download is added to the application. Attribution is preserved below. Trademark clearance is not established by a visual proposal.

The form card remains bounded at 456 px with readable inputs and close heading/form spacing. At widths below 1024 px, the form precedes the secondary introduction/RAJIH content. Narrow, landscape and short windows can scroll to all controls. Global body overflow/theme rules are handled within the scoped Login surface rather than changed globally.

## Changed files

1. `src/components/axia-logo.tsx`
2. `src/components/login-experience.tsx`
3. `src/components/login-atmosphere.tsx`
4. `src/components/login-atmosphere.module.css`
5. `docs/AXIA_MASTER_ROADMAP.md`
6. `docs/P0A_LOGIN_UNIFIED_V3.md`

No file/asset deletion. Auth actions/server clients/proxy/config/navigation, database/migrations/RLS/Storage, roles, Secrets, subscriptions, RAJIH runtime, global CSS, package files and lockfile are unchanged. Pending recovery and activation buttons continue to explain their unavailable functionality honestly. No fabricated customers, endorsements, case data or security certifications.

## Verification

Passed on final local code:

- Typecheck, Lint (zero warnings), all 119 Safety tests and Production build. Generated tsconfig changes were restored to the exact baseline.
- Chromium at 1920x1080, 1440x960, 1366x768, 1024x768, 768x1024, 390x844, 320x740, 844x390, 390x480 and 1280x600. No horizontal overflow. Four normal desktop sizes fit without vertical scrolling; short/phone/tablet/landscape sizes can scroll to submit, footer and introduction. Form appears first on narrow layouts.
- One decorative animation, explicit pause/resume and OS reduced motion; password reveal; email is the first keyboard target. Static server-rendered form remains usable without JS. Zero raster images, external asset requests or browser JS errors in the normal checks.
- Wrong credentials rejected through the real Server Action with exactly one isolated localhost provider-fixture request; bounded Arabic error, provider details hidden. This is not a real Supabase-account test.
- Four missing-config responsive browser checks: disabled Login, safe-next normalization, bounded error, honest pending activation and password reveal. Protected `/`, `/api/tasks` and `/api/rajih` returned 503 with private/no-store caching. No mock fallback was added.
- Desktop/laptop/phone screenshots inspected internally. These are Chromium emulations, not physical Android/iOS/Safari verification.

Exact-head hosted results will be added after push. Physical-device and real Supabase-account/tenant tests are separate gates; local fixtures are not live Supabase tests.

Basic text/button contrast was calculated for the sampled palette pairs: form body 5.46:1, secondary buttons 5.37:1, field labels 9.70:1, primary action 11.75:1, hero copy 6.72:1 and hero accent 6.07:1 against the conservative sampled solid backgrounds. This is limited palette verification, not a full WCAG conformance claim.

## Owner acceptance and next step

Owner should open the new protected Preview with the existing authorized Vercel account, review desktop/phone/tablet proportions and identity, and check pause/reduced-motion behavior. A correct-team Vercel connection is still needed for environment binding and real Development Login/logout/expired-session/two-institution acceptance. No merge or Production deployment is authorized. P0B dependency security patches, P0C tenant/environment verification and all remaining roadmap phases are retained.

## Wordmark attribution

Source: installed `/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf`. Only outlined brand glyphs are included in the Login component; no runtime font package is distributed. Glyph contours were extracted with FontTools in the task environment; FontTools is not an application dependency.

Copyright (c) 2003 by Bitstream, Inc. All Rights Reserved. Bitstream Vera is a trademark of Bitstream, Inc. DejaVu changes are in public domain.

Permission is hereby granted, free of charge, to any person obtaining a copy
of the fonts accompanying this license ("Fonts") and associated
documentation files (the "Font Software"), to reproduce and distribute the
Font Software, including without limitation the rights to use, copy, merge,
publish, distribute, and/or sell copies of the Font Software, and to permit
persons to whom the Font Software is furnished to do so, subject to the
following conditions:

The above copyright and trademark notices and this permission notice shall
be included in all copies of one or more of the Font Software typefaces.

The Font Software may be modified, altered, or added to, and in particular
the designs of glyphs or characters in the Fonts may be modified and
additional glyphs or characters may be added to the Fonts, only if the fonts
are renamed to names not containing either the words "Bitstream" or the word
"Vera".

This License becomes null and void to the extent applicable to Fonts or Font
Software that has been modified and is distributed under the "Bitstream
Vera" names.

The Font Software may be sold as part of a larger software package but no
copy of one or more of the Font Software typefaces may be sold by itself.

THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT OF COPYRIGHT, PATENT,
TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL BITSTREAM OR THE GNOME
FOUNDATION BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, INCLUDING
ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM OTHER DEALINGS IN THE
FONT SOFTWARE.

Except as contained in this notice, the names of Gnome, the Gnome
Foundation, and Bitstream Inc., shall not be used in advertising or
otherwise to promote the sale, use or other dealings in this Font Software
without prior written authorization from the Gnome Foundation or Bitstream
Inc., respectively. For further information, contact: fonts at gnome dot
org.
