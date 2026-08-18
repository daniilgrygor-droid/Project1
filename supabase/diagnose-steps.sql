-- ============================================================================
-- Small Steps — диагностика таблицы steps
-- Запустить в SQL Editor и прислать результат (это не меняет данные).
-- ============================================================================

-- К какой базе мы вообще подключены (сравни с VITE_SUPABASE_URL из .env)
select current_database() as db, current_user as role;

-- Фактические колонки таблицы steps
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'steps'
order by ordinal_position;

-- Сколько записей
select count(*) as step_count from public.steps;

-- Какие RLS-политики есть у steps
select polname from pg_policy where polrelid = 'public.steps'::regclass;

-- Перезагрузка кэша схемы PostgREST (нужно после любых изменений схемы)
select pg_notify('pgrst', 'reload schema');