# PR #59 — disabled read-only readiness source review

Source implementation only. Hosted deployment, configuration changes and execution
of diagnostics still require separate approval. No changes to SQL files, schema,
roles, grants, Auth, secrets, dependencies, sender admission or provider delivery.

## Problem and behavior

The existing sender returns `503 PUSH_DISABLED` before connecting to Postgres
when sending is disabled. That response does not prove the runtime LOGIN or TLS.
The new diagnostic branch can check those while sending stays disabled. It is
closed by default and cannot claim jobs, update heartbeat/admission/budget, read
subscriptions or call the provider. `handler.mjs` and the timer are unchanged.

`index.mjs` routes **any** `x-axia-push-purpose` header to `readiness.mjs`;
only the exact value `readiness` can pass its checks. Requests without that header
retain the existing sender behavior. Paths are limited to the function itself,
including the gateway-normalized `/axia-push-preview` path.

## Required configuration for a later, separately approved probe

| Setting | Disabled deployment | Later one-off probe |
| --- | --- | --- |
| `AXIA_PUSH_READINESS_ENABLED` | absent or `0` | `1`, separately approved |
| `AXIA_PUSH_READINESS_UNTIL` | absent/empty | fixed UTC deadline, at most five minutes ahead |
| `AXIA_PUSH_ENABLED` | `0` | remains `0` |
| `AXIA_PUSH_EDGE_ENABLED` | `0` | remains `0` |
| SQL gates, sending window, Cron, control center | remain closed/unregistered | remain closed/unregistered |

These are proposed **non-secret** changes, not writes made in this PR. No key
creation, rotation or transfer is needed. Signing uses the existing server-side
HMAC with a separate `axia-push-readiness-v1` domain, fixed project/scope and issued
timestamp. It accepts up to 30 seconds of age and five seconds of clock skew.
Cron signatures cannot authenticate a diagnostic, or vice versa. A valid request
can be replayed during that short age interval; there is no durable replay store
or exactly-once guarantee. Operate one manual request, no retries or schedule.
The deadline check accepts only its final five minutes; never preconfigure a
distant future deadline and leave its flag on, since it would later enter that
acceptance interval. After a probe reset the flag to `0` and remove the deadline.
This diagnostic deadline is unrelated to the 30-minute sending window.

The request body must be exactly `{}`; method POST, JSON content type, no Origin,
query, transfer-encoding or recipient. Body size is two bytes and read time one
second. Invalid/disabled/error responses are uniformly
`503 {"code":"PUSH_READINESS_UNAVAILABLE"}` with no-store and no error details.

## Connection and read-only checks

The Preview origin, project, exact existing pooler host, port 5432, database and
limited LOGIN are checked before client construction. URL query/hash options
(including `sslmode`) are prohibited. The `pg@8.16.3` client uses verified TLS with
the expected server name, a five-second connection/statement timeout and
seven-second query timeout. There is no insecure TLS or alternate-host fallback.

The client starts read-only and executes `BEGIN READ ONLY`, local timeouts,
the existing catalog-based role/sole-dispatcher-membership checks, the
`transaction_read_only` check and its own `pg_stat_ssl` observation, then
`ROLLBACK` and connection close. No new database function or grant is necessary.
Gates/deadline/configuration are checked again after connection and between
queries; expiry or a changed gate aborts and closes the client.

`pg_stat_ssl` behind a pooler describes **pooler to Postgres**, not Edge to pooler.
The returned `backendTlsObserved` boolean is deliberately separate; `false` does
not claim the client-side TLS was disabled. Client-side proof requires successful
connection using the strict client options. A missing backend observation fails.
Success exposes only `PUSH_READINESS_OK`, `readOnly`, `restrictedRole` and
`backendTlsObserved`, never DSN, credentials, identity or certificate content.

## Tests

15 new native-Deno tests cover default-off and five-minute limits; fixed origin,
host/port/user/database checks; HMAC boundaries and cross-purpose rejection;
body/method/header/query rejection and stream timeout; exact read-only SQL
sequence; role and backend checks; redacted errors and connection cleanup;
expiry/config changes during I/O; actual entrypoint routing; and real pg TLS
negatives against a disposable loopback PostgreSQL SSLRequest/TLS fixture.

The TLS fixture verifies two SSLRequests and the actual untrusted-certificate and
wrong-hostname error codes, before any PostgreSQL startup/authentication/query.
It uses a temporary self-signed certificate only inside the local test, deleting
it afterward. No operational key or remote host is used. Existing five handler
and two transport tests also pass (22 Deno tests total). Seventeen Node timer/
transport tests pass. Hosted runtime DB/TLS, CPU quota and physical phone receipt
remain unproved; no result here is a hosted readiness PASS.

## Exact hosted deployment difference — NOT APPLIED

1. Existing Supabase function `axia-push-preview`: replace only `index.mjs` and add
   `readiness.mjs`; preserve all existing sender/shared files and locked packages.
   Keep `verify_jwt=false` with its custom HMAC, no Auth policy change. Deploy
   closed first; do not set a readiness deadline or open any sending flag.
2. Dedicated Cloudflare test timer: change compatibility date **2026-11-28 to
   2026-11-27** with the existing checked-in Wrangler configuration. Preserve
   HMAC, disabled flag, absent/empty sending window, no Cron/routes, public URLs
   off and observability off. Timer code/config files have no source changes.
3. No Vercel deployment is needed for this server diagnostic. A branch-specific
   `git.deploymentEnabled=false` rule in `vercel.json` prevents source publication
   to PR #59 from automatically creating a Preview. Unspecified branches retain
   their default behavior; no main commit or project-dashboard setting changes.
   Keep/remove this rule only as part of a later explicitly approved Preview
   deployment. Do not treat a commit-message skip marker as equivalent.
4. No SQL/Secrets/roles or resources are added. No paid upgrade. A successful
   deployment is followed by a separate approved one-off diagnostic request, not
   a background sending test. Its HTTP invocation counts toward Edge usage and
   does not consume the sending admission budget.

Rollback before any approved probe: restore the prior `index.mjs`/function source
version, leaving sending off; no database rollback or credential rotation. The
Cloudflare date correction is independently reversible. Never roll back to the
temporary Hello World scaffold.

NEXT ACTION: review the new source/test results and hosted difference; approve
disabled-only Edge deployment and exact-date correction separately. Leave Cron,
readiness execution, sending window, sending and control center off. No main
merge or Production deployment.

References: [pg TLS](https://node-postgres.com/features/ssl),
[Supabase routing](https://supabase.com/docs/guides/functions/routing),
[Vercel per-branch deployment control](https://vercel.com/docs/project-configuration/git-configuration#git.deploymentenabled).
