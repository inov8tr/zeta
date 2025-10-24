alter table public.profiles
  add column if not exists classroom_enabled boolean not null default false;

comment on column public.profiles.classroom_enabled is 'Controls access to Google Classroom integration for this user.';
