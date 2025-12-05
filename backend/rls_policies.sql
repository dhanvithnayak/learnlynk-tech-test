-- Since there is no information given right now about how we know which team a lead is assigned to,
-- I'll add a team_id field to the leads table
alter table public.leads add column if not exists team_id uuid references public.teams(id);
-- Doesn't have any safeguards yet such as ensuring not null and cascade delete, but this is a start

alter table public.leads enable row level security;

create policy "leads_select_policy"
on public.leads
for select
using (
  (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'admin'
    and tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
  )
  or
  (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'counselor'
    and tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
    and (
      owner_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
      or team_id in (
        select team_id
        from public.user_teams
        where user_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'user_id')::uuid
      )
    )
  )
);

create policy "leads_insert_policy"
on public.leads
for insert
with check (
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role') in ('admin', 'counselor')
  and tenant_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid
);
