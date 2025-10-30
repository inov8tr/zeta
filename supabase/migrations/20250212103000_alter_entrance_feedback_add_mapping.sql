alter table if exists public.entrance_feedback
  add column if not exists band text,
  add column if not exists lexile text,
  add column if not exists cefr text,
  add column if not exists korean_equiv text,
  add column if not exists us_equiv text;

