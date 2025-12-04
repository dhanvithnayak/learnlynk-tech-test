-- Indexes have been created according to TODOs listed here instead of the README
-- since they seemed more extensive to me

create extension if not exists "pgcrypto";

-- Leads table
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  owner_id uuid not null,
  email text,
  phone text,
  full_name text,
  stage text not null default 'new',
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- For queries filtering leads by tenant and owner
create index if not exists index_leads_owner on public.leads (tenant_id, owner_id);
--- "Show all leads for this tenant in a given stage"
create index if not exists index_leads_stage on public.leads (tenant_id, stage);
--- Filtering through most recently created leads for a tenant
create index if not exists index_leads_created on public.leads (tenant_id, created_at desc);


-- Applications table
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lead_id uuid not null references public.leads(id) on delete cascade,
  program_id uuid,
  intake_id uuid,
  stage text not null default 'inquiry',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists index_applications_lead on public.applications (tenant_id, lead_id);
create index if not exists index_applications_stage on public.applications (tenant_id, stage);


-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  application_id uuid not null references public.applications(id) on delete cascade,
  title text,
  type text not null constraint check_tasks_type check (type in ('call', 'email', 'review')),
  status text not null default 'open',
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint check_tasks_due_created check (due_at >= created_at)
);

create index if not exists index_tasks_due on public.tasks (tenant_id, due_at);
create index if not exists index_tasks_status on public.tasks (tenant_id, status);
