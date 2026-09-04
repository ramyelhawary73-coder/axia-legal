-- AXIA Legal Phase 1B — keep trigger-only helper functions non-callable from API roles.
revoke all on function public.set_updated_at() from public, anon, authenticated;
