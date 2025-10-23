create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (user_id) on delete set null,
  student_name text,
  parent_email text,
  survey_token text,
  survey_token_expiry timestamptz,
  survey_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists public.students
  add column if not exists survey_token text,
  add column if not exists survey_token_expiry timestamptz,
  add column if not exists survey_completed boolean not null default false;

create index if not exists students_profile_id_idx on public.students (profile_id);

create table if not exists public.parent_surveys (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  completed_by text not null check (completed_by in ('parent', 'admin')),
  data jsonb not null,
  created_at timestamptz not null default now(),
  constraint parent_surveys_student_unique unique (student_id)
);

create index if not exists parent_surveys_student_id_idx on public.parent_surveys (student_id);

alter table public.students enable row level security;
alter table public.parent_surveys enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'students'
      and policyname = 'service_role_full_access_students'
  ) then
    create policy "service_role_full_access_students"
      on public.students
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'parent_surveys'
      and policyname = 'service_role_full_access_parent_surveys'
  ) then
    create policy "service_role_full_access_parent_surveys"
      on public.parent_surveys
      for all
      using (auth.role() = 'service_role')
      with check (auth.role() = 'service_role');
  end if;
end
$$;
