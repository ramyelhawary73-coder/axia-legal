# Phase 1B — Security & Tenant Foundation

## Authentication

AXIA Legal uses cookie-based Supabase SSR Auth via `@supabase/ssr`. Server authorization decisions use `auth.getClaims()` rather than trusting an unverified local session object.

The application exposes password login only. Public self-signup is intentionally omitted. Account provisioning/invitations will be designed as an administrative workflow later.

## Tenant model

- `organizations` is the tenant root.
- `organization_members` maps authenticated users to one or more tenants.
- roles: `owner`, `admin`, `lawyer`, `staff`, `trainee`, `viewer`.
- direct membership writes are disabled from browser roles in Phase 1B.
- a signed-in user may create an organization only with `created_by = auth.uid()` under RLS.
- an internal non-API trigger atomically adds the creator as the first `owner` membership.

## RLS model

- profile: current user only.
- organization: member read; owner/admin limited column update; authenticated self-owned insert only.
- organization membership: same-organization read only; no direct browser mutation.
- no anonymous application-table access.
- membership/role helper functions live in a private schema rather than the exposed API schema.

## Deferred deliberately

- client records
- matters/cases
- matter ACL tables
- invitations and role-management UI
- Storage buckets
- audit-event persistence
- RAJIH AI data access

These are deferred to avoid broadening the security surface before the foundation is verified.
