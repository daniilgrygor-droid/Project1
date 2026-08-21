-- ============================================================================
-- Small Steps — схема Supabase
-- Запустить в SQL Editor дашборда Supabase:  supabase.com/dashboard → SQL
-- ============================================================================

-- ---------- Лист ожидания (лендинг, без аккаунта) --------------------------
create table if not exists public.waitlist (
  id         bigint generated always as identity primary key,
  email      text not null unique,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Любой посетитель может оставить email на лендинге
create policy "waitlist insert for everyone"
  on public.waitlist for insert
  with check (true);

-- ---------- Профили пользователей ------------------------------------------
create table if not exists public.profiles (
  id               uuid primary key references auth.users (id) on delete cascade,
  name             text,
  context          text,
  reply_length     text not null default 'short'
                   check (reply_length in ('short', 'long')),
  weekly_email     boolean not null default true,
  unsubscribe_token uuid not null default gen_random_uuid(),
  email_lookup     text,
  reminder_enabled boolean not null default false,
  reminder_time    text not null default '19:00',
  reminder_days    text not null default '1,2,3,4,5,6,7',
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles select own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles insert own"   on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update own"   on public.profiles for update using (auth.uid() = id);

-- Создаём профиль автоматически при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email_lookup)
  values (new.id, lower(new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Маленькие шаги --------------------------------------------------
create table if not exists public.steps (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  note           text not null check (char_length(note) between 1 and 2000),
  category       text check (category in ('body','work','study','home','rest','people','other')),
  mood           smallint check (mood between 1 and 5),
  showed_up_only boolean not null default false,
  ai_response    text,
  created_at     timestamptz not null default now()
);

create index if not exists steps_user_created_idx
  on public.steps (user_id, created_at desc);

-- Лечим уже созданные по старой схеме таблицы (идемпотентно)
alter table public.steps
  add column if not exists category text,
  add column if not exists mood smallint;

alter table public.steps enable row level security;

create policy "steps select own" on public.steps for select using (auth.uid() = user_id);
create policy "steps insert own" on public.steps for insert with check (auth.uid() = user_id);
create policy "steps update own" on public.steps for update using (auth.uid() = user_id);
create policy "steps delete own" on public.steps for delete using (auth.uid() = user_id);

-- ---------- Еженедельная тёплая сводка (расписание) --------------------------
-- Требуется расширение pg_cron и pg_net:
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
-- Потом расписание (по воскресеньям в 9 утра UTC):
--   select cron.schedule(
--     'weekly-summary',
--     '0 9 * * 0',
--     $$
--     select net.http_post(
--       url := '<project-ref>.supabase.co/functions/v1/weekly-summary',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <service_role_key>'
--       ),
--       body := '{}'
--     );
--     $$
--   );
--
-- Обратите внимание: у сервисного ключа есть полный доступ к БД. Держите его
-- в секрете и нигде не публикуйте. Если не хотите расписание в БД — можно
-- ставить вызов функции по cron извне (GitHub Actions, cron-job.org и т.п.).

-- ---------- Ежедневные напоминания (расписание) ------------------------------
-- Запускается каждые 5 минут, отправляет напоминания тем, у кого включены
-- reminders и наступило их время:
--   create extension if not exists pg_cron;
--   create extension if not exists pg_net;
--
--   select cron.schedule(
--     'daily-reminder',
--     '*/5 * * * *',
--     $$
--     select net.http_post(
--       url := '<project-ref>.supabase.co/functions/v1/daily-reminder',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'Authorization', 'Bearer <service_role_key>'
--       ),
--       body := '{}'
--     );
--     $$
--   );

-- ---------- Автоматический expiry плана ----------------------------------------
-- Каждый день проверяет, истёк ли Private план, и откатывает на free:
--   select cron.schedule(
--     'expire-private-plans',
--     '0 3 * * *',
--     $$
--     update public.profiles
--     set plan = 'free', updated_at = now()
--     where plan = 'private'
--       and period_end is not null
--       and period_end < now();
--     $$
--   );
