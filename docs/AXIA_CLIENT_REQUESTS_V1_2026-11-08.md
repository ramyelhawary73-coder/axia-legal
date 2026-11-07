# AXIA Client Requests V1 — isolated review

Start: PR #49 at `5053f4aff17e859defe20c8e15be879e454c874a`. This branch is stacked on its sidebar work. Supabase project `qshgczulivsxztgrbqew` is read only for this package. Catalog inspection confirmed there is no `client_requests` table, the required client and member keys exist, and the deployed D3 control function matches the expected body hash. No migration was applied remotely.

## Workflow

The office records an existing client's request, an optional case for that client, an optional assignee, a status, a short description and a follow-up date. Owners, administrators and lawyers can create and update records; staff can read only requests assigned to them and only if they can see the linked case. Viewer and trainee roles receive no request access in V1. No client-facing login, message delivery, or new account is added. Archiving keeps the record and history; restoring brings it back. There is no hard-delete endpoint or grant.

The API uses the current server-verified identity and organization, validates input/Origin, and filters updates by request, office, revision and current archive state. A conflicting edit leaves the form contents in place. The database also enforces organization and case/client consistency, rejects cross-office assignees, and inherits suspension/access rules. Case-to-client changes with a linked request require unlinking or reviewing that request first; they do not silently transfer its details to another client.

## Migration and recovery

Review `supabase/migrations/20261107173102_axia_client_requests_v1.sql`. It is an additive transaction with a D3 baseline guard. It adds the request table, indexes, narrowly scoped grants and RLS. The audit trigger records the action, actor, revision and names of changed fields in the existing audit table; request text is excluded. RLS prevents forged edits, fake audit entries and reading history outside the request's access scope. An audit write failure rolls back the request mutation.

The D3 export still builds all rows from one SQL statement, with the same Platform Owner, MFA, reason and export limits. Only its payload table list and version selection change. Offices with no requests retain version 1. Version 2 includes requests and the corresponding audit history; the reader still accepts legacy version 1. The restore verifier requires an empty disposable database and a private nonce marker. During an isolated restore, it pauses only the request audit trigger so it can import the original history without duplicating events, then re-enables it in the same transaction. No hosted restore API is added.

## Verification

- `npm run lint`, `npm run test:safety`, `npm run build`.
- `AXIA_SQL_TEST_MODULE=<isolated PGlite module> node scripts/test-control-center-db.mjs` exercises both offices, mismatched relationships, direct SQL, assigned staff, audit immutability/atomicity, revisions, archive/restore and encrypted snapshot recovery into a fresh local database.
- `AXIA_BROWSER_MODULE=<isolated Playwright module> node scripts/verify-client-requests-ui.mjs` uses only loopback. It tests compiled disabled routes and a synthetic desk/mobile workflow. It is not live sign-in or hosted SQL acceptance.

## Preview and later activation

`AXIA_CLIENT_REQUESTS_ENABLED` defaults off. Vercel Preview exposes the sidebar entry and review state; saving and reading hosted requests stay off while the migration is unapplied. Use the isolated browser evidence for the populated workflow. Before an actual launch, approve the exact migration separately, deploy version-compatible app code, then approve enabling the flag for the intended environment. Re-check hosted permission and recovery acceptance using authorized fixtures only. The earlier migrations must not be replayed. No Supabase write, merge, production deployment, secret or configuration change is authorized by this review package.
