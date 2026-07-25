-- ============================================================================
-- Readiness SaaS — initial schema
-- ============================================================================
-- Run against your Supabase project (SQL editor or `supabase db push`).
-- Enables Row Level Security so users can only ever read/write their own data.
-- ============================================================================

-- Enum for onboarding progress.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'onboarding_status') then
    create type public.onboarding_status as enum ('pending', 'in_progress', 'completed');
  end if;
end$$;

-- ----------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on sign up.
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  email             text,
  full_name         text,
  company           text,
  role              text,
  team_size         text,
  primary_goal      text,
  onboarding_status public.onboarding_status not null default 'pending',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- assessments: each questionnaire submission.
-- ----------------------------------------------------------------------------
create table if not exists public.assessments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  answers       jsonb not null default '{}'::jsonb,
  score         integer check (score between 0 and 100),
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists assessments_user_id_created_at_idx
  on public.assessments (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- summaries: AI-generated summary linked to an assessment.
-- ----------------------------------------------------------------------------
create table if not exists public.summaries (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  assessment_id  uuid not null references public.assessments (id) on delete cascade,
  content        text not null,
  model          text,
  highlights     jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists summaries_user_id_created_at_idx
  on public.summaries (user_id, created_at desc);
create index if not exists summaries_assessment_id_idx
  on public.summaries (assessment_id);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-provision a profile row when a new auth user is created.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles    enable row level security;
alter table public.assessments enable row level security;
alter table public.summaries   enable row level security;

-- profiles ------------------------------------------------------------------
drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Profiles are insertable by owner" on public.profiles;
create policy "Profiles are insertable by owner"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Profiles are updatable by owner" on public.profiles;
create policy "Profiles are updatable by owner"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- assessments ---------------------------------------------------------------
drop policy if exists "Assessments are viewable by owner" on public.assessments;
create policy "Assessments are viewable by owner"
  on public.assessments for select
  using (auth.uid() = user_id);

drop policy if exists "Assessments are insertable by owner" on public.assessments;
create policy "Assessments are insertable by owner"
  on public.assessments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Assessments are updatable by owner" on public.assessments;
create policy "Assessments are updatable by owner"
  on public.assessments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- summaries -----------------------------------------------------------------
drop policy if exists "Summaries are viewable by owner" on public.summaries;
create policy "Summaries are viewable by owner"
  on public.summaries for select
  using (auth.uid() = user_id);

drop policy if exists "Summaries are insertable by owner" on public.summaries;
create policy "Summaries are insertable by owner"
  on public.summaries for insert
  with check (auth.uid() = user_id);
