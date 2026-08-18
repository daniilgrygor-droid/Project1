-- ============================================================================
-- Small Steps — синхронизация таблицы steps с текущей схемой
--
-- Симптом: "Could not find the 'category' column of 'steps' in the schema cache"
-- Причина: живая таблица steps создана по старой схеме и не имеет колонок
-- category / mood / showed_up_only, либо PostgREST держит устаревший кэш схемы.
-- Скрипт идемпотентный — безопасно запускать повторно.
--
-- Запустить в SQL Editor дашборда Supabase:  supabase.com/dashboard → SQL Editor
-- ============================================================================

-- ---------- 1. Колонки category / mood / showed_up_only (если их нет) --------
alter table public.steps
  add column if not exists category text,
  add column if not exists mood smallint,
  add column if not exists showed_up_only boolean not null default false;

-- ---------- 2. Ограничения-проверки (пересоздаём аккуратно) -----------------
alter table public.steps
  drop constraint if exists steps_note_check;
alter table public.steps
  add constraint steps_note_check
  check (char_length(note) between 1 and 2000);

alter table public.steps
  drop constraint if exists steps_category_check;
alter table public.steps
  add constraint steps_category_check
  check (category in ('body','work','study','home','rest','people','other'));

alter table public.steps
  drop constraint if exists steps_mood_check;
alter table public.steps
  add constraint steps_mood_check
  check (mood between 1 and 5);

alter table public.steps
  drop constraint if exists steps_user_id_not_null;
alter table public.steps
  alter column user_id set not null;

-- ---------- 3. RLS-политики (если их нет) -----------------------------------
alter table public.steps enable row level security;

drop policy if exists "steps select own" on public.steps;
create policy "steps select own" on public.steps for select using (auth.uid() = user_id);

drop policy if exists "steps insert own" on public.steps;
create policy "steps insert own" on public.steps for insert with check (auth.uid() = user_id);

drop policy if exists "steps update own" on public.steps;
create policy "steps update own"
  on public.steps
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "steps delete own" on public.steps;
create policy "steps delete own" on public.steps for delete using (auth.uid() = user_id);

-- ---------- 4. Перезагрузка кэша схемы PostgREST ----------------------------
-- Без этого PostgREST может продолжать отвечать старой схемой.
select pg_notify('pgrst', 'reload schema');

-- ---------- 5. Проверка ------------------------------------------------------
-- Должны появиться строки со столбцами category и mood:
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'steps'
order by ordinal_position;

select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.steps'::regclass;