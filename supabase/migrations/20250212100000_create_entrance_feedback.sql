create table if not exists public.entrance_feedback (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(user_id) on delete cascade,
    test_id uuid not null references public.tests(id) on delete cascade,
    estimated_level numeric,
    total_score numeric,
    accuracy numeric,
    time_spent interval,
    grammar_score numeric,
    reading_score numeric,
    listening_score numeric,
    dialog_score numeric,
    feedback_text text,
    created_at timestamptz not null default now(),
    unique (test_id)
);

create index if not exists entrance_feedback_user_id_idx on public.entrance_feedback (user_id);
create index if not exists entrance_feedback_test_id_idx on public.entrance_feedback (test_id);
