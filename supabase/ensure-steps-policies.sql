-- ============================================================================
-- Small Steps — чиним UPDATE записей (RLS)
--
-- Симптом: создание записи работает, а редактирование не сохраняется.
-- Причина: в БД нет (или некорректная) RLS-политики "steps update own",
-- из-за чего PostgREST отвечает на UPDATE ошибкой 403 / RLS violation.
--
-- Запустить в SQL Editor дашборда Supabase:  supabase.com/dashboard → SQL Editor
-- Скрипт идемпотентный — можно запускать повторно.
-- ============================================================================

-- Проверка: должна вывести только ваши записи (ничего, если записей нет)
select id, note from public.steps where auth.uid() = user_id limit 5;

-- Пересоздаём политику UPDATE (using — какие строки можно менять,
-- with check — что новое значение строки должно оставаться вашим)
drop policy if exists "steps update own" on public.steps;
create policy "steps update own"
  on public.steps
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- На всякий случай пересоздаём и остальные политики (идемпотентно)
drop policy if exists "steps select own" on public.steps;
create policy "steps select own" on public.steps for select using (auth.uid() = user_id);

drop policy if exists "steps insert own" on public.steps;
create policy "steps insert own" on public.steps for insert with check (auth.uid() = user_id);

drop policy if exists "steps delete own" on public.steps;
create policy "steps delete own" on public.steps for delete using (auth.uid() = user_id);

-- Итоговая проверка: список политик таблицы steps
select polname, pg_get_expr(polqual, polrelid) as using_expr
from pg_policy
where polrelid = 'public.steps'::regclass;