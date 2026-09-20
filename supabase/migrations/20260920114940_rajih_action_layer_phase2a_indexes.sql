create index tasks_created_by_idx
  on public.tasks(created_by);

create index rajih_action_requests_approved_by_idx
  on public.rajih_action_requests(approved_by)
  where approved_by is not null;
