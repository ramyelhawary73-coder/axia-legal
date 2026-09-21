# AXIA MASTER ROADMAP

> **Canonical project source of truth**
>
> This file is the authoritative living record for AXIA Legal product state, architecture decisions, delivery phases, known risks, owner requirements, and the exact next action.
>
> **Rule:** every implementation PR must update this file before it is considered complete.
>
> **Last verified:** 2026-09-21  
> **Repository:** `ramyelhawary73-coder/axia-legal`  
> **Default branch:** `main`  
> **Verified main SHA:** `840b99d54ef037ffd6a7cde63dd5a90032eb0e60`  
> **Current documentation branch:** `docs/axia-master-roadmap-v1`

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

## GitHub

- Repository: `ramyelhawary73-coder/axia-legal`
- Default branch: `main`
- Verified main SHA: `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`
- PR #24 — AXIA Phase 4B Audit Trail Foundation — is merged into `main` with merge commit `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`.
- PR #23 Roadmap Lock v1 and PR #22 Master Roadmap documentation are also merged.
- Exact-content verification from PR #24 head to merged `main`: 0 file differences; `main` is ahead by the single merge commit only.
- Merge commits are the approved merge strategy for completed AXIA phases.
- The CI workflow runs:
  - Typecheck
  - Lint
  - Safety tests
  - Production build

## Supabase Development

- Project ID: `qshgczulivsxztgrbqew`
- Last verified state: `ACTIVE_HEALTHY`
- Core tenant data is protected with RLS.
- Core authenticated access does not expose ordinary client/matter/task/document data to `anon`.
- `legal-documents` Storage bucket is private.
- Storage access is intentionally limited; ordinary delete capability is not enabled.
- Core update grants were added only for PATCH-backed resources during Phase 4A.
- No approved general DELETE grant exists for core legal records.

## Vercel

- AXIA production project is deployed and reachable.
- PR #24 final Preview on exact head `3cbd8efdb74de8424a395d926d37ee85c90507cc` was verified `READY`.
- After PR #24 merge, Vercel rejected the automatic deployment for merge SHA `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d` because the account hit the Vercel build-rate limit.
- Therefore GitHub `main` is newer than the currently verified Production deployment. Production remains on the prior main deployment `eee3ba657ad69e07faca27eeabbd9d60b12142cc` until a no-cost deployment can run after quota availability.
- This is an infrastructure quota blocker, not a verified application build failure: PR #24 exact-head CI and Preview were both successful.
- Do not purchase/upgrade infrastructure solely to bypass this blocker unless the owner later approves cost.
- Production Supabase isolation from Development remains a required verification item before real client data.

## Real Development data last observed

- Development contains a small amount of test/working data.
- Do not delete Development data without explicit owner approval.
- Test fixtures used during safe verification must always be rolled back or removed before completion.

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

Post-merge limitation:

- Vercel Production auto-deployment for merge SHA `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d` was blocked by account build-rate limit.
- GitHub push-CI for the merge SHA was not visible through the connected GitHub workflow query at the verification time.
- Do not start the next implementation phase until Production deployment state is reconciled or explicitly accepted as a temporary quota limitation.

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

**Status:** `PLANNED`

Prefer `npm ci` rather than `npm install` in CI when lockfile integrity is confirmed.

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

**Status:** `MERGED — 4B-A VERIFIED / 4B-B VERIFIED / PRODUCTION DEPLOYMENT BLOCKED BY VERCEL QUOTA`

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

**Status:** `PLANNED`

Objective: remove confirmed technical duplication and obsolete paths without rewriting stable functionality.

Primary scope:

- repository dependency and duplication inventory;
- dead-code candidate inventory;
- stale mock/fake/local-only business path inventory;
- canonical Client/Matter/Hearing/Task/API/client-helper mapping;
- shared validation/type/helper consolidation where justified;
- remove confirmed obsolete code only after callers migrate;
- improve code-quality gates;
- create/maintain a Technical Debt Register.

Exit criteria:

- no broad destructive cleanup based on guesswork;
- every removed production path has evidence of replacement or non-use;
- no regression in core workflows;
- no tenant-isolation regression;
- relevant characterization/regression tests pass;
- build/bundle remains healthy.

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
Status: Open — rechecked; Vercel still reports the previous build-rate-limit failure and no current-main Production deployment exists. The available connector does not expose live quota/reset telemetry, so quota renewal cannot be proven without a new deployment attempt.

Current evidence:

- GitHub `main`: `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
- latest verified Production deployment remains on `eee3ba657ad69e07faca27eeabbd9d60b12142cc`;
- Vercel status for the new merge SHA reports build-rate-limit failure.

Required response:

- wait for no-cost quota availability;
- deploy/retry the current `main` without changing code or buying infrastructure;
- verify exact Production SHA and runtime health;
- close this risk before starting the next implementation phase.

---

# 19. Decisions Register

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

**Current mode: PR #24 MERGED — VERCEL QUOTA STATUS RECHECKED / PRODUCTION STILL BEHIND MAIN**

Latest no-cost recheck result:

- GitHub `main`: `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
- PR #24: merged successfully;
- Vercel combined status for current `main`: `failure`;
- Vercel target still points to the prior `build-rate-limit` failure;
- no Production deployment exists yet for merge SHA `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
- latest verified Production deployment remains `eee3ba657ad69e07faca27eeabbd9d60b12142cc`;
- the available connector exposes no live quota/reset counter, so quota renewal cannot be proven without a new deployment attempt;
- no redeploy was attempted in this check;
- no code/configuration/environment variable was changed;
- no paid upgrade or resource was used.

### Next correct action

1. Do **not** start Phase 4B.1 or any new implementation phase.
2. Recheck Vercel build availability later.
3. When the no-cost quota is available:
   - deploy/retry the exact current `main` SHA `b6a9fd6ca381c8a32e976d9de7e863e3b8bbac2d`;
   - verify Production reaches `READY`;
   - verify Production SHA equals current `main`;
   - verify runtime health;
   - verify Development migration parity;
   - update this roadmap.
4. Do not purchase or upgrade infrastructure solely to bypass the current quota unless the owner explicitly changes that decision.

### Current stop condition

**WAIT FOR A SAFE NO-COST VERCEL REDEPLOY ATTEMPT / AVAILABILITY CONFIRMATION.**

No next phase is authorized while Production remains behind `main`.

---

# 24. NEW CHAT HANDOFF

When opening a new ChatGPT conversation for AXIA, use this instruction:

> Work on `ramyelhawary73-coder/axia-legal`. First perform a fresh read-only verification of the latest `main`, then read `docs/AXIA_MASTER_ROADMAP.md` from that same current main. Treat it as the canonical project state, roadmap, risk register, and handoff. Do not rely on an old SHA if live GitHub differs. Continue from the `NEXT ACTION` section. Do not modify main directly. Before implementation, explain scope, affected systems, risks, and verification; use a dedicated branch and follow Preview → owner approval → merge → post-merge verification. Do not expose secrets or use Service Role in ordinary user-facing flows.

If the roadmap is newer on an unmerged documentation branch, explicitly identify that branch and ask the owner whether it should be merged before implementation work begins.

---

# 25. Documentation Branch Scope

For `docs/axia-phase4b-postmerge-v1`:

Allowed:

- record PR #24 merge and post-merge verification;
- record Vercel quota blocker;
- update Current State, Completed History, risks, and NEXT ACTION.

Not allowed:

- functional code changes;
- migrations;
- Supabase mutations;
- Vercel configuration changes;
- paid infrastructure;
- next-phase implementation.

This branch is documentation-only and must not be merged without explicit owner approval.
