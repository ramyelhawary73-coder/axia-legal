# AXIA Client Requests V1 — isolated review

Start: PR #49 at `5053f4aff17e859defe20c8e15be879e454c874a`. This branch is stacked on its sidebar work. The last read-only preflight confirmed that Vercel Production and Preview use Supabase project `qshgczulivsxztgrbqew`, the new table is absent, the required keys exist, and the deployed D3 function matches the expected hash. Neither stage has been applied remotely.

## Workflow

The office records an existing client's request, an optional case for that client, an optional assignee, a status, a short description and a follow-up date. Owners, administrators and lawyers can create and update records; staff can read only requests assigned to them and only if they can see the linked case. Viewer and trainee roles receive no request access in V1. No client-facing login, message delivery, or new account is added. Archiving keeps the record and history; restoring brings it back. There is no hard-delete endpoint or grant.

The API uses the current server-verified identity and organization, validates input/Origin, and filters updates by request, office, revision and current archive state. A conflicting edit leaves the form contents in place. The database also enforces organization and case/client consistency, rejects cross-office assignees, and inherits suspension/access rules. Case-to-client changes with a linked request require unlinking or reviewing that request first; they do not silently transfer its details to another client.

## SQL stages and recovery

| Stage | Review file | Effect |
| --- | --- | --- |
| 1. Install locked | [20261107173102_axia_client_requests_v1.sql](../supabase/migrations/20261107173102_axia_client_requests_v1.sql) | Creates the request table, its relationships, indexes, RLS and triggers. Explicitly revokes automatic table access from API roles. The existing audit policies and D3 export are unchanged; there is no switch to V2. |
| 2. Activate separately | [axia_client_requests_v1_activate.sql](../supabase/review/axia_client_requests_v1_activate.sql) | Checks that the foundation is installed, locked and clean and that the D3 body still matches. In one transaction it adds request audit protections and V2 export support, then grants only the required access to `authenticated`. This review file is outside `supabase/migrations` so it cannot be picked up by a normal migration run. |

The stages have bounded lock and statement waits. Run each only after separate approval. If a guard fails, stop and inspect the discrepancy; do not replay old migrations or clear unexpected data to make a guard pass.

The audit trigger records the action, actor, revision and names of changed fields in the existing audit table; request text is excluded. RLS prevents forged edits, fake audit entries and reading history outside the request's access scope. An audit write failure rolls back the request mutation.

The D3 export still builds all rows from one SQL statement, with the same Platform Owner, MFA, reason and export limits. Only its payload table list and version selection change. Offices with no requests retain version 1. Version 2 includes requests and the corresponding audit history; the reader still accepts legacy version 1. The restore verifier requires an empty disposable database and a private nonce marker. During an isolated restore, it pauses only the request audit trigger so it can import the original history without duplicating events, then re-enables it in the same transaction. No hosted restore API is added.

## Verification

- `npm run lint`, `npm run test:safety`, `npm run build`.
- `AXIA_SQL_TEST_MODULE=<isolated PGlite module> node scripts/test-control-center-db.mjs` checks that direct SQL reads, inserts and updates fail with `42501` while the foundation is locked, even with simulated Supabase default grants. It checks that a bad activation aborts and that legacy audit reads and V1 export still work. After activation it exercises both offices, mismatched relationships, assigned staff, audit immutability/atomicity, revisions, archive/restore and encrypted snapshot recovery into a fresh local database.
- `AXIA_BROWSER_MODULE=<isolated Playwright module> node scripts/verify-client-requests-ui.mjs` uses only loopback. It tests compiled disabled routes and a synthetic desk/mobile workflow. It is not live sign-in or hosted SQL acceptance.

## Preview and later activation

`AXIA_CLIENT_REQUESTS_ENABLED` defaults off. Vercel Preview shows the sidebar entry and review state. Use the isolated browser verification for the populated workflow. The flag controls the AXIA app, not direct access to the Supabase Data API.

1. Review the exact stage 1 file and freshly verify the live D3 baseline and required keys. Obtain approval for stage 1 only. After installation, verify the effective API grants are still closed and the existing export still returns V1.
2. Verify all active export and recovery readers using the shared database accept both V1 and V2 before approving stage 2. In preflight, the PR #49 reader rejected V2. Update or retire older readers before opening database access. A successful Preview build alone does not satisfy this gate.
3. Obtain separate approval for stage 2 and run only the reviewed activation SQL. Then verify permissions and recovery with authorized fixtures and separately approve enabling the app flag for the intended environment.

If activation later needs to be paused, disabling the app flag alone is insufficient. A database write freeze would need separate review and approval; preserve the request rows, audit history, and V2 export support. No Supabase write, merge, production deployment, secret or configuration change is authorized by this review package.
