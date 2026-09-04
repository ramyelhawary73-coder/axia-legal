# AXIA Legal — Security Boundaries (Phase 1A)

## Hard rules

1. Never expose Supabase service-role keys, database passwords, access tokens, or AI provider secrets to browser code.
2. Browser code may later use only project URL plus a publishable/anon-class key, with authorization enforced by RLS and server-side guards.
3. Tenant isolation and Matter ACL enforcement must be implemented before real client data is accepted.
4. No confidential matter document may be sent to a free/public AI tier by default.
5. RAJIH retrieval must never search across tenants or unauthorized matters.
6. Database schema changes must be migration-driven and separately reviewed.

## Phase 1A guarantees

- no database migration
- no Auth change
- no RLS change
- no Storage change
- no AI provider integration
- no real customer data
- `.env.example` contains variable names only

## Future security gate

Phase 1B must define organization membership, roles, matter access, RLS policies, auditability, and secure Auth/session behavior before implementing business modules.
