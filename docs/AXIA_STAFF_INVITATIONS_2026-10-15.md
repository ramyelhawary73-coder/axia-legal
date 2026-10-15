# AXIA Staff Invitations & Task Allocation

حالة المرحلة: **الكود والـMigration جاهزان للمراجعة، والتفعيل الحي لم يتم.**

المالك يحدد بريد الموظف ودوره، ويحصل على رابط دعوة صالح ٧ أيام. قبول الرابط يحتاج حسابًا مؤكدًا بنفس البريد، ويضيف عضوية المكتب فقط. توزيع المهام يتحقق من عضوية الموظف ووصوله للقضية، ولا يمنحه وصولًا إضافيًا بمجرد إسناد مهمة.

إرسال البريد تلقائيًا وإنشاء الحسابات الجديدة لم يُفعّلا؛ الواجهة تعرض ذلك صراحة. يلزم التحقق من فصل Development عن Production قبل تطبيق SQL الحي.

## Baseline and authorization

- Repository: `ramyelhawary73-coder/axia-legal`.
- Freshly verified `main`: `dfb557f2741ca521b13fd727abeb0f2c25803fd5`.
- Branch: `feat/axia-staff-email-invitations-20261015`, directly from that main.
- PR #40 remains open and independent. Snapshot/library fixes from it are **not** included here.
- Owner authorized staff invitations and task allocation, including Development DB/Auth/RLS scope. Merge and Production remain excluded. This authorization does not establish that a project labelled Development is operationally separate from Production.
- No live SQL, Auth setting, SMTP setting, secret, account, email send, permission grant or Production deployment was changed by this package.

## Implemented behavior

| Area | Result |
|---|---|
| Team | Create/list/revoke/rotate invitations by email and permitted role; latest 100 records; expiry/pending/accepted/revoked states |
| Delivery | A one-time link is returned on create/rotation; UI says email was not sent. No sender integration or new account provisioning |
| Acceptance | Existing confirmed Auth account, matching email, single-office scope, atomic and idempotent membership creation |
| Tasks | Choose an eligible member when creating a task and reassign existing tasks from list/board; display confirmed assigned member name |
| Enforcement | API checks plus DB trigger for direct Data API writes; assignment never inserts matter ACLs |
| Installation gate | Missing configuration or missing migration keeps invitations/reassignment unavailable; legacy self-assignment remains available |

The previous Team GET endpoint remains read-only with its original mutation capabilities disabled. The new invitation API owns its separate capabilities and mutations. No existing general membership-write endpoint was introduced.

### Role matrix

| Actor | Invitation roles | Task assignment |
|---|---|---|
| owner | admin, lawyer, staff, trainee, viewer | Eligible members of current office |
| admin | lawyer, staff, trainee, viewer | Eligible members of current office |
| lawyer | None | Eligible members of current office |
| staff / trainee | None | Self on task creation; no reassignment |
| viewer | None | No task writes under existing RLS |

Owner invitations, ownership transfer, role editing, member removal and existing-member promotion are excluded. Admin invitations can be rotated/revoked only by an owner. An inviter's current role is rechecked at acceptance, so removing/demoting an inviter invalidates their unaccepted grants. Existing members retain their role in a race with acceptance. A previously accepted link never recreates a removed membership.

### Token, tenant and account handling

- Two random UUIDs provide approximately 244 random bits. Only SHA-256 of the 64-character token is stored. The raw token is returned only on create/rotation; ordinary SELECT cannot read even the hash.
- Link token uses the URL fragment, not query/path, and is removed from the address bar after capture. It stays in page memory through inline login/account switching, never localStorage or a login redirect. Reloading requires reopening the original link.
- Accept-page responses use no-referrer/noindex headers; API responses are private/no-store. Mutations require same-origin requests. No token or recipient email is included in audit metadata.
- New public RPC wrappers are SECURITY INVOKER. Privileged implementations are in the unexposed private schema, with empty search_path, authenticated-only execution and explicit actor checks. No Service Role is used.
- Membership is bound to `auth.users.id`. Matching uses the current confirmed Auth email; anonymous and banned users are rejected. User-editable metadata never decides roles.
- The first-client flow rejects accepting a second office. A multi-office switcher requires later product scope; it is not silently simulated.
- Organization/recipient/invitation locks serialize duplicate creation, token rotation and acceptance. Database role/member locks protect authorization checks. Multi-session concurrency still requires actual server verification; PGlite is a single-session runtime.
- Creation limit: 30 invitations per creator per hour. Rotation cooldown: one minute. Pending email duplicates are prevented per office. Expired invitations are renewed by rotation, which invalidates their previous link.

## Migration review and live boundary

Migration: `supabase/migrations/20261015081218_axia_staff_email_invitations.sql`, generated using `supabase migration new axia_staff_email_invitations` (CLI 2.121.0).

Additive objects: one RLS/FORCE-RLS invitation table and indexes; private create/rotate/revoke/accept functions; public invoker wrappers/capability query; a private assignee guard and BEFORE INSERT/UPDATE task trigger. Existing RLS policies and Auth settings are not rewritten. Authenticated users receive metadata-column SELECT and checked function execution, not direct membership DML or token-hash SELECT.

Acceptance inserts a missing profile and a single membership, records acceptance and writes an existing audit_logs event in one transaction. The trigger validates task recipient membership, non-viewer role and existing matter access on writes. Existing task rows are not rewritten. Database maintenance writes without an authenticated actor must be scoped explicitly; the guard rejects them.

### Historical migration reconciliation

Live audit still found **21 migration history entries versus 19 baseline repository files**. The first four live security-foundation/hardening/index/revoke records have no matching local timestamp. Some later foundational records use different timestamps; the local audit file is `20260921105916`, while live history records `20260921111252`. The early local foundation also uses an obsolete memberships model and must not be blindly replayed over the live organization_members model.

This package **does not repair, reset, rename, baseline or replay historical migrations**. The isolated scaffold models the live prerequisite contracts. Before applying the one new migration, compare its exact reviewed file against the live object definitions and history. Its preflight rejects missing organization_members, audit_logs and required private helpers. Live read-only checks confirmed the required Auth columns and that ordinary membership INSERT/UPDATE grants remain false.

### Activation gate

The visible Supabase project `qshgczulivsxztgrbqew` is labelled AXIA Legal Development, ACTIVE_HEALTHY. Direct Vercel project inspection again returned **403** for `ramyelhawary73-coders-projects`; no authenticated CLI fallback was available. Public login assets did not expose a project URL. Thus the actual Production/Preview database mapping remains **unverified**. Naming alone is insufficient to apply Development-only permission changes safely.

Before live activation:

1. Verify the non-secret Supabase project URL used by Vercel Production and Preview. Do not paste keys or passwords. If they share this project, obtain a separate isolated Development target or explicit revised Production scope.
2. Review this exact migration, prerequisite definitions, and history differences. Do not execute a blanket migration push.
3. Apply this one additional migration to the verified Development target in a transaction, then inspect grants/RLS/definer execution and security advisors.
4. Test actual Auth confirmation/login and controlled employee acceptance, two-session concurrent accept/create/rotation, task allocation and cross-tenant denials using disposable Development fixtures with rollback/cleanup authorization.
5. Verify desktop/mobile and session-expiry behavior on Preview. Review alongside PR #40 and reconcile roadmap/Team changes before merge.
6. Obtain separate merge and Production rollout approval. No real invitations until sender/provisioning scope and recipients are approved.

### Recovery

No live application occurred, so no live rollback was needed. The migration is transactional; failure before commit rolls back its new objects. After future activation, prefer code rollback while retaining the new data, audit events and assignment guard. Legacy clients self-assign and remain compatible. Never drop tables or delete memberships as an automatic rollback. Revoke/rotate individual pending links through checked functions if needed; disabling the feature's execution grants is an explicitly reviewed operational change.

## Verification

- TypeScript, lint and local production build passed; local build used Webpack because node_modules is a worktree symlink. CI must verify the default build on the exact published head.
- **102 application tests** passed: 92 baseline plus 10 new behavior tests. Two old source assertions were updated to reflect pending-invitation capabilities and validated assignment instead of obsolete text/self-only behavior.
- **19 SQL security checks** passed on isolated PostgreSQL **17.5** via PGlite **0.3.14**, matching live Postgres major version 17. Earlier checks also ran on PGlite/Postgres 18; the committed CI pins the 17 runtime.
- SQL cases cover role/tenant denial, no owner/admin escalation, hashed-token storage, direct DML denial, verified email, duplicate/expired/revoked/rotated/replayed invitations, inviter demotion, idempotence, no existing-member promotion, no implicit second office, task ACLs, no staff reassignment and audit redaction.
- Application behavior tests cover normalization, roles, cross-origin/session rejection, fail-closed unconfigured environments, server-derived tenant, no fake sent state, error handling, fresh Auth verification and validated reassignment writes.
- SQL tests use `tests/sql/staff-foundation-fixture.sql`, an isolated model of verified live prerequisites. They are not a full historical migration replay, real SMTP test or live Supabase acceptance.
- Browser verification remains open: local browser installation returned an invalid/truncated archive and the cloud browser navigation timed out. No visual/mobile or real login success is claimed. Deployment protection was not bypassed.
- A missing sender/account-provisioning flow remains a delivery blocker for new employees. This package is not complete email onboarding or final commercial readiness.

Reproduce SQL checks without adding an application dependency:

```bash
npm install --prefix /tmp/axia-staff-db --no-audit --no-fund --ignore-scripts @electric-sql/pglite@0.3.14
AXIA_SQL_TEST_MODULE=/tmp/axia-staff-db/node_modules/@electric-sql/pglite/dist/index.js node scripts/test-staff-db.mjs
```

New UI/API files: `src/components/staff-invitations-panel.tsx`, `src/components/task-assignee-editor.tsx`, `src/app/invitations/accept/{page.tsx,actions.ts}`, `src/app/api/staff-invitations/{route.ts,accept/route.ts}`, `src/app/api/tasks/assignment/route.ts`, `src/lib/staff-invitations.ts`, `src/lib/api/{staff-foundation.ts,task-assignees.ts}`. Existing Team/Tasks/modal/shell/home/client/proxy files connect these flows. CI runs the separate SQL suite with a pinned test-only runtime; package.json and package-lock.json are unchanged. Next-generated AGENTS.md/CLAUDE.md guidance is retained for subsequent work.

Exact-head CI, Preview, changed-file listing and publication evidence will be attached to the Draft PR. Main, PR #40, live Supabase and Production remain unchanged.
