-- gen_random_uuid requires pgcrypto
create extension if not exists "pgcrypto";

create table if not exists public.consultation_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  is_booked boolean not null default false,
  booked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint consultation_slots_time_check check (end_time > start_time)
);

create unique index if not exists consultation_slots_unique_time
  on public.consultation_slots (slot_date, start_time, end_time);

create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  message text,
  slot_id uuid references public.consultation_slots(id) on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table if exists public.consultations
  add column if not exists slot_id uuid references public.consultation_slots(id) on delete set null,
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default now();

alter table if exists public.consultations
  alter column status set default 'pending';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'consultations'
      and column_name = 'slot_id'
  ) then
    execute 'create index if not exists consultations_slot_id_idx on public.consultations (slot_id)';
  end if;
end;
$$;

create index if not exists consultations_user_id_idx
  on public.consultations (user_id);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  teacher_id uuid references auth.users(id) on delete set null,
  level text,
  schedule text,
  created_at timestamptz not null default now()
);

create index if not exists classes_teacher_id_idx
  on public.classes (teacher_id);

create table if not exists public.tests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references auth.users(id) on delete cascade,
  type text not null,
  status text not null default 'assigned',
  score numeric,
  assigned_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists tests_student_id_idx
  on public.tests (student_id);

alter table if exists public.profiles
  add column if not exists role text default 'student',
  add column if not exists class_id uuid references public.classes(id) on delete set null,
  add column if not exists test_status text default 'none';

create index if not exists profiles_class_id_idx
  on public.profiles (class_id);
