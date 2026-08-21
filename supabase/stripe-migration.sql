-- Small Steps — Stripe integration (run in Supabase SQL editor)

-- Add Stripe columns to profiles
alter table public.profiles
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

-- Add stripe_session_id to payments for webhook matching
alter table public.payments
  add column if not exists stripe_session_id text;

-- Create index for webhook lookups
create index if not exists idx_payments_stripe_session
  on public.payments (stripe_session_id);

-- Update the auto-expiry cron to use stripe_subscription_id as fallback
-- (The existing pg_cron job already handles plan expiry via period_end)
