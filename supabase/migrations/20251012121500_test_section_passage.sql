alter table public.test_sections
  add column if not exists current_passage_id uuid references public.question_passages(id) on delete set null,
  add column if not exists current_passage_question_count integer not null default 0;

alter table public.responses
  drop constraint if exists responses_test_question_unique;

alter table public.responses
  add constraint responses_test_question_unique unique (test_id, question_id);
