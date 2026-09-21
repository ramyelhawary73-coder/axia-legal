-- AXIA Phase 4A - Core UPDATE grants
-- RLS UPDATE policies already restrict rows and roles. This migration only
-- exposes the UPDATE operation through the Data API for resources that already
-- have a real PATCH endpoint. DELETE remains intentionally unavailable.

grant update on table
  public.clients,
  public.matters,
  public.hearings,
  public.tasks,
  public.financial_records
to authenticated;
