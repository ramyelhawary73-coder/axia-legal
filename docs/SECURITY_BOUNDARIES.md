# AXIA Legal — Security Boundaries

## Hard rules

1. Never expose Supabase secret/service-role keys, database passwords, access tokens, or AI provider secrets to browser code.
2. Browser and SSR clients use only the project URL plus a publishable key; authorization is enforced by RLS and verified Auth claims.
3. Never use `getSession()` as an authorization decision on the server. Protected routes use verified `getClaims()`.
4. Tenant isolation is database-enforced. UI filtering is never an authorization boundary.
5. No confidential matter document may be sent to a free/public AI tier by default.
6. RAJIH retrieval must never search across tenants or unauthorized matters.
7. Database schema changes are migration-driven and separately reviewed.

## Phase 1B guarantees

- `profiles`, `organizations`, and `organization_members` are the only application tables introduced.
- RLS is enabled and forced on every Phase 1B application table.
- `anon` receives no application-table access.
- authenticated users can read only their own profile and organizations where they are members.
- direct browser mutation of organization membership is disabled.
- organization creation is permitted only when `created_by = auth.uid()` under RLS; an internal non-API trigger atomically grants the creator the `owner` membership.
- membership/role helper functions live outside the exposed API schema.
- self-service signup is not exposed by the application.
- no Storage change and no business/client/case data are introduced.
- no service-role/secret key is required by the application.

## Matter ACL contract for later phases

Every future matter-owned record must carry both `organization_id` and a matter authorization boundary. Organization membership alone is not sufficient to access a confidential matter. Matter-level permissions must be enforced by RLS before any real matter data is accepted.
