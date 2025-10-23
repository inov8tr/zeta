alter table public.profiles
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz;
