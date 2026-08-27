-- Referral program: each user gets a short code, can refer others via ?ref=CODE
alter table public.profiles
  add column if not exists referral_code text unique;

alter table public.profiles
  add column if not exists referred_by uuid references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists referral_credited boolean not null default false;

create index if not exists profiles_referral_code_idx on public.profiles (referral_code);
create index if not exists profiles_referred_by_idx on public.profiles (referred_by);

-- Backfill codes for existing users
update public.profiles
  set referral_code = substr(md5(id::text), 1, 8)
  where referral_code is null;

-- Auto-generate on new profiles if trigger didn't set it
create or replace function public.ensure_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null then
    new.referral_code := substr(md5(new.id::text || now()::text), 1, 8);
  end if;
  return new;
end;
$$;

drop trigger if exists ensure_referral_code_trigger on public.profiles;
create trigger ensure_referral_code_trigger
  before insert on public.profiles
  for each row execute function public.ensure_referral_code();
