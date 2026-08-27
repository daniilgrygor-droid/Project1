-- FTS for steps: trigram index for fast ilike search in Journey
create extension if not exists pg_trgm;

create index if not exists steps_note_trgm_idx
  on public.steps using gin (note gin_trgm_ops);

create index if not exists steps_category_idx
  on public.steps (category);

create index if not exists steps_mood_idx
  on public.steps (mood);
