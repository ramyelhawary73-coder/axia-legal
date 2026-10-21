-- Disposable representative tenant fixture, never a hosted schema bootstrap.
do $$ begin
  if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
  if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
end $$;
create schema auth;
create schema private;
grant usage on schema auth,private,public to authenticated;
grant usage on schema public to anon;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,is_anonymous boolean default false,banned_until timestamptz);
create table auth.mfa_factors(id uuid primary key,user_id uuid references auth.users(id),factor_type text,status text);
create table auth.sessions(id uuid primary key,user_id uuid references auth.users(id),factor_id uuid,aal text,not_after timestamptz);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
grant execute on function auth.jwt(),auth.uid() to authenticated;
create table public.organizations(id uuid primary key,name text not null,slug text not null,created_at timestamptz default now());
create table public.organization_members(organization_id uuid references public.organizations(id),user_id uuid references auth.users(id),role text,primary key(organization_id,user_id));
create function private.is_organization_member(target uuid) returns boolean language sql security definer set search_path='' as $$
  select exists(select 1 from public.organization_members where organization_id=target and user_id=auth.uid());
$$;
revoke all on function private.is_organization_member(uuid) from public,anon;
grant execute on function private.is_organization_member(uuid) to authenticated;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
create policy offices_same_tenant on public.organizations for select to authenticated using(private.is_organization_member(id));
create policy members_same_tenant on public.organization_members for select to authenticated using(private.is_organization_member(organization_id));
grant select on public.organizations,public.organization_members to authenticated;
do $$ declare t text; begin
  foreach t in array array['clients','matters','tasks','financial_records','documents'] loop
    execute format('create table public.%I(id uuid primary key,organization_id uuid references public.organizations(id),title text)',t);
    execute format('alter table public.%I enable row level security',t);
    execute format('create policy tenant_only on public.%I to authenticated using(private.is_organization_member(organization_id)) with check(private.is_organization_member(organization_id))',t);
    execute format('grant select,insert,update on public.%I to authenticated',t);
  end loop;
end $$;
