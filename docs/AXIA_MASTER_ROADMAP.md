# AXIA MASTER ROADMAP

> **Canonical project source of truth**
>
> This file is the authoritative living record for AXIA Legal product state, architecture decisions, delivery phases, known risks, owner requirements, and the exact next action.
>
> **Rule:** every implementation PR must update this file before it is considered complete.
>
> **Last verified:** 2026-10-10
> **Repository:** `ramyelhawary73-coder/axia-legal`  
> **Default branch:** `main`  
> **Verified main SHA:** `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`
> **Current execution branch:** `feat/axia-login-atmosphere-20261010` (based on unmerged P0A)

---

## 1. Product Identity

### Product

**AXIA Legal**  
Egyptian Legal Practice & Intelligence OS

### AI Copilot

**RAJIH AI — راجح**

### Product objective

AXIA Legal is being developed as a commercial legal ERP / practice operating system for law offices in Egypt. The target is not a simple dashboard. The product should become a reliable, installable, multi-tenant, subscription-controlled legal workspace that can be demonstrated, sold, operated, supported, and upgraded safely.

### Product principles

1. Arabic-first and RTL-first.
2. Professional enough for commercial law-office use.
3. Real persisted business data only; no fake business records in production workflows.
4. Strong tenant isolation and least-privilege authorization.
5. Legal records must be auditable.
6. Destructive actions must be guarded and recoverable where practical.
7. Business features must work on desktop, laptop, tablet, and mobile.
8. Changes must move through dedicated branches, tests, Preview, owner approval, merge, and post-merge verification.
9. No direct edits to `main`.
10. No Service Role in ordinary user-facing runtime paths.
11. No secrets in source code or project documentation.
12. Human approval remains required for AI actions that alter legal/business records.

---

# 2. How To Use This File

## This file must be updated when

- a new owner requirement is accepted;
- a phase starts;
- a phase scope changes;
- a migration is introduced;
- an architectural decision is made;
- a risk is found or resolved;
- a PR is merged;
- Production or Supabase architecture changes;
- the exact NEXT ACTION changes.

## Status vocabulary

Use only these statuses for roadmap items:

- `PLANNED`
- `READY_FOR_SCOPE`
- `IN_PROGRESS`
- `BLOCKED`
- `PREVIEW_READY`
- `OWNER_TESTING`
- `READY_FOR_MERGE`
- `MERGED`
- `VERIFIED`
- `DEFERRED`

## Evidence rule

Statements under **Current State** should be treated as verified only when a live GitHub / Supabase / Vercel check has been performed. Old SHAs, old screenshots, and previous chat summaries must never override a fresh live verification.

---

# 3. Current State

## Fresh reconciliation — 2026-10-10

- GitHub `main`: `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`, verified again immediately before branch creation. All 136 source blobs were downloaded from that exact commit and their Git blob hashes verified.
- Cleanup Batch 1 PR #27 and Cleanup Batch 2 PR #31 are merged and closed; documentation closeout PR #32 is merged. Neither cleanup will be repeated.
- The last main GitHub Actions run #190 succeeded (87 source-contract tests). This is historical baseline evidence, not evidence for a new change.
- Main is not protected. Do not push directly or merge without owner approval. No plan/service purchase or repository visibility change is authorized.
- Source regression after cleanup: Login used delayed client navigation instead of the existing password-auth Server Action; registration falsely reported success; missing public Supabase config enabled a shared mock server client and allowed non-production proxy requests through.
- Anonymous Production checks performed during the read-only audit redirected `/`, `/dashboard`, and `/api/tasks` to Login; they did not prove an active anonymous Production bypass.

## Supabase Development

- Existing project: `AXIA Legal Development`, ref `qshgczulivsxztgrbqew`, region `eu-west-1`.
- Fresh status before implementation: `INACTIVE`; metadata reads worked but SQL/migration reads timed out. Empty advisor results while inactive must not be interpreted as a clean security bill.
- The owner authorized starting the first implementation step and necessary Supabase work on 2026-10-10. A restore request for the existing paused Development project was accepted. This resumes the existing project; it is not a new database or backup rewind. Fresh follow-up confirmed `ACTIVE_HEALTHY`.
- No SQL writes, migration replay, RLS/Auth setting changes, data deletion, or new paid resources are part of P0A.
- Live read-only follow-up: 21 public tables, all RLS enabled; 45 public/storage policies; `legal-documents` is private with a 25 MiB limit. The six live `app_role` values match the workspace role union. Private membership helpers exist and use an empty search path.
- Live migration ledger contains 21 migrations, including the older security foundation absent from the committed chain. The live audit migration is `20260921111252` while source is `20260921105916`; other historical RAJIH versions also differ. This is a source/ledger reconciliation problem, not proof that live foundational objects are missing. Do not replay the chain.
- Security advisors now report two WARNs: [vector extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public) and [leaked-password protection disabled](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Do not move vector blindly: functions/type references and plan availability must be reviewed first.
- Catalog inspection confirms policy presence, not full RLS enforcement. Real two-user/two-organization behavior and Production database separation remain required.

## Vercel

- AXIA team: `ramyelhawary73-coders-projects`; project ID `prj_La6uiYbY8U5pxENVIFZlA0OFiVEi`.
- The connected Vercel identity returns 403 for that exact team. No Vercel CLI credentials were available as fallback. A connection with access to this team is needed for deployment/env/isolation verification.
- Existing Production alias: `https://axia-legal-psi.vercel.app`. No Production deployment or promotion has been requested by this implementation.
- P0A code head `8597950d38f27c2730c575b5a08d179df6039653` has a successful Vercel status and bot-confirmed Preview at `https://axia-legal-git-fix-axia-p-cb0653-ramyelhawary73-coders-projects.vercel.app`. Anonymous checks reach Vercel sign-in. Keep Deployment Protection; correct team access or the owner session is needed for acceptance. The documentation-only closeout head requires fresh status checks. A success status alone is not a runtime test or verification of the active Production alias.

## Current implementation — P0A

Status: `OWNER_TESTING`, on `fix/axia-p0a-real-auth-20261010`; [Draft PR #33](https://github.com/ramyelhawary73-coder/axia-legal/pull/33), unmerged.

- Login uses the real Supabase password-auth Server Action and waits for a returned user and session before success.
- Return paths are constrained to the same origin; missing credentials, throttling, provider failures, and missing config produce bounded Arabic errors.
- Normal runtime cannot instantiate the mock database or placeholder browser client. Missing config blocks protected routes in Development, Preview, and Production with 503; the public Login page explains the outage with a disabled form.
- Workspace resolution still derives identity/membership from verified claims, denies forged tenant headers, and now handles service failures with the existing stable unavailable code.
- New enterprise RTL Login and AXIA vector mark replace public fake registration and unsupported simulations. Password recovery and organization activation are honestly marked pending; no account, institution, or developer role is created through these controls.
- Local Typecheck and Lint passed; 119 Safety tests passed (87 existing + 32 new executable auth/workspace boundary tests with isolated provider fixtures). Local Production build passed. Local Chromium checks passed at 1440/768/390/320 px without horizontal overflow or JS errors, including safe return values, unavailable-state controls and protected-route 503 responses. Configured-form browser submission also passed against an isolated localhost Auth fixture (one real Server Action request, wrong password denied, no provider text disclosed). On mobile the form appears before the introductory section. This is not a real Supabase-account test. Code-head CI [run 38068441644](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38068441644) passed for `8597950d38f27c2730c575b5a08d179df6039653`; Vercel status/bot confirm a completed Preview. Anonymous Preview checks redirect to Vercel sign-in, so hosted acceptance and real Supabase-account testing remain blocked. The documentation-only closeout requires a separate final-head status check.
- Dependency files are unchanged. The audit found 7 affected-package findings (1 critical, 6 high); patching and repeat advisory verification are a separate P0B release blocker. Do not use `npm audit fix --force`.

## Owner-requested Login visual refinement — 2026-10-10

Status: `OWNER_TESTING`, on `feat/axia-login-atmosphere-20261010`, based on the freshly verified P0A head `5a8bc45f623d2c74c8354580de893cb4a7699293`. PR #33 remains open and unmerged; its closeout CI run [38068714523](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38068714523) passed. Main remains `1e8ad939cd6f89d277891aa9f0c37b45c7c64e0c`.

- The owner supplied a current Login screenshot and requested a distinctive professional background/animation with desktop, phone and tablet support. The screenshot was inspected; the existing flat background lacks visual depth.
- Bounded scope: custom AXIA SVG scene, gold/ink atmospheric CSS, restrained transform/opacity animation, explicit pause/resume, OS reduced-motion support, responsive composition and Login-only scrolling. Real Auth, RAJIH functionality, platform roles, subscription logic and database configuration are outside this visual package.
- Root cause for small-screen reachability: global `body` has hidden overflow while the old Login grew beyond its viewport. A viewport-sized scrolling Login surface addresses this without changing the application shell's global scroll policy.
- Fresh read-only Supabase metadata confirms `ACTIVE_HEALTHY`. The exact Vercel team/project still returns 403; no installed authenticated CLI fallback is available. Hosted runtime acceptance remains blocked on correct team access.
- No new dependency, external asset request, SQL, Auth/RLS change, paid resource, merge or Production action is needed. P0B and the security/commercial gates remain outstanding.
- Local Typecheck, Lint, 119 Safety tests and Production build passed. Chromium checks passed at nine viewport sizes (1920x1080, 1440x960, 1366x768, 1024x768, 768x1024, 390x844, 320x740, 844x390, 390x480): no horizontal overflow or browser errors; submit and footer reachable; mobile form first; pause/resume and reduced motion verified; zero external asset requests. The real Server Action rejected wrong credentials against an isolated localhost Auth fixture with exactly one provider call. A static server-rendered form was visible without JavaScript. These are desktop-browser emulations, not physical iOS/Android tests or real Supabase-account acceptance.
- Draft visual [PR #34](https://github.com/ramyelhawary73-coder/axia-legal/pull/34) targets the P0A branch. Initial visual head `cd0f6c2a166a447c686cc18309a6c97d5792b48e` started Vercel Preview but had no quality run: `.github/workflows/ci.yml` only listened for PRs targeting main. Its filter is removed so the same read-only quality job covers stacked PRs; no new permissions, secrets or privileged trigger are introduced. Exact-head CI/deployment results remain to be recorded after that correction.
- Delivery evidence and acceptance checklist: `docs/P0A_LOGIN_VISUAL_REFINEMENT.md`. SVG motion uses HTML wrappers; no JS animation loop, effect subscription or new dependency was introduced.
- Visual/CI code head `d021fde7e5501f4a5b03d3e9bc8e317b9f673294`: [quality run 38070907965](https://github.com/ramyelhawary73-coder/axia-legal/actions/runs/38070907965) completed successfully. Vercel status and bot confirm a Ready Preview at `https://axia-legal-git-feat-axia-73b882-ramyelhawary73-coders-projects.vercel.app`; deployment [C3TF6qesSGykr7UM1teQJMAM6SVT](https://vercel.com/ramyelhawary73-coders-projects/axia-legal/C3TF6qesSGykr7UM1teQJMAM6SVT). Anonymous GET `/login` redirects to Vercel sign-in. This proves completed build status, not hosted Auth/tenant acceptance. This closeout changes documentation only; its final-head CI must be checked separately. PRs #33/#34 remain Draft and unmerged. No Production action was performed.

---

# 4. Completed Delivery History

## Phase 1 / Foundation — COMPLETED

Foundation established for Next.js, React, TypeScript, RTL shell, Supabase client setup, CI, and initial architecture.

> Historical note: the old README remained frozen at Phase 1A and is no longer reliable as the product state record. This Master Roadmap replaces it as the live status source.

## AXIA Core Data Foundation — VERIFIED

**PR #15**  
Merge commit: `5f5c32c81d32c9e90d152b0819576df3f8da40e5`

Established core legal data foundation on `main`.

## Unified Backend API Layer — VERIFIED

**PR #16**  
Merge commit: `df53956927adcf569e4e0ee7c8acd22c96774c3d`

Established backend routes and workspace-scoped access for core legal resources.

## Phase 3A — Core UI Integration — VERIFIED

**PR #17**  
Merge commit: `3b4a2ee4fa47edf75ee97d03daf34ea08da10917`

Connected primary UI modules to real backend data and removed important business-data mocks/local persistence from those core paths.

## Phase 3B — Finance, Documents, Overview, Search — VERIFIED

**PR #19**  
Merge commit: `7a03c488063e517e7596cd5f4dcdcc0200bdde6c`

Delivered:

- real financial records;
- private document upload metadata;
- private Storage bucket workflow;
- signed downloads;
- overview backed by real data;
- global search backed by loaded workspace data.

Known non-blocking design debt:

- Storage upload can succeed before DB metadata insert; if metadata insert then fails, an orphan Storage object can remain because ordinary DELETE is intentionally unavailable.

## Phase 3C — Team, Administration, Reports — VERIFIED

**PR #20**  
Merge commit: `7f28ff09da721681f9f19287f274d82dbcc19e16`

Delivered:

- real read-only Team data;
- real read-only Administration data;
- data-driven reports;
- safer legal PDF output without unsupported official claims;
- consolidated same-organization profile reads.

## Phase 4A / 4A.1 — Core Interactions & Calendar Completion — VERIFIED

**PR #21**  
Merge commit: `840b99d54ef037ffd6a7cde63dd5a90032eb0e60`

Delivered:

- RLS-guarded UPDATE grants for approved PATCH-backed core resources;
- persistent hearing drag/drop through `hearing_date`;
- persistent task drag/drop through `deadline`;
- optimistic UI + database read-back + rollback;
- unified context actions:
  - desktop right-click;
  - mobile long-press;
  - visible `⋮` trigger;
- safe matter actions:
  - Open;
  - Add Hearing;
  - Reschedule Linked Hearing;
  - Close/Reopen;
- hearing actions:
  - Reschedule;
  - Archive/Restore;
  - Clear Note;
- task actions:
  - Complete/Reopen;
  - calendar deadline movement;
- client context actions;
- matter calendar markers derived from real hearings;
- removal of `mockTasks` fallback from AppShell;
- removal of local-only fake matter contact mutations;
- guarded calendar drag payload to prevent arbitrary JSON parsing errors.

No DELETE capability was introduced.

## Phase 4B-A / 4B-B — Environment Verification & Audit Trail Foundation — MERGED / DEVELOPMENT VERIFIED

**PR #24**  
Merge commit: `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`

Delivered:

- Production/Development environment isolation was formally classified as unresolved P0 without creating paid infrastructure;
- database-enforced Core Audit Trail foundation;
- `private.audit_core_row()` SECURITY DEFINER trigger function with restricted execution;
- six Core audit trigger surfaces across Clients, Matters, Hearings, Tasks, Finance, and Documents;
- constrained direct RAJIH audit insertion;
- tighter audit-log read visibility;
- safety tests for the audit contract;
- Development migration `20260921111252 axia_phase4b_audit_trail_foundation`;
- tenant/RLS/audit smoke tests with all fixtures rolled back.

Verification:

- PR #24 exact final head: `3cbd8efdb74de8424a395d926d37ee85c90507cc`;
- GitHub CI #158: SUCCESS;
- exact-head Vercel Preview: READY;
- merge content verification: 0 file differences between tested PR head and merged content;
- Development migration present;
- Core audit trigger count: 6;
- remaining test fixture count: 0.

Post-merge reconciliation:

- the automatic Production deployment was initially blocked by Vercel build-rate limit;
- owner manually created a Production deployment from the exact merged `main` commit without changing code or settings;
- deployment `dpl_3reCzQgMksqmrXPCQJtzCws3EAzS` reached `READY`;
- Production SHA was verified as `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
- GitHub combined Vercel status is now `success`;
- runtime error inspection found no current errors in the checked window;
- Development migration parity remains intact with migration `20260921111252`, six audit triggers, zero fixtures, and zero residual test audit rows.

## Phase 4B.1 / Cleanup Batch 2 — Matter Domain Consolidation — VERIFIED

**PR #31**  
Merge commit: `41bcb9437cc4c980c2d476d57a4e6d9d1c6a6982`

Delivered:

- canonical `MatterCreateInput`;
- pure `matters-domain.ts`;
- removal of fake full-`Matter` construction from Client dashboard creation;
- ID-first Client↔Matter association;
- typed Court / Category / ClientRole option sources with existing visible choices preserved;
- characterization tests protecting current behavior, including non-persistence of Client-dashboard generated notes.

Verification:

- exact tested head: `3ecacfd841a97d202ba505d6797fcec70f5b1687`;
- CI #176: SUCCESS;
- exact-head Vercel Preview: SUCCESS;
- tested-head-to-merge content difference: 0 files;
- post-merge Vercel status: SUCCESS;
- no API route, Supabase, RLS/Auth, migration, dependency, or Vercel configuration changes.

Cleanup Batch 2 status: **CLOSED**.

---

# 5. 2026-09-21 Full System & Supabase Audit

This section records the read-only audit findings that must influence future phases.

## 5.1 Confirmed strengths

### Core tenancy and authorization

- Core `public` tables reviewed have RLS enabled.
- Core tenant-sensitive business tables are not ordinarily readable by `anon`.
- Workspace resolution and organization scoping form a usable security foundation.
- Existing Core APIs use session-scoped Supabase access instead of Service Role.
- Core update policies use tenant-aware conditions.
- Cross-organization task update testing was blocked by RLS as expected.

### Authentication

- Public self-registration is currently not the normal login path.
- Login is intended for authorized users.
- Auth session handling uses server-side Supabase integration.
- No Service Role was found in normal Core APIs reviewed in the audit.

### Documents

- `legal-documents` is a private Storage bucket.
- Signed download behavior exists.
- Ordinary document delete is intentionally not exposed.
- Upload and metadata are real, not mock.

### CI / delivery

- Typecheck, Lint, Safety tests, and Production build form the existing quality gate.
- Feature delivery through branch → PR → Preview → approval → merge is established.

---

## 5.2 P0 / must be resolved before real client production data

### P0-A — Production vs Development Supabase isolation is not yet formally verified

**Status:** `READY_FOR_SCOPE`

Before real client onboarding, confirm that Vercel Production does not rely on the Development Supabase project unless that is an explicit temporary decision.

Required future evidence:

- Production Supabase project identity;
- Preview/Development project identity;
- environment variable mapping by environment;
- migration parity;
- RLS parity;
- no real client data in Development.

### P0-B — Legal draft editor is still local-device state

**Status:** `READY_FOR_SCOPE`

The legal rich-text draft workflow still relies on browser-local persistence and initial mock draft content in parts of the document-editor experience.

Risk:

- draft may exist only on one browser/device;
- clearing browser storage can destroy work;
- no reliable tenant-scoped backup;
- no complete authorship/version/audit trail.

Required direction:

Move legal drafts to server-side persisted document records and versions.

### P0-C — Core business mutation audit foundation

**Status:** `PARTIALLY_RESOLVED — PHASE 4B-B MERGED`

Phase 4B-B established database-enforced audit events for approved Core INSERT/UPDATE operations on Clients, Matters, Hearings, Tasks, Finance, and Documents.

Confirmed behavior:

- Core events are generated by database triggers;
- authenticated users cannot fabricate Core audit namespaces directly;
- RAJIH usage audit remains narrowly allowed under RLS;
- owner/admin organization-wide audit visibility and ordinary-user own-event visibility were verified;
- full before/after legal/client values are not copied into audit metadata.

Remaining work belongs to later product phases: broader entity coverage, lifecycle/delete events, dedicated Audit Center UX, and any compliance-specific retention/export requirements.

---

# 6. P1 Product / Functional Gaps

## 6.1 Legal Library still uses mock content in the visible Library UI

**Status:** `READY_FOR_SCOPE`

The user-facing Legal Library is not yet the final real legal knowledge product.

Required direction:

Connect the Library UI to:

- `legal_sources`
- `legal_source_snapshots`
- `legal_knowledge_documents`
- `legal_knowledge_chunks`
- review/approval metadata

Remove `mockPrecedents` from commercial workflows.

## 6.2 Sidebar counters are hard-coded

**Status:** `READY_FOR_SCOPE`

Examples such as case/client/task numeric badges are not all derived from live data.

Required direction:

All counts and urgency badges must be real workspace-derived values.

## 6.3 RAJIH UI context integration is incomplete

**Status:** `READY_FOR_SCOPE`

The RAJIH endpoint/agent has real read-only tools, but the main chat UI currently does not reliably pass active `organizationId` / `matterId` context for all user flows.

Impact:

- “analyze this matter” may not automatically know the current matter;
- RAJIH audit event recording is incomplete if organization context is absent.

Required direction:

RAJIH becomes context-aware from Matter / Client / Document screens.

## 6.4 RAJIH matter timeline is incomplete

**Status:** `READY_FOR_SCOPE`

Current case context tooling should be expanded to include:

- hearings;
- tasks;
- documents;
- parties;
- finance summary where authorized;
- activity timeline.

## 6.5 Clients update is not fully exposed in UI

**Status:** `READY_FOR_SCOPE`

Backend update capability exists, but full persistent client editing is not yet a mature user workflow.

## 6.6 Finance update capability is not fully exposed in UI

**Status:** `READY_FOR_SCOPE`

Backend PATCH capability exists but frontend workflows remain incomplete for commercial accounting operations.

## 6.7 Matter parties are read-only in the current UI

**Status:** `READY_FOR_SCOPE`

The prior local-only fake add/unlink mutation was removed in Phase 4A.1.

Required direction:

Implement real `matter_parties` CRUD with RLS and audit instead of restoring local-only behavior.

## 6.8 Team and Administration are currently read-only

**Status:** `READY_FOR_SCOPE`

Required future capabilities include:

- invitation;
- activation/deactivation;
- role changes;
- matter assignment;
- seat enforcement;
- office settings.

---

# 7. Security / Hardening Findings

## 7.1 Legal Knowledge grants are broader than necessary

**Status:** `READY_FOR_SCOPE`

Some legal knowledge / ingestion tables have broad table-level grants even though RLS currently prevents unauthorized mutation.

This is not considered an active write vulnerability under current policies, but it weakens defense-in-depth.

Required direction:

Apply least-privilege grants and retain RLS as an additional boundary.

## 7.2 Deprecated `auth.role()` usage exists in legal knowledge policies

**Status:** `READY_FOR_SCOPE`

Supabase recommends policy role targeting through `TO authenticated` / `TO anon` instead of `auth.role()` checks.

Required direction:

Refactor affected policies in a dedicated migration after safety verification.

## 7.3 `vector` extension is in the public schema

**Status:** `PLANNED`

Supabase Security Advisor reported this.

Do not move it casually because legal knowledge/vector code may depend on current schema resolution.

Resolve in a dedicated hardening phase with migration verification.

## 7.4 Leaked Password Protection is disabled

**Status:** `PLANNED`

Enable before commercial production after checking the intended Auth policy and user onboarding flow.

## 7.5 Performance advisor findings in legal knowledge/ingestion

**Status:** `PLANNED`

Observed categories include:

- foreign keys without supporting indexes;
- RLS init-plan recommendations;
- unused indexes.

Do not remove “unused” indexes based only on current Development statistics.

## 7.6 Global CORS / security headers need hardening review

**Status:** `READY_FOR_SCOPE`

The web configuration should be reviewed for:

- unnecessary wildcard CORS;
- Content Security Policy;
- HSTS where appropriate;
- frame protections;
- referrer policy;
- permissions policy.

This must be done without breaking Supabase Auth, document download, PWA behavior, or future integrations.

## 7.7 CI reproducibility

**Status:** `VERIFIED — CLEANUP BATCH 1`

Cleanup Batch 1 validated the committed lockfile with `npm ci` in GitHub Actions and then replaced CI `npm install` with `npm ci`.

Verification:

- install succeeded from the lockfile;
- exact-head CI #166 passed Typecheck, Lint, Safety tests, and Production build;
- no dependency versions or lockfile contents changed in the batch.

---

# 8. Safe Deletion Architecture

## Current decision

Do not add generic hard-delete buttons to legal records.

Matter dependencies include mixed referential behavior:

- some matter-linked records use `CASCADE`;
- tasks / finance / RAJIH requests include restrictive relationships.

A direct matter delete can therefore destroy legal records or fail unexpectedly.

## Required lifecycle

`Active → Archived → Trash → Restored / Guarded Purge`

### Required safeguards

Before final purge show:

- linked hearings;
- tasks;
- documents;
- finance records;
- matter parties;
- member assignments;
- AI action requests;
- other blocking dependencies.

Hard purge must be separately authorized and audited.

---

# 9. Owner Product Requirements — Accepted Into Roadmap

The following requirements are approved as product goals. They are not all approved for immediate implementation in one branch.

## 9.1 Premium AXIA Login Experience

**Goal:** a world-class branded entry experience unique to AXIA.

Requirements:

- premium full-screen composition;
- AXIA logo and product name;
- refined animation, not generic template motion;
- possible concept: points/lines assembling into the AXIA symbol;
- subtle depth/light/motion;
- fast and accessible;
- professional login form;
- dark/light behavior;
- no public sign-up unless a later business decision enables it;
- mobile/desktop responsive.

The animation must not delay login usability unnecessarily.

## 9.2 AXIA Brand System

Create a coherent brand asset system:

- AXIA symbol;
- AXIA wordmark;
- AXIA Legal lockup;
- light version;
- dark version;
- monochrome version;
- favicon;
- desktop/PWA icon;
- mobile icon;
- maskable icon;
- social/marketing mark.

The symbol must remain recognizable at very small sizes.

## 9.3 Installable AXIA App

AXIA should be installable from supported browsers on:

- Android/mobile;
- desktop;
- laptop;
- supported PWA environments.

Required work:

- Web App Manifest;
- installable icons;
- maskable icons;
- standalone display;
- app name / short name;
- theme/background colors;
- install CTA/education UX;
- update behavior;
- safe offline/error shell;
- no assumption that legal business data is fully offline.

## 9.4 Responsive Product Redesign

AXIA must be intentionally designed for:

- mobile;
- tablet;
- laptop;
- desktop;
- large desktop.

Target components include:

- AppShell;
- Sidebar;
- top navigation;
- tables;
- cards;
- forms;
- modals;
- calendars;
- context menus;
- RAJIH;
- search;
- profile;
- documents.

Do not solve responsiveness through ad hoc one-page fixes.

## 9.5 Sidebar / Navigation Redesign

Requirements:

- clearer Arabic labels;
- larger and more readable typography;
- better spacing;
- better active state;
- consistent icons;
- data-driven badges;
- stable collapsed mode;
- good mobile navigation.

Recommended grouping:

### Legal Work
- Matters
- Hearings
- Tasks
- Clients

### Documents & Intelligence
- Documents
- Templates / Drafts
- Legal Library
- RAJIH AI

### Management
- Finance
- Team
- Reports
- Administration

Final names remain subject to owner approval.

## 9.6 Office Profile

Create a real tenant/office profile including appropriate fields such as:

- office name;
- office logo;
- contact information;
- address;
- invoice/legal document identity settings;
- optional tax/business fields where required;
- document/signature branding settings;
- office preferences.

No office name should remain hard-coded in reusable product chrome.

## 9.7 User / Owner Profile

Create a real user profile including:

- name;
- image/avatar;
- role/title;
- email;
- phone;
- notification preferences;
- display preferences;
- security/session controls where supported.

## 9.8 Expand AXIA Modules

The product should become comprehensive for Egyptian law-office operations.

Candidate modules accepted into product planning:

- CRM / prospects / consultations;
- execution and bailiff workflows;
- powers of attorney;
- correspondence / notices;
- finance / collections;
- branches;
- activity / audit center;
- archive/trash;
- legal templates/drafts;
- legal library;
- reports and analytics.

Modules will be prioritized and implemented in separate phases.

## 9.9 AXIA Demo Environment

A dedicated demo experience is required for sales.

Requirements:

- separate demo tenant/environment;
- fake but realistic Egyptian legal data;
- no real client information;
- restricted destructive or external actions;
- controlled reset strategy;
- clear “Demo” identity;
- representative workflows:
  - client;
  - matter;
  - hearing;
  - task;
  - documents;
  - finance;
  - RAJIH where appropriate.

The demo must not live as fake rows mixed into a real customer tenant.

## 9.10 AXIA Developer / Owner Control Center

A separate owner control plane is required.

It should not be implemented as a hidden customer-facing button.

Required future capabilities:

- organization/office management;
- plan assignment;
- subscription state;
- trial state;
- seat limits;
- storage limits;
- module entitlements;
- RAJIH entitlement;
- feature flags;
- suspend/reactivate tenant;
- system announcements;
- usage visibility;
- release/version visibility;
- support/operational controls;
- audit.

Authorization must be server-side and independent of normal office roles.

## 9.11 Subscription Architecture

AXIA should support multiple commercial plans without hard-coding every office.

Possible conceptual tiers:

- Starter
- Professional
- Enterprise

Final plan names, pricing, and entitlements remain business decisions.

Architecture should separate:

- subscription state;
- feature entitlements;
- usage limits;
- payment provider integration.

Do not make business logic permanently dependent on one payment provider.

---

# 10. Target Product Architecture

AXIA should evolve into three clearly separated operational surfaces.

## 10.1 AXIA Legal App

Used by law firms and their staff.

Contains:

- legal workspace;
- client/matter operations;
- calendar/tasks;
- documents;
- finance;
- team;
- reports;
- legal knowledge;
- RAJIH.

## 10.2 AXIA Demo Environment

Used by prospective customers.

Contains realistic demo data and restricted actions.

Must be isolated from real tenant data.

## 10.3 AXIA Control Center

Used by AXIA product owner/developer operations.

Contains commercial and operational control of tenants, subscriptions, features, limits, and product operations.

Must have a stronger authorization boundary than ordinary tenant administration.

---

# 11. Locked Product Roadmap v1

**Roadmap lock date:** 2026-09-21  
**Requirements included:** Owner-confirmed Batches 01–02  
**Change-control rule:** new ideas after this lock are recorded as a new requirements batch and must not silently expand an in-progress phase.

The sequence below is now the canonical implementation order unless a fresh live audit discovers a safety dependency that requires reordering.

## Phase 4B — Data Integrity & Security Hardening

**Status:** `VERIFIED — 4B-A COMPLETE / 4B-B MERGED / DEVELOPMENT VERIFIED / PRODUCTION RECONCILED`

Objective: establish a safe commercial data/security baseline before major product expansion.

Primary scope:

- formally verify Production vs Development Supabase isolation;
- design and implement consistent audit logging for core mutations;
- remove hard-coded business counters from commercial UI paths;
- reduce Legal Knowledge grants to least privilege;
- replace deprecated legal-knowledge `auth.role()` policy patterns safely;
- review wildcard CORS and security headers;
- make CI dependency installation reproducible;
- define document-upload orphan recovery;
- verify security advisors after changes.

### Phase 4B-A — Environment Isolation Verification

**Verification date:** 2026-09-21  
**Branch:** `feat/axia-phase4b-audit-foundation-v1`  
**Mode:** Read-only

Confirmed:

- current `main`: `eee3ba657ad69e07faca27eeabbd9d60b12142cc`;
- Vercel Production deployment for that SHA is `READY`;
- connected Supabase organization: `ramyelhawary73-coder's Org`;
- organization plan: `free`;
- connected Supabase projects include:
  - `AXIA Legal Development` — `qshgczulivsxztgrbqew` — `ACTIVE_HEALTHY`;
  - unrelated/inactive `noormexa-platform-2026`;
- no Supabase development branches currently exist for AXIA;
- no separate `AXIA Legal Production` Supabase project is visible in the connected organization;
- Vercel connector available to this workflow does not expose Environment Variable values, therefore the exact Production→Supabase binding cannot be proven from Vercel metadata alone;
- public Production HTML/bundles checked did not expose the Development project ref, but absence from fetched client bundles is not proof of environment separation.

**Environment conclusion:** Production/Development Supabase isolation remains **UNVERIFIED / P0**. Do not onboard real paying-customer data until a separate production boundary is explicitly established and verified.

Recommended architecture:

- keep `AXIA Legal Development` as Development;
- create a separate `AXIA Legal Production` project when approved;
- do not copy Development data into Production;
- apply reviewed production-safe schema/migrations only;
- explicitly exclude test/demo seed data from Production;
- map Vercel `Production` variables to Production Supabase and `Preview/Development` to non-production resources;
- verify migration/RLS parity before first real customer.

**Cost / Production project decision:** DEFERRED BY OWNER. Do not query project cost, create a paid Supabase Production project, or introduce any new paid infrastructure at this stage. Continue only with no-additional-cost hardening on the existing Development environment. Revisit Production project creation only when the owner explicitly reopens the decision near Demo/commercial onboarding.

### Phase 4B-B — Audit Trail Foundation Design

**State:** APPLIED TO AXIA LEGAL DEVELOPMENT — VERIFIED — NOT MERGED

Root causes confirmed:

- `public.audit_logs` exists but currently contains `0` rows;
- Core APIs for Clients, Matters, Hearings, Tasks, Finance, and Documents do not write audit events;
- no Core audit triggers exist;
- `authenticated` currently has direct `INSERT + SELECT` grants on `audit_logs`;
- current insert policy allows a logged-in user to submit their own audit rows if organization membership checks pass;
- current select policy allows any member of an organization to read organization audit rows;
- this is insufficient for an authoritative commercial legal audit trail because Core audit events can be omitted by application code and direct user-generated audit rows are possible.

#### Proposed authoritative Core audit architecture

Use database-enforced auditing for existing Core mutations.

Target tables in this foundation:

- `clients`;
- `matters`;
- `hearings`;
- `tasks`;
- `financial_records`;
- `documents`.

Proposed database objects:

1. `private.audit_core_row()` — trigger function.
2. AFTER INSERT / AFTER UPDATE triggers on approved Core tables.
3. Additional audit indexes for organization/time and resource history if query review confirms they are needed.
4. Tightened `audit_logs` RLS so direct user insertion cannot impersonate Core system actions.

Trigger behavior:

- actor: `auth.uid()`;
- organization: row `organization_id`;
- resource id: row `id`;
- resource type: stable singular domain label;
- event names:
  - `client.created`, `client.updated`;
  - `matter.created`, `matter.updated`;
  - `hearing.created`, `hearing.updated`;
  - `task.created`, `task.updated`;
  - `finance.created`, `finance.updated`;
  - `document.created`.
- UPDATE audit metadata stores **changed field names only**, not full before/after client/legal content;
- auto-maintained fields such as `updated_at` are excluded from meaningful-change detection;
- no-op updates should not generate a business audit event;
- audit rows participate in the same DB transaction, so a rolled-back business mutation also rolls back its audit event;
- no DELETE audit is added in this phase because generic Core DELETE remains intentionally unavailable. Delete/archive lifecycle auditing belongs to the Safe Delete/Trash phase.

Privacy rule:

Do not duplicate full National IDs, phone numbers, emails, legal notes, pleading notes, document paths/content hashes, or full financial notes into audit metadata unless a future explicitly approved compliance requirement needs them.

#### RAJIH compatibility

Current RAJIH API writes `rajih.agent.run` to `audit_logs`.

To avoid breaking it while making Core audit authoritative:

- keep direct authenticated INSERT only through a narrowly constrained RLS path for `action = 'rajih.agent.run'`;
- validate `user_id = auth.uid()`;
- validate organization membership;
- if the event targets a matter, validate access to that matter;
- Core event namespaces such as `client.*`, `matter.*`, `hearing.*`, `task.*`, `finance.*`, `document.*` must **not** be directly insertable by authenticated users;
- deeper RAJIH event architecture can be revisited in Phase 16.

#### Proposed audit read access

Initial recommendation:

- owner/admin: organization-wide audit visibility;
- individual user: own audit rows;
- other organization members: no organization-wide audit visibility by default.

Final Audit Center UX remains a later product phase.

#### Proposed verification matrix

Before any migration can be considered complete:

- same-tenant INSERT creates exactly one correct audit row;
- same-tenant meaningful UPDATE creates one audit row;
- no-op UPDATE does not create a false business event;
- cross-tenant mutation remains blocked and creates no audit row;
- rolled-back mutation leaves no audit row;
- authenticated direct insert of a fake Core event is rejected;
- constrained `rajih.agent.run` insert still works for authorized user/org context;
- unauthorized RAJIH org/matter event is rejected;
- owner/admin audit read works;
- ordinary member cannot read another member's organization-wide audit;
- document metadata INSERT generates `document.created` only after DB metadata succeeds;
- no Service Role is introduced;
- Supabase Security Advisor and relevant performance checks are rerun.

#### Prepared implementation artifacts

Prepared on branch `feat/axia-phase4b-audit-foundation-v1`:

- `supabase/migrations/20260921105916_axia_phase4b_audit_trail_foundation.sql`
- `tests/axia-phase4b-audit-foundation.test.mjs`

The migration was applied **only** to `AXIA Legal Development` (`qshgczulivsxztgrbqew`) with Supabase migration version `20260921111252`. No Production environment was changed.

Prepared migration behavior:

- creates `private.audit_core_row()` as a `SECURITY DEFINER` trigger function with empty `search_path`;
- revokes direct execution from `public`, `anon`, and `authenticated`;
- adds AFTER INSERT/UPDATE triggers for Clients, Matters, Hearings, Tasks, and Finance;
- adds AFTER INSERT trigger for Documents;
- does not add DELETE triggers or Core DELETE grants;
- changes `audit_logs` INSERT RLS from broad self-insert to constrained `rajih.agent.run` only;
- narrows organization-wide audit SELECT to owner/admin while ordinary users can read their own rows subject to current organization membership;
- stores only `source` and `changed_fields` metadata for Core trigger events;
- introduces no Service Role and no environment-variable changes.

#### Expected implementation impact if approved

Database changes:

- one new migration;
- one private trigger function;
- six Core table audit triggers;
- revised `audit_logs` insert/select policies;
- no business-table schema rewrite;
- no new paid infrastructure.

Application changes:

- none currently required for the Core trigger path;
- existing RAJIH route remains compatible with the constrained `rajih.agent.run` policy if its organization/matter context is authorized.

No expected business-schema rewrite.

#### Development application & verification result

Migration applied successfully to:

- project: `AXIA Legal Development`;
- project ref: `qshgczulivsxztgrbqew`;
- migration version: `20260921111252`;
- migration name: `axia_phase4b_audit_trail_foundation`.

Post-application verification confirmed:

- `private.audit_core_row()` exists as `SECURITY DEFINER`;
- empty function `search_path` is enforced;
- direct EXECUTE is unavailable to `public`, `anon`, and `authenticated`;
- Core audit triggers exist on Clients, Matters, Hearings, Tasks, Finance, and Documents;
- authenticated direct fake Core audit insert is rejected by RLS;
- authorized `rajih.agent.run` insert remains permitted;
- unauthorized cross-organization RAJIH audit insert is rejected;
- same-tenant Client create/update generates one expected event each;
- no-op update that changes only `updated_at` does not generate a false business event;
- runtime create/update events were successfully generated for Clients, Matters, Hearings, Tasks, and Finance;
- `document.created` was generated on document metadata insert;
- all tested Core trigger events recorded the expected actor and `database_trigger` source;
- cross-tenant Client update was blocked and generated no audit event;
- normal staff member can read own audit events but not another member's events;
- owner can read another member's organization event;
- all smoke fixtures and temporary memberships were rolled back;
- final fixture count: `0`;
- final `audit_logs` count after rollback tests: `0`.

Post-DDL Supabase Security Advisor findings remain limited to the pre-existing warnings:

- `vector` extension in `public`;
- Leaked Password Protection disabled.

No new Security Advisor finding was introduced by Phase 4B-B.

GitHub CI verification:

- run: `AXIA Legal CI #156`;
- tested head: `b40347cb690df6742df2641be331c19424b160cc`;
- Install dependencies: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Safety tests: SUCCESS;
- Production build: SUCCESS.

Final pre-merge verification before roadmap status update:

- PR: `#24`;
- PR state: Open / Draft / Not Merged;
- mergeable: `true`;
- base main SHA: `eee3ba657ad69e07faca27eeabbd9d60b12142cc`;
- verified branch head before this documentation-only status update: `df7d9b98e235a381d33636e9aae693605ea9ea05`;
- branch: `ahead 11 / behind 0`;
- changed files: exactly 3;
- GitHub CI #157: SUCCESS;
- Typecheck: SUCCESS;
- Lint: SUCCESS;
- Safety tests: SUCCESS;
- Production build: SUCCESS;
- Development migration `20260921111252 axia_phase4b_audit_trail_foundation`: present;
- Core audit trigger count: `6`;
- audit trigger function exists as non-executable by `public`, `anon`, and `authenticated`;
- remaining smoke fixture count: `0`;
- remaining test audit row count after rollback tests: `0`;
- Vercel functional Preview for pre-documentation head `b40347c...`: READY;
- final documentation-only head could not receive a new Vercel Preview because the account hit Vercel build-rate limit; this is an infrastructure quota condition, not a code/build failure.

Performance Advisor findings remain the previously known Legal Knowledge/ingestion items:

- 6 unindexed foreign-key notices;
- 6 RLS init-plan warnings;
- unused-index informational notices.

These are not changed in 4B-B.

#### Rollback strategy

If rollback is required, use a follow-up migration that:

- drops the six Core audit triggers;
- drops `private.audit_core_row()` if no longer referenced;
- restores the previous `audit_logs` INSERT/SELECT policies and grants if required;
- leaves business rows untouched;
- does not rewrite historical records.

Do not edit or remove the already-applied migration from history.

Exit criteria:

- Production/Development data boundary is documented and verified;
- core mutation audit design is working on approved resources;
- no tenant-isolation regression;
- Typecheck/Lint/Safety/Build pass;
- Supabase/RLS smoke tests pass;
- Preview/verification evidence recorded in this roadmap.

## Phase 4B.1 — Codebase Baseline, Deduplication & Architecture Cleanup

**Status:** `READ_ONLY_AUDIT_COMPLETE — CLEANUP PLAN READY / NO IMPLEMENTATION STARTED`

**Audit baseline:** `main @ e2c96618ad649efdd66b54a7f5431a18292ac6b5`  
**Audit mode:** Read-only source/configuration review only. No code, dependency, Supabase, Vercel, data, or Production mutation occurred.

Objective: remove confirmed duplication and obsolete paths incrementally without destabilizing working legal workflows.

### 4B.1-A — Confirmed findings

#### F-01 — Authoritative legal drafts still depend on browser-local persistence

**Priority:** P0 carry-forward  
**Classification:** KEEP UNTIL REPLACED — NOT A 4B.1 DELETE TARGET

Evidence:

- `src/components/legal-rich-text-editor.tsx`: ~1332 lines;
- loads `initialMockLegalDrafts` from `src/lib/mock-legal-drafts.ts`;
- reads `localStorage.getItem("axia_legal_drafts_v1")`;
- falls back to `initialMockLegalDrafts`;
- writes the entire drafts array back to localStorage on change.

Conclusion:

This is real product debt, but simply deleting it during cleanup would destroy the current drafting workflow. The correct replacement remains the planned Persistent Legal Document Workspace phase.

Action in 4B.1:

- do not remove the editor or mock-draft fallback yet;
- isolate/refactor only if needed for safe decomposition;
- preserve behavior until server-side draft persistence exists.

#### F-02 — Visible Legal Library still uses mock precedent content

**Priority:** P1 carry-forward  
**Classification:** KEEP UNTIL REPLACED — NOT A BLIND CLEANUP DELETE

Evidence:

- `src/components/views/library-view.tsx` imports `mockPrecedents`;
- its visible precedent list is initialized directly from `mockPrecedents`;
- `src/lib/mock-legal-data.ts` remains a ~715-line mock data module.

Conclusion:

The Library mock is still an active production-path dependency. It must be replaced by the Real Legal Library phase, not merely deleted.

Additional dead-code candidate:

- `mock-legal-data.ts` exports `mockMatters`, `mockHearings`, `mockClients`, `mockTasks`, `mockDocuments`, `mockFinances`, `mockPrecedents`, and `mockTeam`;
- among audited active UI paths, only `mockPrecedents` was confirmed in use;
- the other exports are **candidates**, not approved deletions, until a repository-wide reference scan proves non-use.

#### F-03 — Sidebar contains hard-coded business badges

**Priority:** P1  
**Classification:** CONSOLIDATE / REPLACE WITH LIVE DATA

Evidence in `src/components/app-shell.tsx`:

- Matters badge: `"٥"`;
- Hearings badge: `"اليوم"`;
- Clients badge: `"٥"`;
- Tasks static declaration: `"٣"`, although runtime logic already overrides Tasks with `upcomingTasksCount` when available;
- RAJIH `"AI"` is a product label, not a business count.

Conclusion:

Static numeric/urgency badges can misrepresent live office data.

Cleanup direction:

- keep navigation metadata separate from live counters;
- derive business counts from authoritative workspace state;
- keep `AI` only as a non-numeric product label if desired.

#### F-04 — HTTP response parsing is duplicated across client modules

**Priority:** P1 maintainability  
**Classification:** SAFE CONSOLIDATION CANDIDATE

Confirmed duplicate helper:

`async function readJsonResponse<T>(response: Response): Promise<T>`

is independently implemented in at least:

- `src/lib/clients-client.ts`;
- `src/lib/matters-client.ts`;
- `src/lib/hearings-client.ts`;
- `src/lib/tasks-client.ts`;
- `src/lib/finance-client.ts`;
- `src/lib/documents-client.ts`;
- `src/lib/team-client.ts`;
- `src/lib/administration-client.ts`.

Repeated POST/PATCH fetch configuration also exists across multiple clients.

Risk:

Error handling can drift between modules and fixes must be repeated.

Canonical direction:

Create one small shared browser API response helper while retaining domain-specific user-facing fallback messages where necessary.

#### F-05 — Matter creation and Client↔Matter logic are duplicated

**Priority:** P1  
**Classification:** CONSOLIDATE AFTER CHARACTERIZATION TESTS

Confirmed duplication:

- `MattersView` owns a complete “new matter” form and calls `createPersistentMatter`;
- `ClientDetailDashboard` owns a second matter-creation form;
- `ClientsView` adapts `ClientDetailDashboard` output back into `createPersistentMatter`;
- court option lists are repeated in `MattersView` and `ClientDetailDashboard`;
- Client↔Matter association fallback logic using `clientId` plus name matching is duplicated in `ClientsView` and `ClientDetailDashboard`.

Structural smell:

`ClientDetailDashboard` currently creates a transient `Matter` object with:

- `id: MAT-${Date.now()}`;
- multiple `"غير مسجل"` placeholder values;

then passes it to `onAddNewMatter`, where `ClientsView` maps selected fields into the real persistent API call.

The transient ID is not the persisted database ID, so this is not confirmed data corruption. However, using a full fake `Matter` object as a create-command DTO creates unnecessary coupling and makes future fields easy to mishandle.

Canonical direction:

- define one `MatterCreateInput` contract;
- centralize Court/Category/ClientRole options;
- use one create form primitive or shared create controller;
- centralize Client↔Matter association logic;
- prefer stable `clientId` association over name fallback when IDs are available.

#### F-06 — Workspace data has multiple competing owners and duplicate fetches

**Priority:** P1 architecture/performance  
**Classification:** HIGHER-RISK CONSOLIDATION

Confirmed:

`src/app/page.tsx` loads and owns:

- Clients;
- Matters;
- Hearings;
- Documents;
- Tasks.

At the same time:

- `ClientsView` reloads Clients + Matters;
- `MattersView` reloads Matters;
- `HearingsView` reloads Matters + Tasks + Hearings;
- `FinanceView` reloads Clients + Matters + Finance.

Impact:

- redundant API requests;
- multiple local copies of the same entities;
- refresh callbacks must manually synchronize different owners;
- increased stale-state/regression risk.

Canonical decision required before cleanup:

Choose one deliberate model:

1. central workspace state with domain mutation callbacks; or
2. view-owned data with the shell consuming a dedicated shared query/cache layer.

Do not partially remove loaders until the ownership model is chosen and tested.

#### F-07 — Several components have excessive responsibility concentration

**Priority:** P2 maintainability / regression risk  
**Classification:** DECOMPOSE AFTER TEST COVERAGE

Observed sizes on current main:

- `HearingsView`: ~2631 lines, ~40 `useState` hooks;
- `MattersView`: ~1301 lines, ~25 `useState` hooks;
- `LegalRichTextEditor`: ~1332 lines, ~21 `useState` hooks;
- `ClientDetailDashboard`: ~1212 lines, ~16 `useState` hooks;
- `TasksView`: ~1190 lines;
- `GlobalSearchBar`: ~1148 lines;
- `LegalPdfReportModal`: ~762 lines;
- `AppShell`: ~552 lines.

Additional signal:

- `HearingsView` disables `react-hooks/preserve-manual-memoization`;
- `TasksView` and `AppShell` contain `react-hooks/set-state-in-effect` disables.

Conclusion:

These files are not automatically “bad” because they are large, but they contain multiple independent responsibilities and are expensive to change safely.

Direction:

Split by stable domain responsibility, not arbitrary line count.

#### F-08 — Current safety tests are mainly source-contract tests, not browser behavior tests

**Priority:** P1 before large refactor  
**Classification:** TEST GAP

Audited test files use Node `fs.readFileSync` + regex/assertions against source/migration text.

Examples:

- `tests/axia-phase4a-interactions.test.mjs`;
- `tests/axia-core-ui-integration.test.mjs`;
- `tests/axia-phase4b-audit-foundation.test.mjs`.

They are useful safety contracts, but the audited suite does not exercise the UI in a real browser.

Risk:

A large component refactor can preserve strings/API names and still break user interaction.

Required before high-risk cleanup:

Add focused behavioral/E2E coverage for the workflows being refactored rather than attempting broad E2E expansion in one step.

#### F-09 — CI dependency installation is reproducible in principle but not enforced

**Priority:** P2  
**Classification:** SAFE HYGIENE CANDIDATE

Confirmed:

- `package-lock.json` exists;
- lockfile version = 3;
- CI still runs `npm install`.

Direction:

Validate `npm ci` on a branch, then use it in CI if successful. Do not combine this with dependency upgrades.

#### F-10 — Dependency removal candidates require proof

**Priority:** P2  
**Classification:** NEEDS REFERENCE PROOF

Current direct dependencies include `glob`.

The audited package scripts do not import `glob`, while other major dependencies have confirmed audited consumers:

- `html2canvas` / `jspdf` → PDF export;
- `motion` → Hearings UI;
- `recharts` → Matters dashboard;
- Supabase/Next/React/theme/icon packages → active runtime.

`glob` is therefore a dependency-removal candidate, **not a confirmed unused dependency**. Do not remove until a complete repository reference check proves it is unused.

#### F-11 — Domain/API/UI status translation is distributed across adapters

**Priority:** P2 architecture  
**Classification:** CONSOLIDATE BY DOMAIN, NOT GLOBAL REWRITE

Examples:

- API hearing statuses use English technical values while UI `Hearing.status` is Arabic;
- Finance maps technical `pending/completed/cancelled` + direction into Arabic UI states;
- Matter update inputs expose technical `open/closed/archived` while UI Matter types use Arabic status labels.

This is a valid boundary pattern, but mapping rules are distributed and can drift.

Direction:

Keep API/database values technical and centralize each domain’s mapping in explicit adapters/contracts. Do not convert the whole database or UI vocabulary during cleanup.

### 4B.1-B — Confirmed false positives / intentionally retained paths

#### FP-01 — Matters dashboard localStorage is UI preference, not business persistence

`src/components/views/matters-view.tsx` stores only:

`axia_dashboard_widget_order`

This controls dashboard widget order.

Decision: **KEEP**.

Reason:

It is user-interface preference state, not authoritative legal/business data.

#### FP-02 — Overview and Reports are data-driven

Audited `OverviewView` and `ReportsView` derive counts/distributions from supplied Matters, Hearings, Tasks, Clients, and Documents.

Decision: **KEEP**.

No evidence from this audit that these views use mock KPI counts.

#### FP-03 — Server API foundation is already usefully centralized

Core routes already share:

- `src/lib/api/validation.ts`;
- `src/lib/api/errors.ts`;
- `src/lib/api/workspace.ts`.

Decision:

Do not invent a broad server framework abstraction merely for deduplication. Consolidate only repeated domain rules with clear benefit.

#### FP-04 — Active mock files must not be deleted before replacement

`mock-legal-drafts.ts` and the Library’s `mockPrecedents` are active dependencies.

Decision:

They remain known product debt, not dead-code deletion candidates.

### 4B.1-C — Out-of-scope issues discovered/confirmed during audit

These remain valid risks but should not be mixed into code-cleanup commits:

- wildcard CORS remains in `next.config.ts`;
- Production vs Development Supabase separation remains unresolved for real-customer onboarding;
- Legal Library real-data replacement belongs to Phase 15;
- persistent legal drafts belong to Phase 11;
- Safe Delete lifecycle belongs to Phase 12;
- Legal Knowledge grants/RLS performance work belongs to dedicated hardening work.

### 4B.1-D — Proposed Cleanup Batches

#### Cleanup Batch 1 — Low-risk shared client infrastructure & CI hygiene

**Status:** `VERIFIED — MERGED`

Implementation PR:

`#27 — refactor: Cleanup Batch 1 client infrastructure`

Merge commit:

`6efe7d5f1732f94f5ec0878331ada0cc190740d1`

Delivered:

- shared browser helper `src/lib/api/client-response.ts`;
- eight audited client modules migrated to `readJsonResponse<T>(response, fallbackMessage)`;
- domain-specific fallback error messages preserved;
- existing endpoints, HTTP methods, request bodies, domain mappings, and business behavior preserved;
- focused contract test `tests/axia-cleanup-batch1-client-infra.test.mjs`;
- CI install changed from `npm install` to `npm ci`;
- no dependency versions or lockfile contents changed.

Verification history:

- first validation proved `npm ci` succeeds and reported 0 npm vulnerabilities at install time;
- that run exposed one missing fallback argument in the multiline Team client call;
- the defect was corrected before merge consideration;
- exact-head CI #166 passed Install / Typecheck / Lint / Safety / Production build;
- exact-head Vercel Preview status was `success`;
- post-merge comparison from tested PR head to `main` shows 0 file differences;
- GitHub Vercel status on merge SHA `6efe7d5f1732f94f5ec0878331ada0cc190740d1` is `success`;
- no Supabase, migration, UI, Business Logic, dependency-version, or Vercel configuration changes were introduced.

Post-merge verification limitation:

- the available GitHub workflow connector does not enumerate push-triggered runs for this commit query, so a separate push-CI run on `main` is not claimed as verified;
- direct Vercel deployment details are temporarily inaccessible due connector authorization `403`, so only the GitHub-reported Vercel success state is verified after merge.

Risk after merge: Low.

Cleanup Batch 2 is **VERIFIED AND CLOSED**.

#### Cleanup Batch 2 — Matter creation/domain constants consolidation

**Status:** `VERIFIED`  
**Closeout:** `CLOSED`

**Audit baseline:** `main @ fe23cc2213810abd91715d81cecf84ec2e6a46b7`

**Implementation baseline:** `main @ 48d68903eee7412333b6cc26260b9ec220d2481a`

**Implementation branch:** `feat/axia-cleanup-batch2-matter-domain`

The review was read-only. No implementation branch, functional code, Supabase, migrations, dependencies, or Vercel configuration were changed.

### Root Cause

The core issue is that the Client dashboard uses the full persisted/read-model `Matter` interface as a create-command DTO.

That forces `ClientDetailDashboard` to fabricate fields that are not part of the create operation:

- transient `id: MAT-${Date.now()}`;
- placeholder opponent data;
- placeholder assigned lawyer;
- placeholder next-hearing data;
- placeholder fee data;
- UI-only status/stage defaults.

`ClientsView` then receives that fake full `Matter` and immediately projects only a small subset back into the real `createPersistentMatter(...)` API contract.

This creates unnecessary coupling between:

- create-form state;
- persisted Matter read model;
- display-only placeholder fields;
- API create input.

The backend `POST /api/matters` contract itself is not the Root Cause and does not require redesign for this cleanup.

### Current creation flow A — MattersView

`MattersView` directly calls `createPersistentMatter` with:

- `caseNumber`;
- `title`;
- `court`;
- `category`;
- `clientId`.

Current defaults/behavior that must remain unchanged:

- default court: `محكمة النقض`;
- default category: `مدني`;
- user must select a persisted client;
- successful create prepends the persisted Matter returned by the API;
- form closes/resets after success;
- `onMatterCreated` remains the refresh callback;
- no fake Matter object is created in this path.

### Current creation flow B — ClientDetailDashboard → ClientsView

`ClientDetailDashboard` currently creates a complete transient `Matter` with:

- `id: MAT-${Date.now()}`;
- current year;
- selected court;
- circuit or `الدائرة المختصة`;
- title;
- client name/id;
- selected client role;
- several `غير مسجل` placeholder read-model fields;
- stage/status defaults;
- current filing date;
- placeholder fee fields;
- a locally generated notes value.

It then calls `onAddNewMatter(newMatter)`.

`ClientsView` converts that object back to the persistent create input and currently forwards only:

- `caseNumber`;
- `title`;
- `court` unless `غير مسجل`;
- `category` if present;
- `clientId` from the selected client;
- `caseYear`;
- `circuit` unless `غير مسجل`;
- `clientRole` unless `غير مسجل`;
- `filingDate`.

Important characterization finding:

The locally generated `notes` value in `ClientDetailDashboard` is **not currently forwarded to `createPersistentMatter`** by `ClientsView`.

Cleanup Batch 2 must not silently start persisting that note, because that would be a business-behavior change rather than a pure refactor.

### Current persistent create contract

`src/lib/matters-client.ts` currently accepts an inline create object containing:

- required: `caseNumber`, `title`, `clientId`;
- optional: `court`, `category`, `caseYear`, `circuit`, `clientRole`, `filingDate`, `claimAmount`, `currency`, `notes`.

The client POSTs the input unchanged to `/api/matters`.

The API:

- resolves the authenticated tenant workspace;
- validates required text and UUID client ID;
- verifies the client belongs to the current organization;
- derives `organization_id` and `created_by` server-side;
- inserts status `open` and stage `active`;
- returns a persisted mapped `Matter`.

No API or Supabase change is required for this cleanup batch.

### Confirmed duplication — Client↔Matter association

The same matching logic exists in both:

- `src/components/views/clients-view.tsx`;
- `src/components/client-detail-dashboard.tsx`.

Current logic is:

- match by `clientId`; OR
- match by partial client-name containment.

Risk:

If a Matter has a non-empty `clientId` that does not equal the current Client ID but has a similar client name, the current `matchId || matchName` logic can still associate it by name.

Canonical direction:

Use one pure ID-first helper:

1. if `matter.clientId` exists, only compare IDs;
2. use normalized name fallback only when the Matter has no client ID;
3. preserve the existing containment fallback for legacy/no-ID records unless later separately approved for stricter matching.

The current real Matters API always maps persisted `row.client_id` into `Matter.clientId`, so normal persisted records already have the stable association key.

### Confirmed option duplication

Court option literals are repeated across:

- `MattersView` create/filter UI;
- `ClientDetailDashboard` create/filter UI;
- `CourtCategory` type.

The two create forms intentionally expose different current subsets:

- `MattersView` create: `محكمة النقض`, `المحكمة الاقتصادية`, `مجلس الدولة (القضاء الإداري)`, `استئناف عالي`, `ابتدائية كلي`;
- `ClientDetailDashboard` create includes those plus `جزئية`.

Therefore Batch 2 must **not** unify the UI by silently adding/removing options.

Canonical approach:

- one pure Matter domain module owns typed option definitions;
- separate exported subsets preserve the exact current option sets for each existing form;
- labels/values come from the same canonical source.

Category options are repeated inside `MattersView`.

Client-role options are embedded in `ClientDetailDashboard` while the API has its own server-side valid-role set.

Batch 2 should centralize client-side/domain UI constants only; it should not modify server validation in the same cleanup PR.

### Proposed canonical domain module

Recommended new pure module:

`src/lib/matters-domain.ts`

Responsibilities only:

- `MatterCreateInput` type;
- typed Matter category aliases/options;
- typed create-court options/subsets;
- typed client-role options;
- `matterBelongsToClient(matter, client)` helper.

It must import only domain types and must not fetch, mutate state, call Supabase, or contain UI rendering.

Do **not** create a new shared mega-form in this batch.

### Cleanup Batch 2 implementation and closeout result

Implemented on `feat/axia-cleanup-batch2-matter-domain` and merged through PR #31:

- tested PR head: `3ecacfd841a97d202ba505d6797fcec70f5b1687`;
- merge commit: `41bcb9437cc4c980c2d476d57a4e6d9d1c6a6982`;
- added `src/lib/matters-domain.ts` as a pure domain module;
- introduced named `MatterCreateInput` and wired `createPersistentMatter(input: MatterCreateInput)`;
- removed the transient fake full-`Matter` object from `ClientDetailDashboard`;
- preserved the current Client-dashboard persistent payload behavior, including current year, filing date, and the existing `الدائرة المختصة` fallback when circuit is blank;
- kept Client-dashboard generated notes non-persisted;
- centralized typed Court / Category / ClientRole option definitions while preserving each current visible option set and label;
- replaced duplicated Client↔Matter matching with one ID-first `matterBelongsToClient(...)` helper; name fallback is used only when `matter.clientId` is absent;
- added focused Cleanup Batch 2 characterization tests;
- no API route, Supabase, RLS/Auth, migration, dependency, Vercel configuration, UI redesign, or Batch 3+ change was introduced.

Verification completed:

- CI #176 passed `npm ci`, Typecheck, Lint, Safety tests, and Production build on exact head `3ecacfd841a97d202ba505d6797fcec70f5b1687`;
- Vercel Preview was `success` on the same exact head;
- PR #31 was merged using merge commit only with the expected head SHA;
- comparison from tested PR head to merge commit showed 0 file differences;
- post-merge GitHub-reported Vercel status for `41bcb9437cc4c980c2d476d57a4e6d9d1c6a6982` is `success`;
- Cleanup Batch 2 is closed.

### Proposed MatterCreateInput

Recommended contract:

```ts
export type MatterCreateInput = {
  caseNumber: string;
  title: string;
  clientId: string;
  court?: Exclude<Matter["court"], "غير مسجل">;
  category?: NonNullable<Matter["category"]>;
  caseYear?: number;
  circuit?: string;
  clientRole?: Exclude<Matter["clientRole"], "غير مسجل">;
  filingDate?: string;
  claimAmount?: number;
  currency?: string;
  notes?: string;
};
```

`createPersistentMatter` should accept this named type instead of an inline object type.

For the Client dashboard callback, use an input derived from this contract without `clientId`, then let `ClientsView` inject the already-selected persisted client ID.

This removes the need for a fake full Matter while keeping the real create contract explicit.

### Behavior that must remain unchanged

Batch 2 implementation must preserve:

- both existing creation entry points;
- existing visible form fields;
- current default court/category/role values;
- current client selection behavior;
- current API endpoint and POST body field names;
- current tenant/workspace enforcement;
- current status/stage defaults created by the API;
- current successful-return behavior using the persisted Matter;
- current error messages unless a source-only type change requires no user-visible change;
- Client-dashboard notes must remain non-persisted in this cleanup unless a separate business change is approved;
- no new category field may be added to ClientDetailDashboard in this cleanup;
- no court option may be added/removed from either create form in this cleanup.

### Exact implementation scope proposed

Expected files:

- new `src/lib/matters-domain.ts`;
- `src/lib/matters-client.ts`;
- `src/components/views/matters-view.tsx`;
- `src/components/views/clients-view.tsx`;
- `src/components/client-detail-dashboard.tsx`;
- new focused characterization/source-contract test;
- `docs/AXIA_MASTER_ROADMAP.md`.

Expected non-files:

- no `src/app/api/matters/route.ts` change;
- no Supabase migration;
- no Auth/RLS change;
- no Vercel configuration change;
- no dependency change;
- no visual redesign.

### Characterization tests required before/with refactor

Add a focused Cleanup Batch 2 test file protecting at least:

1. `createPersistentMatter` still POSTs to `/api/matters` and sends `JSON.stringify(input)`;
2. `MatterCreateInput` is the named contract used by the client;
3. `MattersView` still creates with the same five fields and persisted-client selection;
4. `ClientDetailDashboard` no longer constructs `MAT-${Date.now()}` or a fake full `Matter`;
5. Client dashboard create still carries the currently persisted fields only;
6. `ClientsView` injects `selectedClient.id`;
7. the local dashboard note does not become newly persisted during this cleanup;
8. both client surfaces use one `matterBelongsToClient` helper;
9. the helper uses ID as authoritative whenever present and falls back to name only when ID is absent;
10. both existing create-form court option sets remain exactly unchanged;
11. category and client-role options come from the domain constants;
12. existing Core UI/API safety tests continue to pass.

Because current AXIA tests are mainly source-contract tests rather than full browser E2E, Preview verification must manually exercise both create entry points before merge.

### Risk assessment

Overall implementation risk: **Medium**.

Primary risks:

- accidentally changing POST payload semantics;
- accidentally persisting the currently discarded Client-dashboard note;
- changing visible court options while deduplicating constants;
- changing default court/category/client-role values;
- over-tightening the legacy name fallback and hiding old no-ID records;
- introducing circular imports between types/client/domain modules;
- converting the cleanup into a shared mega-form/redesign.

Mitigation:

- keep `matters-domain.ts` pure;
- preserve current option subsets exactly;
- add characterization tests first;
- make Client ID authoritative only when present;
- do not edit the API route;
- run `npm ci`, Typecheck, Lint, Safety, Build;
- publish Preview;
- manually test both Matter-create entry points;
- stop before merge for owner approval.

### Proposed implementation order

1. add characterization tests that describe current persistence behavior;
2. add pure `matters-domain.ts`;
3. move the inline create contract to `MatterCreateInput`;
4. replace fake full-Matter creation in `ClientDetailDashboard` with a create input;
5. adapt `ClientsView` to inject selected Client ID;
6. extract and adopt the ID-first association helper in both client surfaces;
7. extract typed option constants while preserving each form’s existing visible subset;
8. run full quality gate;
9. publish Preview;
10. update Roadmap;
11. stop for owner merge approval.

Historical scope-review checkpoint (superseded by merged PR #31): Cleanup Batch 2 implementation had **not** started at that time.

#### Cleanup Batch 3 — Navigation live-badge cleanup

Scope:

- remove hard-coded business badge values;
- derive Matters/Clients/Hearings/Tasks badges from real workspace state where reliable;
- otherwise show no badge;
- keep RAJIH `AI` as a non-business label if owner wants it.

Risk: Low–Medium.

This can later be visually refined again in the dedicated Sidebar redesign phase.

#### Cleanup Batch 4 — Workspace data ownership consolidation

Scope:

- choose and document one data ownership model;
- remove duplicate Core fetch ownership between `page.tsx` and individual views;
- preserve read-back/rollback behavior for mutations;
- reduce manual refresh coupling.

Risk: High.

Required first:

- behavioral tests for refresh/navigation/mutation flows;
- explicit data ownership design review.

#### Cleanup Batch 5 — Component decomposition

Suggested sequence:

1. `HearingsView`;
2. `MattersView`;
3. `TasksView`;
4. `ClientDetailDashboard`;
5. `GlobalSearchBar`;
6. `LegalRichTextEditor` only where decomposition does not interfere with future server persistence.

Extract by responsibility:

- calendar;
- forms;
- filters;
- modals;
- domain action controllers;
- presentation sections.

Risk: Medium–High.

Rule:

No visual redesign or new features in the same refactor batch.

#### Cleanup Batch 6 — Dead-code / dependency pruning after proof

Scope:

- perform complete reference scan;
- remove only confirmed-unused mock exports/components/helpers/assets;
- verify whether `glob` is genuinely unused;
- remove stale compatibility code only after callers are migrated.

Risk: Medium if evidence is complete; High if guessed.

Rule:

No file/package is removed based only on filename, age, or current Development usage.

### 4B.1-E — Recommended canonical paths

| Concern | Canonical direction |
| --- | --- |
| Browser API response parsing | one shared typed response helper |
| API auth/workspace boundary | keep existing `api/workspace.ts` |
| API validation/errors | keep existing shared validation/error utilities |
| Matter creation | one `MatterCreateInput` + shared create path |
| Court/category/role options | domain constants, not repeated JSX literals |
| Client↔Matter relation | ID-first shared helper; name fallback only if explicitly required |
| Core workspace state | one deliberate ownership/cache model |
| Widget order preference | keep localStorage UI preference |
| Legal drafts | keep current path until server persistence replaces it |
| Legal Library mock | keep until real Library replaces it |
| Static business badges | replace with live values or remove |

### 4B.1-F — Audit conclusion

The current codebase does **not** require a rewrite.

The main cleanup problem is not “too much code everywhere”; it is concentrated in:

- duplicated browser client plumbing;
- duplicated Matter/Client UI-domain logic;
- multiple data owners/fetch paths;
- several oversized components;
- active mock/local-only product gaps that need replacement, not deletion;
- limited behavioral test coverage for safe refactoring.

The safest first cleanup is **Batch 1**, not deletion of large files.

No cleanup implementation has started.

## Phase 5 — AXIA Brand Identity & Premium Login

**Status:** `PLANNED`

Objective: establish the distinctive commercial identity of AXIA.

Primary scope:

- AXIA symbol;
- wordmark and lockup;
- light/dark/monochrome variants;
- favicon/app icon foundation;
- premium full-screen login;
- subtle AXIA-specific animated brand reveal;
- accessibility, performance, responsive login behavior.

Exit criteria:

- original reusable AXIA identity approved by owner;
- icon remains recognizable at small sizes;
- login is usable without waiting for animation;
- keyboard/mobile login works;
- Preview visually approved before merge.

## Phase 6 — Installable AXIA PWA

**Status:** `PLANNED`

Objective: make AXIA installable as a first-class app experience.

Primary scope:

- Web App Manifest;
- app/maskable icons;
- standalone display;
- mobile/desktop install UX;
- update UX;
- theme/splash behavior;
- safe offline/error shell;
- preserve server-controlled legal data.

Exit criteria:

- manifest/installability validation passes;
- installation verified on a desktop Chromium environment;
- installation verified on Android/mobile;
- installed app launches standalone;
- update/session behavior verified.

## Phase 7 — Responsive Product System

**Status:** `PLANNED`

Objective: create one coherent responsive system rather than page-specific patches.

Primary scope:

- layout/breakpoint rules;
- mobile/tablet/laptop/desktop/large-desktop behavior;
- tables/cards/forms/modals;
- calendar;
- search;
- RAJIH;
- documents;
- touch-safe interactions;
- Arabic typography readability.

Exit criteria:

- no critical horizontal overflow on supported widths;
- core workflows remain usable by touch and keyboard;
- high-density tables have deliberate small-screen behavior;
- modal/context-menu flows work on mobile.

## Phase 8 — AppShell, Sidebar & Navigation Redesign

**Status:** `PLANNED`

Objective: make navigation commercially polished, readable, and data-driven.

Primary scope:

- clearer Arabic labels;
- information grouping;
- larger readable typography;
- consistent icons;
- live counters;
- collapsed desktop mode;
- mobile navigation;
- remove hard-coded office/user chrome;
- consistent top-bar/search/profile affordances.

Exit criteria:

- no hard-coded business badges remain in production navigation;
- mobile and desktop navigation are both fully usable;
- final Arabic section names approved by owner.

## Phase 9 — Office & User Profiles

**Status:** `PLANNED`

Objective: make AXIA genuinely configurable per office and user.

Primary scope:

- office name/logo/contact/address;
- office document/invoice identity;
- appropriate business/tax fields;
- branding/preferences;
- user avatar/name/title/contact details;
- notification/display preferences;
- supported security/session controls.

Exit criteria:

- reusable product shell contains no hard-coded office identity;
- edits persist server-side;
- tenant/user scope is enforced;
- sensitive profile changes are audited where appropriate.

## Phase 10 — Core Legal ERP Completion

**Status:** `PLANNED`

Objective: complete the main daily legal-office workflows.

Primary scope:

- full persistent Client edit;
- Matter Parties CRUD;
- POA management;
- Matter Members/assignments;
- Finance edit/correction/reversal workflows;
- document metadata;
- matter timeline;
- remaining safe context actions;
- Team/Administration capabilities needed for office operation.

Exit criteria:

- no UI-only business mutation in core modules;
- create/edit/refresh persistence verified;
- tenant isolation verified for every new mutable resource;
- critical core workflows covered by regression/E2E tests.

## Phase 11 — Persistent Legal Document Workspace

**Status:** `PLANNED`

Objective: remove authoritative legal drafting from browser-local storage.

Primary scope:

- server-persisted drafts;
- versions;
- authorship;
- audit;
- matter/client linking;
- final document/archive integration;
- replacement/version lifecycle;
- remove unsupported “officially approved” claims unless supported by verified review metadata.

Exit criteria:

- legal draft survives browser/device changes;
- version history is durable;
- no authoritative legal draft depends on localStorage;
- document security and tenant scope verified.

## Phase 12 — Safe Delete, Trash & Record Lifecycle

**Status:** `PLANNED`

Objective: give users practical record control without unsafe hard deletion.

Primary scope:

- Archive;
- Trash;
- Restore;
- dependency preview;
- owner/admin authorization;
- guarded purge only where legally/product-wise appropriate;
- audit all lifecycle actions.

Exit criteria:

- matter deletion cannot silently cascade critical legal data;
- blocking dependencies are shown;
- restore path works;
- purge is separately authorized and audited.

## Phase 13 — AXIA Demo Environment v1

**Status:** `PLANNED`

Objective: provide a safe, premium sales experience before full commercial launch.

Primary scope:

- isolated Demo tenant/environment;
- realistic fictitious Egyptian legal data;
- visible Demo identity;
- reset strategy;
- representative Client/Matter/Hearing/Task/Documents/Finance flows;
- optional RAJIH showcase only where data/source quality is suitable;
- block uncontrolled external/destructive actions.

Exit criteria:

- Demo contains no real client data;
- Demo cannot mutate paying-customer/control-plane state;
- reset works;
- sales walkthrough is repeatable;
- product is visually coherent on desktop and mobile.

## Phase 14 — AXIA Control Center Foundation & Subscription Entitlements

**Status:** `PLANNED`

Objective: give the AXIA product owner safe commercial control over tenants and plans.

Primary scope:

- tenant registry;
- activate/suspend;
- trial state/dates;
- plan assignment;
- seat/storage limits;
- module entitlements;
- RAJIH entitlement;
- feature flags;
- usage visibility;
- system announcements;
- release/version visibility;
- support operations;
- strong control-plane audit.

Exit criteria:

- authorization is server-side;
- normal office admins cannot gain product-owner privileges;
- entitlements are enforced server-side;
- tenant suspension/reactivation is tested;
- control actions are audited.

## Phase 15 — Real Legal Library

**Status:** `PLANNED`

Objective: replace visible mock legal knowledge with real source-backed legal content.

Primary scope:

- real source browsing;
- legal document/source/version metadata;
- review/approval state;
- effective dates;
- source links/references;
- legal search UX;
- remove `mockPrecedents` from commercial paths;
- align knowledge basis with RAJIH.

Exit criteria:

- no visible commercial Legal Library relies on mock precedent data;
- every displayed legal source has traceable metadata;
- access/performance policies verified.

## Phase 16 — RAJIH Deep Context Integration

**Status:** `PLANNED`

Objective: turn RAJIH into a contextual legal copilot inside AXIA.

Primary scope:

- active Matter/Client/Document context;
- richer timeline including hearings/tasks/documents/parties;
- citation/source UX;
- audit meaningful runs;
- proposal-based write actions;
- human confirmation before mutation.

Exit criteria:

- RAJIH can identify the active matter context reliably;
- citations/sources are visible when applicable;
- no autonomous destructive mutation;
- tenant isolation and tool authorization verified.

## Phase 17 — Expanded Legal Operations Modules

**Status:** `PLANNED`

Objective: expand AXIA into a broader Egyptian law-office operating system.

Candidate sub-phases:

- CRM / prospects / consultations;
- execution and bailiff workflows;
- powers of attorney;
- correspondence / notices;
- branches;
- advanced finance / collections;
- activity/audit center;
- advanced reporting/analytics.

Rule:

Each module receives a separate domain/schema/security scope and may be split into multiple PRs/phases.

## Phase 18 — Notifications & Legal Deadline Engine

**Status:** `PLANNED`

Objective: make critical reminders reliable beyond an open browser tab.

Primary scope:

- server-side scheduled reminders;
- in-app notifications;
- browser/email delivery policy;
- critical legal deadlines;
- office/user notification preferences;
- failure/retry visibility.

Exit criteria:

- critical reminders do not depend solely on client polling;
- tenant/user targeting verified;
- delivery failures are observable;
- no sensitive data leaks through notification channels.

## Phase 19 — Commercial Release Hardening

**Status:** `PLANNED`

Objective: qualify AXIA for the first paying customer and repeatable commercial operation.

Primary scope:

- full browser E2E suite for critical flows;
- tenant-isolation regression suite;
- migration drift checks;
- backups;
- recovery drill;
- production/development isolation confirmation;
- security-advisor remediation;
- performance/index review based on evidence;
- PWA/mobile/desktop QA;
- Demo QA;
- subscription/entitlement QA;
- observability/error-boundary checks;
- zero mock business data in commercial paths.

Exit criteria:

- First Paying Client Gate below is fully satisfied;
- release candidate is owner-approved;
- production deployment and rollback procedure are documented.

---

# 11A. Commercial Milestone Gates

## Gate A — Engineering Baseline Stable

Target after Phases 4B + 4B.1.

Required:

- Production/Development environment boundary understood;
- tenant isolation remains verified;
- core audit strategy established;
- major duplicate/dead-path inventory completed;
- CI baseline reproducible;
- no known P0 code/data-integrity issue ignored.

## Gate B — Demo Ready

Minimum target after Phases 5–13.

Required:

- premium AXIA identity/login;
- installable PWA experience;
- responsive AppShell/navigation;
- office/user identity no longer hard-coded;
- core Client/Matter/Hearing/Task/Document/Finance flows are real and persistent;
- legal drafts used in the Demo are durable, not browser-only;
- safe record lifecycle available or destructive Demo actions restricted;
- isolated fictitious Demo data;
- repeatable Demo reset;
- no real customer data;
- no critical mock business data presented as real.

**A Demo may launch before every future module exists.** It should demonstrate a smaller set of workflows extremely well rather than expose unfinished modules.

## Gate C — First Paying Client Ready

Required before onboarding real paying-customer data:

- Gate A complete;
- Production Supabase/environment isolation formally verified;
- core mutation audit trail operational;
- durable legal document drafts/versions;
- core CRUD complete for the workflows sold in the initial plan;
- Safe Delete/Trash lifecycle or an explicitly safe restricted alternative;
- office/user/team access model sufficient for real office operation;
- backup and recovery procedure verified;
- critical E2E and tenant-isolation tests passing;
- security issues classified with no unresolved P0;
- support/error visibility available;
- commercial tenant activation/entitlement mechanism available;
- no fake/mock business data in sold production paths.

## Gate D — Scalable Commercial Product

Target after Phases 14–19 plus selected Phase 17 modules.

Required:

- Control Center;
- subscription/entitlement enforcement;
- repeatable tenant onboarding;
- Demo-to-paid operational process;
- controlled releases;
- support tooling;
- observability;
- advanced legal knowledge/RAJIH where sold;
- notification/deadline reliability where sold;
- documented upgrade/backward-compatibility process.

---

# 11B. Roadmap Lock Change Control

After Roadmap Lock v1:

1. Do not silently add scope to an in-progress phase.
2. New owner requests are recorded as Batch 03+.
3. A new request is classified as:
   - current-phase blocker;
   - next-phase requirement;
   - later roadmap item;
   - commercial/business decision.
4. DB/Auth/RLS/Production changes always require explicit implementation approval.
5. Urgent defects may be handled separately on a focused branch without unlocking the whole roadmap.
6. Every merged phase updates Current State, Completed History, risks, and NEXT ACTION.

---

# 12. End-to-End Workflows Required Before Commercial Release

At minimum automate and manually verify:

## Authentication

`Login → Workspace resolution → Correct tenant → Logout`

## Client and Matter

`Create Client → Edit Client → Create Matter → Add Party → Assign Member → Refresh → Verify persistence`

## Hearing

`Create Hearing → Drag date → Refresh → Verify persisted date → Archive → Restore`

## Task

`Create Task → Change status → Drag deadline → Refresh → Verify`

## Documents

`Create/Persist Draft → Version → Upload Final → Secure Download → Archive/Restore`

## Finance

`Create Record → Edit / Correct via approved accounting workflow → Matter/Client statement`

## RAJIH

`Open Matter → Ask RAJIH → Correct matter context → Sources/citations → Audit event`

## Tenant isolation

For every mutable module:

`Tenant A operation allowed → Tenant B access/update denied`

## Safe delete

`Archive → Trash → Dependency preview → Restore / Authorized purge`

---

# 13. Data Architecture Rules

1. Every business record that belongs to an office must be tenant-scoped.
2. UI-only mutations are prohibited for legal/business data.
3. Browser localStorage may be used only for harmless UI preferences, not authoritative legal records.
4. No fake/mock business records in normal commercial product paths.
5. Sensitive mutations require server/API validation and RLS.
6. Financial corrections should prefer reversal/void semantics over destructive deletion.
7. Legal document drafts and versions require durable storage and audit.
8. Storage object lifecycle must be coordinated with DB metadata.
9. Schema changes require migrations.
10. RLS migrations require cross-tenant verification.
11. Control Center authorization must be separate from tenant office roles.

---

# 14. UX / Design Rules

1. AXIA must feel like one product, not independent pages.
2. Arabic typography must remain readable at practical screen sizes.
3. Important actions must be discoverable without relying only on right-click.
4. Desktop context menu actions should also have visible `⋮` access.
5. Mobile actions should support touch / long-press only as a supplement, not the only path.
6. Destructive actions use clear confirmations and dependency summaries.
7. Loading, success, empty, and error states are required.
8. Do not show fake counts, fake office names, or fake legal records.
9. Motion is subtle, purposeful, and performance-safe.
10. Login and brand animation must not block fast authentication.

---

# 15. Demo Rules

The Demo environment must:

- never contain real client data;
- be visibly marked as Demo;
- be resettable;
- use realistic but fictitious Egyptian legal examples;
- protect external integrations;
- protect destructive product-management actions;
- demonstrate the major sales workflows.

The Demo must not:

- share a tenant with paying customers;
- reuse actual customer files;
- send real customer emails;
- mutate Production Control Center state.

---

# 16. Control Center Security Boundary

Control Center is not the same as Office Administration.

## Office Administration

A tenant-level feature used by permitted office members.

## AXIA Control Center

A product-owner operational system.

It must have:

- separate routes/app surface;
- server-side authorization;
- explicit owner/operator identity;
- strong audit;
- no security based on hiding navigation links;
- tenant-safe actions;
- confirmations for suspension or entitlement changes.

Potential future separation into a dedicated deployment/repository may be evaluated when Control Center scope is finalized.

---

# 17. Subscription / Entitlement Model — Draft

Do not treat this as final pricing.

Potential entitlement categories:

- Core CRM;
- Matters;
- Hearings;
- Tasks;
- Documents;
- Finance;
- Team;
- Reports;
- Legal Library;
- RAJIH;
- advanced automation;
- storage;
- seats;
- branches.

The product should resolve entitlements server-side and use UI gating only as presentation.

---

# 18. Known Risks Register

## KR-001 — Production DB isolation not formally verified

Priority: P0  
Status: Open

## KR-002 — Legal drafts/local versions stored in browser

Priority: P0  
Status: Open

## KR-003 — Missing complete audit trail for core business mutations

Priority: P0  
Status: Open

## KR-004 — Legal Library visible mock data

Priority: P1  
Status: Open

## KR-005 — Hard-coded navigation counters

Priority: P1  
Status: Open

## KR-006 — RAJIH UI does not always supply active business context

Priority: P1  
Status: Open

## KR-007 — Team/Admin are read-only

Priority: P1  
Status: Open

## KR-008 — Legal Knowledge grants broader than least privilege

Priority: P1 Security hardening  
Status: Open

## KR-009 — Deprecated `auth.role()` policy patterns

Priority: P1 Security hardening  
Status: Open

## KR-010 — Supabase Leaked Password Protection disabled

Priority: P1 before commercial release  
Status: Open

## KR-011 — `vector` extension in public schema

Priority: P2 hardening  
Status: Open

## KR-012 — No complete browser E2E suite

Priority: P1 before commercial release  
Status: Open

## KR-013 — Browser-only notification polling is insufficient for critical legal deadlines

Priority: P1 before commercial release  
Status: Open

## KR-014 — Document Storage/metadata transaction can leave orphan object on metadata failure

Priority: P2  
Status: Open

## KR-015 — Accumulated duplicate/dead/overlapping code can increase release risk

Priority: P1 before broad product expansion  
Status: Open

Required response: evidence-based codebase inventory and incremental deduplication; no blind mass cleanup.

## KR-016 — Main/Production deployment drift due Vercel build-rate limit

Priority: P1 release-process blocker  
Status: Resolved — 2026-09-21

Resolution evidence:

- GitHub `main`: `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
- Production deployment: `dpl_3reCzQgMksqmrXPCQJtzCws3EAzS`;
- Production deployment state: `READY`;
- Production Git SHA exactly matches `main`;
- GitHub Vercel status: `success`;
- runtime verification found no current errors in the checked window.

Lesson:

If Vercel auto-deploy is blocked by account quota, do not change code merely to retrigger deployment. Prefer a no-cost deployment of the exact intended Git commit once build capacity is available.

## DR-001

**Decision:** AXIA remains one evolving product; do not rebuild from zero.  
**Reason:** the current core backend, RLS, Storage, UI integration, and CI are usable foundations.

## DR-002

**Decision:** `docs/AXIA_MASTER_ROADMAP.md` is the canonical product-state handoff.  
**Reason:** old README state became stale and conversation-only state caused coordination risk.

## DR-003

**Decision:** no direct `main` edits.  
**Reason:** production stability.

## DR-004

**Decision:** no generic direct legal-record hard delete.  
**Reason:** mixed CASCADE/RESTRICT dependencies and legal record retention risk.

## DR-005

**Decision:** matters are not “rescheduled” as calendar dates; hearings are the scheduling record.  
**Reason:** preserve correct domain model.

## DR-006

**Decision:** AXIA Demo is isolated from real customer data.  
**Reason:** privacy and sales safety.

## DR-007

**Decision:** AXIA Control Center is a separate security boundary from Office Administration.  
**Reason:** product-owner powers must not be ordinary tenant permissions.

## DR-008

**Decision:** PWA installation is a product requirement, but authoritative legal data remains server-controlled.  
**Reason:** installability does not imply unsafe offline data ownership.

## DR-009

**Decision:** codebase cleanliness and maintainability are commercial product requirements, not optional technical polish.  
**Reason:** AXIA is intended for recurring commercial operation; duplicate/dead/patch-on-patch code increases support cost, regression risk, and slows safe product evolution.

## DR-010

**Decision:** cleanup must be incremental and test-backed rather than a repository-wide rewrite.  
**Reason:** preserve stable functionality while converging on canonical implementations.

## DR-011

**Decision:** Requirements Batches 01–02 are locked into Roadmap v1 as of 2026-09-21.  
**Reason:** implementation should now proceed in controlled phases; future ideas use change control rather than silently expanding active scope.

## DR-012

**Decision:** Demo Ready and First Paying Client Ready are separate milestones.  
**Reason:** a safe sales Demo can showcase a focused set of workflows before every future module exists, while real customer data requires a higher security, persistence, recovery, and operational standard.

## DR-013

**Decision:** no new paid Supabase Production project or other paid infrastructure will be created or cost-queried at this stage.  
**Reason:** owner has explicitly deferred new infrastructure cost. Phase 4B should continue with no-additional-cost hardening in Development, while Production/Development isolation remains a known P0 that must be resolved before real paying-customer data is onboarded.

---

# 20. Requirements Inbox

Use this section for new owner requirements before implementation.

## Process

1. Owner describes requirements in any order.
2. Requirements are added here.
3. Engineering maps them to existing architecture.
4. Duplicates/conflicts are identified.
5. Each item is assigned to a phase.
6. Sensitive DB/Auth/Production work is explicitly approved before implementation.
7. Implementation does not begin merely because an item appears in this inbox.

## Current inbox

The following high-level requirements have already been accepted and mapped above:

- premium login;
- unique AXIA branding;
- installable mobile/desktop app;
- responsive system;
- improved sidebar/navigation;
- office profile;
- user/owner profile;
- additional modules;
- sales demo;
- developer/owner Control Center;
- subscriptions;
- full professional product completion.

### Owner-confirmed Requirements Batch 01 — Productization & Commercial Readiness

**Status:** `LOCKED_IN_ROADMAP_V1`  
**Captured:** 2026-09-21  
**Owner intent:** turn AXIA from a working legal ERP into a distinctive commercial Egyptian legal product that can be installed, demonstrated, sold, subscribed to, and centrally operated.

#### A. Premium branded login

Required outcome:

- AXIA-specific visual identity, not a generic template;
- professional login composition comparable in polish to premium global SaaS products;
- animated brand reveal such as particles/points/lines assembling into the AXIA symbol;
- animation must remain fast, subtle, accessible, and non-blocking;
- visible AXIA Legal name and legal product positioning;
- responsive from mobile through large desktop;
- no public self-registration unless separately approved.

Acceptance criteria:

- login remains usable before/while animation completes;
- no layout shift that blocks credentials;
- no hard-coded personal office identity;
- passes keyboard and mobile interaction testing;
- Preview approved visually by owner before merge.

#### B. Brand asset system and install icon

Required outcome:

- one recognizable AXIA symbol that works at both hero size and tiny app-icon size;
- wordmark and lockup variants;
- dark/light/monochrome variants;
- favicon;
- PWA icons including maskable variants;
- desktop shortcut/application icon;
- reusable design tokens so brand identity stays consistent across the product.

Acceptance criteria:

- icon remains legible at small sizes;
- no separate unrelated logos for login/PWA/desktop;
- asset ownership/originality must be clear for commercial use.

#### C. Installable application experience

Required outcome:

- AXIA can be installed from supported browsers on mobile, laptop, and desktop;
- standalone launch experience with AXIA icon/name;
- install prompt or guided install UX where browser rules permit;
- safe update notification;
- safe offline/error shell;
- authoritative legal data remains server-controlled.

Acceptance criteria:

- manifest validates;
- installability verified on at least one desktop Chromium environment and one Android/mobile environment;
- installed app launches standalone;
- app upgrade does not silently break existing sessions or cached shell.

#### D. Full responsive system

Required outcome:

- product designed intentionally for mobile, tablet, laptop, desktop, and large desktop;
- no page-by-page emergency CSS patches;
- shared layout rules for AppShell, navigation, cards, forms, modals, calendars, tables, documents, search, RAJIH, and profile areas;
- touch-safe targets and readable Arabic typography.

Acceptance criteria:

- no critical horizontal overflow on supported widths;
- key workflows remain usable with touch;
- tables degrade to scrollable/card-based layouts where appropriate;
- modal and context-action behavior works on small screens.

#### E. Sidebar / navigation redesign

Required outcome:

- larger, clearer Arabic labels;
- stronger section grouping and visual hierarchy;
- consistent iconography;
- live counters instead of hard-coded badges;
- good collapsed desktop mode;
- proper mobile navigation;
- naming aligned with Egyptian legal-office workflows.

Initial grouping remains:

- Legal Work;
- Documents & Intelligence;
- Management.

Final Arabic section names are owner-approved before implementation lock.

#### F. Office profile and owner/user profile

Required outcome:

Office profile:

- office name;
- logo;
- contact information;
- address;
- document/invoice identity;
- optional business/tax fields when needed;
- branding/preferences.

User profile:

- name;
- avatar;
- role/title;
- email;
- phone;
- notification preferences;
- appearance/preferences;
- security/session controls where supported.

Acceptance criteria:

- no reusable shell element depends on a hard-coded office/user identity;
- editable fields are tenant/user scoped and audited where appropriate.

#### G. Product module expansion

Goal:

AXIA should become a comprehensive legal-office operating system for Egypt.

Accepted candidate module families:

- CRM / prospects / consultations;
- execution and bailiff workflows;
- powers of attorney;
- correspondence / notices;
- finance / collections;
- branches;
- activity / audit center;
- archive / trash;
- legal templates / drafts;
- real legal library;
- reports / analytics;
- future legal deadline automation.

Rule:

No module is implemented only because it appears in this list. Each module gets a separate domain/schema/security scope before implementation.

#### H. Sales Demo

Required outcome:

- dedicated Demo tenant/environment;
- realistic but fictitious Egyptian legal data;
- clearly marked demo mode;
- safe reset strategy;
- representative end-to-end workflows;
- no real customer records;
- no uncontrolled external email/payment/destructive actions.

Commercial objective:

A prospective law office can experience AXIA safely before purchase.

#### I. AXIA Developer / Owner Control Center

Required outcome:

A product-owner control plane separate from ordinary Office Administration.

Required capabilities:

- list/manage organizations;
- activate/suspend tenant;
- trial state and dates;
- subscription plan;
- seat limits;
- storage limits;
- enabled/disabled modules;
- RAJIH entitlement;
- feature flags;
- system announcements;
- usage visibility;
- release/version visibility;
- support/operational controls;
- strong audit trail.

Security rule:

Control Center privileges must be enforced server-side and must never rely only on hidden UI.

#### J. Subscription and entitlement architecture

Required outcome:

- support commercial tiers without hard-coding offices;
- separate plan, subscription status, feature entitlements, usage limits, and payment integration;
- module-level enable/disable;
- future payment-provider flexibility.

Possible conceptual tiers remain:

- Starter;
- Professional;
- Enterprise.

Pricing and final packaging remain owner business decisions.

### Recommended productization sequence for Batch 01

1. Data Integrity & Security Hardening.
2. Brand Identity + Premium Login.
3. PWA / Installability.
4. Responsive System + AppShell/Sidebar redesign.
5. Office/User Profiles.
6. Core ERP CRUD completion + persistent legal drafts.
7. Safe Delete/Trash.
8. Real Legal Library + deeper RAJIH context.
9. Demo Environment.
10. Control Center + Subscription/Entitlements.
11. Expanded modules in separately scoped sub-phases.
12. Commercial Release Hardening.

**Reason for this order:** do not build a polished commercial shell, demo, or subscription control plane on top of unresolved audit/data-integrity gaps.

### Owner-confirmed Requirements Batch 02 — Codebase Excellence, Maintainability & Premium Commercial Quality

**Status:** `LOCKED_IN_ROADMAP_V1`  
**Captured:** 2026-09-21  
**Owner intent:** AXIA must become a premium commercial product that can be maintained and expanded for years as a recurring-income software business. The internal codebase must be as disciplined as the external product experience.

#### A. No patch-on-patch engineering

Required rule:

- do not solve new problems by stacking duplicate handlers/components/helpers over old ones;
- identify Root Cause first;
- prefer one canonical implementation per business capability;
- replace obsolete paths rather than leaving old and new versions active together;
- temporary compatibility code must be explicitly marked and scheduled for removal.

#### B. Whole-system codebase cleanup

Before commercial release, perform a structured repository audit covering:

- dead code;
- unused exports/imports;
- duplicate components;
- duplicate API/client helpers;
- duplicate validation/business rules;
- stale feature branches reflected in code;
- old mock/fake business data;
- local-only business state;
- hard-coded business values;
- abandoned UI states/modals;
- unused assets;
- obsolete styles;
- duplicated icons/branding assets;
- deprecated APIs;
- stale comments/TODOs;
- unnecessary dependencies;
- oversized components that contain unrelated responsibilities.

Cleanup must be evidence-based. Do not mass-delete code, indexes, packages, tables, migrations, or assets merely because they appear unused in a quick scan.

#### C. Single-source-of-truth architecture

Required direction:

- one domain model per business entity;
- one validation contract per operation;
- shared types where appropriate;
- shared permission/tenant rules;
- shared status/date mapping;
- shared UI primitives for repeated patterns;
- no competing implementations for the same Client/Matter/Hearing/Task behavior;
- authoritative business data must come from the server/database, not browser state.

#### D. Safe refactoring strategy

Refactoring sequence:

1. inventory and dependency map;
2. characterize current behavior with tests;
3. identify duplicate/dead paths;
4. choose canonical path;
5. migrate callers;
6. remove obsolete path;
7. run Typecheck/Lint/Safety/Build/E2E as applicable;
8. verify Preview;
9. only then merge.

Large “rewrite everything” refactors are prohibited unless separately justified and approved.

#### E. Code quality gates

Commercial AXIA should progressively enforce:

- reproducible dependency install;
- strict TypeScript;
- lint without ignored new warnings;
- safety/security contract tests;
- browser E2E for critical flows;
- tenant-isolation regression tests;
- API validation tests;
- no new mock business data in production paths;
- no new authoritative legal data in localStorage;
- dependency vulnerability review;
- bundle/performance review for major UI phases;
- accessible keyboard/touch behavior;
- roadmap update on every material PR.

#### F. Performance and maintainability

Required direction:

- remove unnecessary rerenders only where measured/relevant;
- avoid giant components becoming permanent architecture;
- split by domain responsibility, not arbitrary file size;
- lazy-load heavy optional surfaces where appropriate;
- avoid duplicate data fetching;
- keep API contracts explicit;
- prevent N+1-style database patterns where relevant;
- index only based on query/RLS needs and evidence;
- monitor bundle growth and slow workflows.

#### G. Production observability and supportability

A commercial recurring-income product needs operational visibility.

Planned capabilities:

- structured server error logging;
- correlation/request identifiers where useful;
- safe application error boundaries;
- user-friendly failure states;
- operational audit trail;
- release/version identification;
- health visibility for owner/control center;
- no leakage of secrets or sensitive client data in logs.

#### H. Premium product quality definition

“Premium” for AXIA means all of the following together:

- distinctive visual identity;
- fast and responsive interaction;
- reliable persistence;
- clear Arabic UX;
- no fake or placeholder business data;
- secure tenant separation;
- auditable legal operations;
- installable app experience;
- stable upgrades;
- clean maintainable code;
- sales-ready Demo;
- subscription/entitlement control;
- supportable production operations.

Premium does **not** mean visual effects at the expense of stability, security, performance, or legal-data integrity.

#### I. Recurring-income product objective

AXIA is intended to become a sustainable commercial software product, not a one-off internal system.

Engineering therefore must support:

- repeatable onboarding of new offices;
- tenant isolation;
- configurable plans;
- feature entitlements;
- controlled upgrades;
- data migration discipline;
- support tooling;
- Demo-to-paid conversion workflow;
- measurable usage where privacy permits;
- low-risk maintenance and releases;
- long-term backward compatibility strategy.

### Proposed dedicated engineering phase

Add a dedicated implementation phase after initial security/data-integrity hardening and before broad visual/product expansion:

`Phase 4B.1 — Codebase Baseline, Deduplication & Architecture Cleanup`

Scope should include:

- repository dependency/duplication inventory;
- stale mock/local-only path inventory;
- dead-code candidates;
- canonical domain/client/API mapping;
- safe deduplication in small batches;
- removal of confirmed obsolete code;
- CI quality-gate improvements;
- technical-debt register;
- no business-feature scope expansion unless needed to safely consolidate duplicate logic.

### Acceptance criteria for Phase 4B.1

- no functional regression in existing core workflows;
- no tenant-isolation regression;
- no broad destructive cleanup based on guesswork;
- all removed code has evidence of replacement/non-use;
- no duplicate production path remains for any refactored capability;
- CI and relevant E2E tests pass;
- bundle/build remains healthy;
- roadmap records removed technical debt and remaining debt.

**Owner may continue adding requirements before the implementation roadmap is locked.**

---

# 21. Delivery Workflow

Every implementation phase follows:

`READ → UNDERSTAND → EXPLAIN → APPROVAL → BRANCH → IMPLEMENT → TEST → PREVIEW → OWNER TEST → MERGE APPROVAL → MERGE → VERIFY`

## Required pre-implementation report

Before code changes state:

- root cause / objective;
- proposed change;
- affected files/systems;
- database/auth/security impact;
- risks;
- verification plan.

## Required quality gate

As applicable:

- Typecheck;
- Lint;
- Safety tests;
- Build;
- database/RLS smoke tests;
- Preview;
- user workflow test.

## Required merge gate

Never merge solely because CI is green.

Require:

- exact head SHA verification;
- scope/diff review;
- no unexpected files;
- Preview/user verification where UI changes exist;
- explicit owner merge approval.

---

# 22. Master Roadmap Update Checklist For Every PR

Before marking a PR ready:

- [ ] Update Current State if main/architecture assumptions changed.
- [ ] Update phase status.
- [ ] Record migrations.
- [ ] Record new risk or resolved risk.
- [ ] Record architecture decisions.
- [ ] Update Completed Delivery History after merge.
- [ ] Update NEXT ACTION.
- [ ] Update NEW CHAT HANDOFF.
- [ ] Do not include secrets.

---

# 23. NEXT ACTION

**Current mode: OWNER-REQUESTED LOGIN ATMOSPHERE REFINEMENT — P0A ACCEPTANCE STILL PENDING**

1. The bounded Login visual refinement and local checks passed on its own branch. Check its Draft PR's CI and Preview against the exact pushed head, then obtain owner visual review. It is based on the unmerged P0A branch; do not merge either PR yet.
2. Development is restored and the initial catalog/migration/RLS/Storage/advisor read-only reconciliation passed with the documented warnings. Complete direct role/isolation and migration-body reconciliation; do not replay old migrations to satisfy a missing source definition.
3. The owner reconnects Vercel with access to the AXIA team. Verify Preview uses the intended Development project and confirm Production separation without exposing env values.
4. Perform controlled Login/logout/expired-session and two-institution tests on the Preview against real Development Auth. Test fixtures must be identifiable and cleaned up or rolled back; no client data is used.
5. Update this file and the relevant delivery documents with actual results. Stop before merge for owner approval, and verify again after any approved merge. Review the visual direction before spreading it across the system.
6. Next implementation package: P0B dependency security patches, followed by P0C live tenant/schema reconciliation and the delivery sequence in section 26.

P0A does not authorize merging, Production deployment, billing purchases, automatic AI legal-record writes, or destructive SQL. The owner requested necessary Supabase work, but no SQL change is justified by this auth package.

---

# 24. NEW CHAT HANDOFF

When opening a new ChatGPT conversation for AXIA, use this instruction:

> Work on `ramyelhawary73-coder/axia-legal`. First perform a fresh read-only verification of the latest `main`, then read `docs/AXIA_MASTER_ROADMAP.md` from that same current main. Treat it as the canonical project state, roadmap, risk register, and handoff. Do not rely on an old SHA if live GitHub differs. Continue from the `NEXT ACTION` section. Do not modify main directly. Before implementation, explain scope, affected systems, risks, and verification; use a dedicated branch and follow Preview → owner approval → merge → post-merge verification. Do not expose secrets or use Service Role in ordinary user-facing flows.

If the roadmap is newer on an unmerged execution branch, identify that branch and its PR; preserve the active authorized package and never infer merge/Production approval.

---

# 25. Historical Documentation Branch Scope — 2026-09-23

For `docs/axia-cleanup-batch2-closeout-v1`:

Allowed:

- record current `main` after PR #31 merge;
- record exact tested PR #31 head and merge commit;
- record CI #176 and Vercel verification results;
- mark Cleanup Batch 2 verified and closed;
- update Completed Delivery History, Current State, NEXT ACTION, and handoff context.

Not allowed:

- functional code changes;
- Cleanup Batch 3 scope review or implementation;
- API/Supabase/RLS/Auth changes;
- migrations;
- Vercel configuration changes;
- dependency changes.

This branch is documentation-only. Cleanup Batch 2 is closed and Cleanup Batch 3 has **not** started.


---

# 26. Owner-approved execution sequence — 2026-10-10

The full attached `AXIA_LEGAL_MASTER_EXECUTION_PLAN.md` was read alongside this roadmap. Its remaining phases are retained. The owner explicitly requires a premium enterprise Login, an original logo, responsive product design, developer control, subscriptions, RAJIH, complete legal/admin workflows, tests after each implementation, and roadmap updates at each checkpoint. P0 security recovery precedes the remaining feature phases.

| Package | Status | Concrete output | Acceptance / dependencies |
| --- | --- | --- | --- |
| P0A — Auth recovery + enterprise Login foundation | OWNER_TESTING | Real password auth, fail-closed config, safe redirects, controlled errors, honest activation controls, original AXIA SVG mark | Local quality gate; exact-head CI/Preview; desktop/mobile checks; real Development Login/logout and tenant checks before merge |
| P0A visual refinement — Owner-requested animated Login | OWNER_TESTING | Brand-native AXIA scene, atmospheric background, pause/reduced-motion support and viewport scrolling | Local quality/browser checks passed; separate stacked PR; exact-head CI/Preview and owner visual review required |
| P0B — Dependency security | READY_FOR_SCOPE | Minimal compatible patches for identified Next.js/transitive advisories and synchronized lockfile | Repeat audit, Typecheck/Lint/Safety/Build, no forced downgrade; review exploit reachability and Preview regressions |
| P0C — Live schema, Auth, RLS and Storage | READY_FOR_SCOPE | Reconcile live migrations/catalog with source, prove two-tenant isolation, verify environment separation; propose only evidenced repair SQL | Healthy Development + correct Vercel access; migration plan/rollback; direct Auth/RLS/Storage negative tests; no blind replay |
| Cleanup 3 — Navigation counts | PLANNED | Replace fixed legal/business badges with real scoped counts or no count | Empty/loading/error/two-tenant states; preserve existing create flows |
| Cleanup 4 — Remaining fake data and draft safety | PLANNED | Remove active fake production records; migrate globally keyed legal drafts safely to user/tenant persistence | Preserve existing local drafts; no automatic erase; cross-account isolation and reload persistence tests |
| Cleanup 5–6 — Inactive paths and typing | PLANNED | Review unused paths, split overloaded responsibilities, tighten contracts in small PRs | Characterize behavior first; do not repeat Cleanup 1–2 or remove records/files blindly |
| Phase 5 — Premium identity and responsive system | PLANNED | Apply the accepted AXIA identity across shell, navigation, forms, tables, legal editor and RAJIH; accessibility and mobile layouts | Desktop/tablet/mobile and RTL checks; keyboard/focus/contrast; owner approves the visual direction |
| Phases 6–8 — Legal/admin completeness | PLANNED | Finish audited clients, matters, hearings, tasks, documents, finance, team, reports, templates, settings, search and contextual RAJIH flows | Role matrix, persisted read-back, guarded edits, legal exports, empty/error states; complete each subflow in bounded PRs |
| RAJIH completion | PLANNED | Verified workspace/matter context, trusted citations, source provenance, retrieval coverage, usage controls, proposal/approval/audit cycle | No invented citations or public canned legal results; lawyer review; prompt-injection and tenant tests; record writes require human approval |
| Phases 9–10 — Platform developer control + subscriptions | PLANNED | Separate platform-operator authority from office roles; plans, entitlements, seats/AI quotas, billing state, support controls, payment lifecycle | Server enforcement, audited privileged actions, MFA, idempotent verified webhooks, suspension/recovery tests; tenant content access is explicit and audited |
| Phase 11 — Installability and communications | PLANNED | PWA manifest/icons/install UX, safe cache policy, verified email and opt-in notifications | No offline caching of confidential tenant records by default; lifecycle and mobile install tests; no messages sent before configured consent |
| Phases 12–19 — Operations and commercial launch | PLANNED | Production isolation, observability, backups/restore drill, onboarding, customer support, pricing/payment checks, legal/privacy documents and controlled pilot | Gates A–D below; domain/service purchases and Production changes require separate owner approval |

## Commercial release gates

- **Gate A — Security:** real Auth, proven tenant/role isolation, private Storage, reconciled migrations, patched relevant advisories, correct Development/Production separation.
- **Gate B — Product:** complete persisted legal/admin journeys, responsive premium UX, trustworthy RAJIH, no active fake business mutations.
- **Gate C — Operations:** monitored errors, alerts, recoverable backups, incident/support runbooks, developer control with audited authority.
- **Gate D — Commerce:** server-enforced subscriptions, payment lifecycle, legal/privacy terms, installability and a successful consented pilot. Owner explicitly approves Production launch.

## Mandatory delivery checkpoint for every package

Record: scope and root cause → branch/PR/head SHA → code/SQL changes → test results and limitations → Preview URL and owner test steps → roadmap status → next package → ready-to-send approval text. Local tests, hosted Preview, owner testing, merge and Production verification must be reported separately. A blocked hosted check is not a pass.
