-- Adaptive entrance test engine schema
create extension if not exists "pgcrypto";

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tests'
      AND column_name = 'score'
  ) THEN
    EXECUTE 'alter table public.tests rename column score to total_score';
  END IF;
END
$$;

alter table public.tests
  add column if not exists seed_start jsonb,
  add column if not exists time_limit_seconds integer not null default 3000,
  add column if not exists weighted_level numeric,
  add column if not exists started_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists elapsed_ms integer not null default 0;

create index if not exists tests_status_idx on public.tests (status);
create index if not exists tests_type_idx on public.tests (type);

create table if not exists public.question_passages (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  level integer not null,
  sublevel text not null check (sublevel in ('1','2','3')),
  title text not null,
  body text not null,
  tags text[] default '{}',
  created_at timestamptz not null default now()
);

create index if not exists question_passages_section_level_idx
  on public.question_passages (section, level, sublevel);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  level integer not null,
  sublevel text not null check (sublevel in ('1','2','3')),
  passage_id uuid references public.question_passages(id) on delete cascade,
  stem text not null,
  options text[] not null,
  answer_index integer not null,
  skill_tags text[] default '{}',
  media_url text,
  created_at timestamptz not null default now(),
  check (
    (section = 'reading' and passage_id is not null) or
    (section <> 'reading' and passage_id is null)
  )
);

create index if not exists questions_section_level_idx
  on public.questions (section, level, sublevel);

create table if not exists public.test_sections (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  section text not null,
  current_level integer not null,
  current_sublevel text not null check (current_sublevel in ('1','2','3')),
  questions_served integer not null default 0,
  correct_count integer not null default 0,
  incorrect_count integer not null default 0,
  streak_up integer not null default 0,
  streak_down integer not null default 0,
  completed boolean not null default false,
  score numeric,
  final_level numeric,
  created_at timestamptz not null default now(),
  unique (test_id, section)
);

create index if not exists test_sections_test_id_idx on public.test_sections (test_id);
create index if not exists test_sections_section_idx on public.test_sections (section);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.tests(id) on delete cascade,
  section text not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  selected_index integer not null,
  correct boolean not null,
  time_spent_ms integer,
  created_at timestamptz not null default now()
);

create index if not exists responses_test_id_idx on public.responses (test_id);
create index if not exists responses_question_id_idx on public.responses (question_id);

create table if not exists public.entrance_survey (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null,
  score jsonb,
  created_at timestamptz not null default now(),
  unique (student_id)
);

create table if not exists public.analytics_settings (
  id uuid primary key default gen_random_uuid(),
  weights jsonb not null,
  caps jsonb not null,
  streak_rules jsonb not null,
  section_max_questions jsonb not null,
  created_at timestamptz not null default now()
);

insert into public.analytics_settings (id, weights, caps, streak_rules, section_max_questions)
select
  gen_random_uuid(),
  '{"reading":0.4,"grammar":0.3,"listening":0.2,"dialog":0.1}'::jsonb,
  '{"min":"1.1","max":"7.3"}'::jsonb,
  '{"up":3,"down":3,"skip_delta":0.2}'::jsonb,
  '{"reading":20,"grammar":15,"listening":10,"dialog":10}'::jsonb
where not exists (select 1 from public.analytics_settings);
