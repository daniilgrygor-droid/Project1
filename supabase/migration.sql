-- Small Steps — manual payments (run once in the Supabase SQL editor)

-- Plans
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'private'));

alter table public.profiles
  add column if not exists plan_updated_at timestamptz;

-- Founder flag (set your own row to true after running this)
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Payment requests (manual: user pays, founder confirms)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text not null default '',
  amount numeric not null default 48,
  currency text not null default 'USD',
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled')),
  period_start timestamptz,
  period_end timestamptz,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.payments enable row level security;

-- Owner: request (pending) and read own rows
drop policy if exists "owner insert own payment" on public.payments;
create policy "owner insert own payment"
  on public.payments for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'pending');

drop policy if exists "owner read own payment" on public.payments;
create policy "owner read own payment"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

-- Owner: cancel their own pending request
drop policy if exists "owner cancel own pending" on public.payments;
create policy "owner cancel own pending"
  on public.payments for update
  to authenticated
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'cancelled');

-- Admin (founder): read all payments
drop policy if exists "admin read all payments" on public.payments;
create policy "admin read all payments"
  on public.payments for select
  to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_admin
  ));

-- Security-definer helpers (founder only)
create or replace function public.admin_confirm_payment(p_payment_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_is_admin boolean;
  v_payment public.payments%rowtype;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then raise exception 'not_admin'; end if;

  select * into v_payment from public.payments where id = p_payment_id;
  if not found then raise exception 'not_found'; end if;
  if v_payment.status <> 'pending' then raise exception 'not_pending'; end if;

  update public.payments
    set status = 'confirmed',
        confirmed_at = now(),
        period_start = now(),
        period_end = now() + interval '1 year'
    where id = p_payment_id;

  update public.profiles
    set plan = 'private',
        plan_updated_at = now(),
        updated_at = now()
    where id = v_payment.user_id;
end;
$$;

create or replace function public.admin_revoke_private(p_user_id uuid)
returns void
language plpgsql security definer
as $$
declare
  v_is_admin boolean;
begin
  select is_admin into v_is_admin from public.profiles where id = auth.uid();
  if not coalesce(v_is_admin, false) then raise exception 'not_admin'; end if;

  update public.profiles
    set plan = 'free',
        plan_updated_at = now(),
        updated_at = now()
    where id = p_user_id;
end;
$$;

-- Let the app read its own plan (RLS already restricts rows to the owner).
alter table public.profiles
  enable row level security;