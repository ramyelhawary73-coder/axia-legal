# AXIA Aperture — Login identity revision

Date: 2026-10-11. Status: OWNER_TESTING (local checks and exact code-head CI/Preview build passed; owner review pending). Owner-requested revision of the prior visual direction; no merge or Production authorization. Documentation-closeout head checks are tracked in Draft PR #35.

## Baseline and purpose

Fresh main `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`; PR #34 `bfcee7859a0c0973bfb77bd77e67605f6f9800bd` and PR #33 `5a8bc45f623d2c74c8354580de893cb4a7699293` remain Draft/unmerged. Revision branch `feat/axia-login-identity-20261011` is based on PR #34 and preserves the preceding real-auth and CI work. Draft [PR #35](https://github.com/ramyelhawary73-coder/axia-legal/pull/35) targets that branch for focused review.

The inspected owner screenshot shows excessive separation between the small dark form and marketing column, a narrow canvas on wide displays, and a thin literal legal icon that lacks a distinctive identity. The owner requests competition-caliber visual quality; that is a subjective review target, not an award claim.

## Identity and composition

- **Aperture mark:** three interlocking facets, open center, asymmetric folded planes. The same visual idea appears in the architectural scene. No scales/gavel ornament. `AxiaMark` is a standalone inline vector primitive.
- **Wordmark:** AXIA letters are drawn vector paths with consistent geometry and spacing; not dependent on a device font. LEGAL is a small secondary descriptor. The full lockup retains the accessible AXIA Legal label.
- **Palette:** ink/forest `#20332d` / `#203b31`, warm ivory `#f7f4ed`, champagne `#d4c29e`. Functional text/controls have their own contrast values.
- **Composition:** 41/59 form/art panels, maximum 1760 px canvas. The form stays at most 380 px wide; panel space frames it. Height-based laptop rules avoid unnecessary clipping. On tablets/phones, the form and a clear logo precede the secondary brand/RAJIH section.
- **Motion:** one slow transform on the image's HTML wrapper. Explicit pause/resume, automatic reduced motion, no JS animation loop. No image motion intercepts input.
- **Media:** `public/brand/axia-aperture-v1.webp`, 1536x1024, 87,568 bytes. Created with the built-in imagegen tool; WebP encoding is a technical format optimization of the generated source. Next Image serves responsive local sizes; no third-party media/asset request. Source output: `generated_images/exec-067e1a4c-257a-49c3-ba46-badc1a940e98.png` in the task workspace.

## Files and boundaries

Changed: `src/components/axia-logo.tsx`, `src/components/login-experience.tsx`, `src/components/login-atmosphere.tsx`, `src/components/login-atmosphere.module.css`, the new WebP asset, `docs/AXIA_MASTER_ROADMAP.md` and this document.

The Login's Server Action, name/id/autocomplete/required attributes, safe next value, provider error mapping, configuration gate and honest activation/recovery messages are retained. No change to Auth logic/configuration, RLS, migrations, Secrets, permissions, developer roles, billing or RAJIH runtime. Global CSS/dependencies/lockfile are unchanged. No file deletion or new paid service.

Fresh Supabase Development metadata is `ACTIVE_HEALTHY`. Vercel's exact AXIA team still returns 403 and no installed CLI fallback is available; environment binding, protected Preview runtime and real-account tests remain blocked. Keep Deployment Protection.

## Validation and acceptance

Passed locally on final code:

- Typecheck; Lint with zero warnings; 119 Safety tests; Production build. Dependencies, lockfile, global CSS and Auth/server modules are unchanged. Generated build changes to tsconfig were restored to the verified baseline.
- Chromium at 1920x1080, 1440x960, 1366x768, 1024x768, 768x1024, 390x844, 320x740, 844x390 and 390x480. No horizontal overflow. All four normal desktop layouts fit without vertical overflow. Submit, footer and hero reachable; mobile form first; keyboard's first interactive target is email.
- Background image loaded successfully from the local Next Image endpoint. Deliberately blocking image loading leaves the form usable. One decorative animation; pause/resume and OS reduced motion verified. Static server-rendered form remains visible without JS.
- Wrong credentials rejected through the real Server Action with exactly one request to an isolated localhost provider fixture and no provider-text leak. Zero page JS errors and zero external asset requests in normal checks.
- Missing Supabase config: four responsive browser checks passed, disabled Login controls and honest activation/recovery notice behavior retained; protected `/`, `/api/tasks`, `/api/rajih` returned 503. No mock provider is used in application runtime.
- Screenshots of desktop, laptop and phone layouts visually inspected. These are Chromium emulations; physical-device claims are not made.

Physical Android/iOS/Safari, keyboard behavior, real Development Login/logout and two-institution isolation remain separate acceptance checks. Approval of this identity does not approve deploying the product, claim a registered trademark, or prove every internal module is responsive. P0B dependency repairs and P0C Auth/tenant/environment verification remain next security gates.

## Hosted code-head verification

- Exact code head: `eabc037480e344ea961404bb5aeef1cf5357e699`.
- [CI run 38107448494](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38107448494): completed/success. Clean npm install, Typecheck, Lint, Safety tests, build and cleanup checks passed.
- Vercel commit status: success. [Deployment J5WAv757RStNyNMi4RNhZD7TNS7P](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/J5WAv757RStNyNMi4RNhZD7TNS7P): Ready.
- New [Login Preview](https://axia-legal-git-feat-axia-15a1a1-ramyelhawary73-coders-projects.vercel.app/login). Anonymous access redirects to Vercel sign-in; owner should open it with the existing authorized Vercel account. Deployment Protection stays enabled. Hosted real-account/tenant and environment-binding acceptance have not passed.
- The following documentation-only closeout leaves all tested code/assets unchanged. Its exact final-head CI/Preview results are recorded in PR #35, avoiding a self-referential evidence commit loop. No merge or Production action.

## Artwork prompt — built-in generation

Use case: stylized-concept. Asset type: original AXIA Legal login hero artwork, consumed as a local background image behind live HTML content. Generate a museum-grade architectural product render, wide 1536x1024 composition. A monumental continuous folded ribbon forms an open angular portal with two asymmetric interlocking planes, evoking precision, balance and a rising triangular aperture without a literal letter or symbol. Satin champagne titanium exterior, near-black smoked glass interior edges, restrained amber rim highlights, physically convincing microtexture. One sculpture in an immense midnight ink architectural space, subtle floor reflections, a narrow soft beam of daylight grazing from upper right. Quiet, intelligent, sculptural, ultra refined luxury technology art direction. The object occupies central/right 50 percent, spans from upper third to lower middle, photographed close enough to feel monumental. Background almost black #10191c, accent muted champagne #c8ad79. Strong sculptural silhouette, cinematic depth, controlled contrast. Keep lower quarter and top tenth dark and empty for real UI typography. No text, no words, no logos, no watermarks, no UI, no literal A, no justice scales, no gavel, no classical columns, no statues, no books, no people, no neon, no galaxy, no particle swarm, no gold coin. Deliver a polished photographic 3D render, not a flat vector illustration.
