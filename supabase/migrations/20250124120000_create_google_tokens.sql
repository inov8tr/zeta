create table if not exists public.google_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now())
);

create index if not exists google_tokens_expires_idx on public.google_tokens (expires_at);

alter table public.google_tokens enable row level security;

create policy if not exists "Users can view own Google tokens" on public.google_tokens
  for select
  using (auth.uid() = user_id);

create policy if not exists "Users can insert own Google tokens" on public.google_tokens
  for insert
  with check (auth.uid() = user_id);

create policy if not exists "Users can update own Google tokens" on public.google_tokens
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Users can delete own Google tokens" on public.google_tokens
  for delete
  using (auth.uid() = user_id);
